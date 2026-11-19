import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMaterialCrmPayload,
  buildMaterialWebhookPayload,
  deliverMaterialLead,
  materialLeadSchema,
  parsePageUrl,
  processMaterialLead,
  type MaterialLeadData,
} from "@/lib/material";
import { checkLeadRateLimit, releaseLeadRateLimit, type Limiter, type Limiters } from "@/lib/rate-limit";
import { captureErrors, fakeFetch, semDadosPessoais, throwingFetch, tracking, type FetchCall } from "./helpers";

// Sempre um host fictício: os testes nunca chamam o CRM real.
function withCrmEnv() {
  process.env.CRM_API_URL = "https://crm.ex.com/";
  process.env.CRM_EXTERNAL_LEADS_API_KEY = "chave";
}

const lead: MaterialLeadData = { nome: "Ana Souza", telefone: "+5561911110001", email: "ana@ex.com" };

const issues = (data: unknown) => {
  const r = materialLeadSchema.safeParse(data);
  return r.success ? [] : [...new Set(r.error.issues.map((i) => String(i.path[0])))];
};

// ---------- Validação ----------

test("material: lead válido passa e apara espaços", () => {
  const r = materialLeadSchema.parse({ nome: "  Ana Souza ", telefone: "+5561911110001", email: " ana@ex.com " });
  assert.deepEqual(r, lead);
});

test("material: os 3 campos são obrigatórios", () => {
  assert.deepEqual(issues({}).sort(), ["email", "nome", "telefone"]);
  assert.deepEqual(issues({ nome: "", telefone: "", email: "" }).sort(), ["email", "nome", "telefone"]);
});

test("material: e-mail e WhatsApp inválidos são recusados", () => {
  assert.deepEqual(issues({ ...lead, email: "ana@" }), ["email"]);
  assert.deepEqual(issues({ ...lead, telefone: "+5512" }), ["telefone"]);
  assert.deepEqual(issues({ ...lead, nome: "A" }), ["nome"]);
});

test("material: WhatsApp de outro DDI (Portugal) é aceito", () => {
  assert.deepEqual(issues({ ...lead, telefone: "+351912345678" }), []);
});

// ---------- Payload / envio ao CRM ----------

test("material payload: só os campos do form + UTMs, sem inventar atuação/investimento/tipo_lead", () => {
  assert.deepEqual(buildMaterialCrmPayload(lead, tracking, undefined), {
    destination: "hq",
    source: "alpha-franchise",
    name: "Ana Souza",
    email: "ana@ex.com",
    phone: "+5561911110001",
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "franquia",
    utm_content: undefined,
    utm_term: undefined,
    fbclid: "abc",
  });
});

test("material payload: sdr_email só quando CRM_SDR_EMAIL existe", () => {
  assert.equal("sdr_email" in buildMaterialCrmPayload(lead, {}, undefined), false);
  assert.equal(buildMaterialCrmPayload(lead, {}, "sdr@ex.com").sdr_email, "sdr@ex.com");
});

test("material envio (LEAD_DESTINATION=crm): 1 POST em /external/leads com x-api-key", async () => {
  withCrmEnv();
  const calls: FetchCall[] = [];
  const res = await deliverMaterialLead(lead, tracking, {
    destination: "crm",
    fetchImpl: fakeFetch(() => new Response(JSON.stringify({ crmLeadId: "1" }), { status: 201 }), calls),
  });
  assert.deepEqual(res, { ok: true, httpStatus: 201 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://crm.ex.com/external/leads");
  assert.equal((calls[0].init.headers as Record<string, string>)["x-api-key"], "chave");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.name, "Ana Souza");
  assert.equal(body.phone, "+5561911110001");
  for (const k of ["atuacao", "faturamento_agencia", "inicio", "investimento", "tipo_lead"]) {
    assert.equal(k in body, false, `${k} não deveria ir no payload`);
  }
});

test("material envio: CRM 4xx → falha, log sem dados pessoais", async () => {
  withCrmEnv();
  const logs = await captureErrors(async () => {
    const res = await deliverMaterialLead(lead, tracking, {
      destination: "crm",
      fetchImpl: fakeFetch(() => new Response(JSON.stringify({ code: "INVALID", message: "ana@ex.com" }), { status: 400 })),
    });
    assert.deepEqual(res, { ok: false, httpStatus: 400, reason: "INVALID" });
  });
  assert.ok(semDadosPessoais(logs));
});

test("material envio: falha de rede → falha", async () => {
  withCrmEnv();
  await captureErrors(async () => {
    const res = await deliverMaterialLead(lead, tracking, {
      destination: "crm",
      fetchImpl: throwingFetch(new DOMException("timeout", "TimeoutError")),
    });
    assert.equal(res.ok, false);
  });
});

test("material envio: LEAD_DESTINATION diferente de crm não chama nada", async () => {
  withCrmEnv();
  for (const destination of ["webhook", null] as const) {
    await captureErrors(async () => {
      const res = await deliverMaterialLead(lead, tracking, {
        destination,
        fetchImpl: throwingFetch(new Error("não deveria chamar")),
      });
      assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "destination_not_configured" });
    });
  }
});

// ---------- Rate limit com escopo "material-demanda" ----------

function memoryLimiters() {
  const seen: string[] = [];
  const make = (max: number): Limiter => {
    const counts = new Map<string, number>();
    return {
      async limit(key) {
        seen.push(key);
        const n = (counts.get(key) ?? 0) + 1;
        counts.set(key, n);
        return { success: n <= max, reset: 5 * 60_000 };
      },
      async resetUsedTokens(key) {
        counts.delete(key);
      },
    };
  };
  const limiters: Limiters = { email: make(1), telefone: make(1), ip: make(3) };
  return { limiters, seen };
}

const input = { email: "ana@ex.com", telefone: "+5561911110001", ip: "200.1.1.1" };

test("rate limit material: chaves com prefixo material-demanda: e só hash", async () => {
  const { limiters, seen } = memoryLimiters();
  await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0);
  assert.equal(seen.length, 3);
  assert.match(seen[0], /^material-demanda:email:[0-9a-f]{64}$/);
  assert.match(seen[1], /^material-demanda:telefone:[0-9a-f]{64}$/);
  assert.match(seen[2], /^material-demanda:ip:[0-9a-f]{64}$/);
  assert.ok(seen.every((k) => !k.includes("ana") && !k.includes("5561") && !k.includes("200.1")));
});

test("rate limit material: 2º envio bloqueia; escopo da franquia é separado", async () => {
  const { limiters } = memoryLimiters();
  assert.equal((await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0)).ok, true);
  assert.equal((await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0)).ok, false);
  // Mesmo e-mail no form da franquia (escopo padrão) não está bloqueado.
  assert.equal((await checkLeadRateLimit(input, limiters, 0)).ok, true);
});

test("rate limit material: CRM falhou → cota devolvida para tentar de novo", async () => {
  const { limiters } = memoryLimiters();
  await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0);
  await releaseLeadRateLimit({ ...input, scope: "material-demanda" }, limiters);
  assert.equal((await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0)).ok, true);
});

// ---------- Webhook do n8n (cópia do lead depois do CRM) ----------
// Hosts fictícios: nunca a URL real do CRM nem do n8n.

const CRM_URL = "https://crm.ex.com/external/leads";
const WEBHOOK_URL = "https://n8n.ex.com/webhook/teste";
const PAGE_URL = "https://lp.ex.com/material-geracao-de-demanda?utm_source=facebook";

// fetch falso que responde por URL e guarda cada chamada.
function routedFetch(routes: Record<string, () => Response | Promise<Response>>, calls: FetchCall[]) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const handler = routes[url];
    if (!handler) throw new Error(`URL inesperada no teste: ${url}`);
    return handler();
  }) as unknown as typeof fetch;
}

const ok201 = () => new Response(JSON.stringify({ ok: true }), { status: 201 });

function submit(fetchImpl: typeof fetch) {
  withCrmEnv();
  return processMaterialLead(
    { data: lead, rawTracking: tracking, rawPageUrl: PAGE_URL, ip: "200.1.1.1" },
    { fetchImpl, destination: "crm", limiters: memoryLimiters().limiters, webhookUrl: WEBHOOK_URL }
  );
}

test("webhook payload: campos pedidos, telefone E.164, origem fixa e enviado_em ISO", () => {
  const p = buildMaterialWebhookPayload(lead, tracking, PAGE_URL, new Date("2026-11-19T17:00:00Z"));
  assert.deepEqual(p, {
    nome: "Ana Souza",
    email: "ana@ex.com",
    telefone: "+5561911110001",
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "franquia",
    utm_content: "",
    utm_term: "",
    fbclid: "abc",
    origem: "material-5-hacks-geracao-de-demanda",
    page_url: PAGE_URL,
    enviado_em: "2026-11-19T14:00:00-03:00",
  });
});

test("page_url: só http(s); qualquer outra coisa vira vazio", () => {
  assert.equal(parsePageUrl(PAGE_URL), PAGE_URL);
  assert.equal(parsePageUrl("javascript:alert(1)"), "");
  assert.equal(parsePageUrl(123), "");
  assert.equal(parsePageUrl(`https://x.com/${"a".repeat(1200)}`), "");
});

test("fluxo: CRM ok + webhook ok → 1 chamada em cada e redireciona", async () => {
  const calls: FetchCall[] = [];
  const res = await submit(routedFetch({ [CRM_URL]: ok201, [WEBHOOK_URL]: ok201 }, calls));
  assert.deepEqual(res, { success: true, redirectTo: "/material-geracao-de-demanda/obrigado" });
  assert.deepEqual(
    calls.map((c) => c.url),
    [CRM_URL, WEBHOOK_URL]
  );
  const body = JSON.parse(String(calls[1].init.body));
  assert.equal(body.origem, "material-5-hacks-geracao-de-demanda");
  assert.equal(body.page_url, PAGE_URL);
  assert.ok(calls[1].init.signal instanceof AbortSignal);
});

test("fluxo: webhook fora (500 ou rede) → ainda redireciona; log sem URL nem dados", async () => {
  for (const webhook of [
    () => new Response("erro ana@ex.com", { status: 500 }),
    () => {
      throw new DOMException("timeout ana@ex.com", "TimeoutError");
    },
  ]) {
    const calls: FetchCall[] = [];
    let res;
    const logs = await captureErrors(async () => {
      res = await submit(routedFetch({ [CRM_URL]: ok201, [WEBHOOK_URL]: webhook }, calls));
    });
    assert.deepEqual(res, { success: true, redirectTo: "/material-geracao-de-demanda/obrigado" });
    assert.equal(calls.length, 2);
    assert.ok(semDadosPessoais(logs));
    assert.ok(logs.every((l) => !l.includes("n8n") && !l.includes("ex.com")));
  }
});

test("fluxo: webhook sem env → ainda redireciona", async () => {
  withCrmEnv();
  const calls: FetchCall[] = [];
  let res;
  await captureErrors(async () => {
    res = await processMaterialLead(
      { data: lead, rawTracking: tracking, rawPageUrl: PAGE_URL, ip: null },
      { fetchImpl: routedFetch({ [CRM_URL]: ok201 }, calls), destination: "crm", limiters: null, webhookUrl: "" }
    );
  });
  assert.equal(res!.success, true);
  assert.equal(calls.length, 1);
});

test("fluxo: CRM fora → não chama o webhook e pede para tentar de novo", async () => {
  const calls: FetchCall[] = [];
  let res;
  await captureErrors(async () => {
    res = await submit(
      routedFetch(
        { [CRM_URL]: () => new Response(JSON.stringify({ code: "DOWN" }), { status: 503 }), [WEBHOOK_URL]: ok201 },
        calls
      )
    );
  });
  assert.deepEqual(res, {
    success: false,
    reason: "destination",
    error: "Não conseguimos enviar agora. Tente de novo em instantes.",
  });
  assert.deepEqual(
    calls.map((c) => c.url),
    [CRM_URL]
  );
});
