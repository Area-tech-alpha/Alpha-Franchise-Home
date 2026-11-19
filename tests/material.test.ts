import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMaterialWebhookPayload,
  materialLeadSchema,
  parsePageUrl,
  processMaterialLead,
  sendMaterialToWebhook,
  type MaterialLeadData,
} from "@/lib/material";
import { checkLeadRateLimit, releaseLeadRateLimit, type Limiter, type Limiters } from "@/lib/rate-limit";
import { captureErrors, semDadosPessoais, tracking, type FetchCall } from "./helpers";

// Hosts fictícios: os testes nunca chamam a URL real do n8n (nem o CRM).
const WEBHOOK_URL = "https://n8n.ex.com/webhook/teste";
const PAGE_URL = "https://lp.ex.com/material-geracao-de-demanda?utm_source=facebook";
const OBRIGADO = { success: true, redirectTo: "/material-geracao-de-demanda/obrigado" };
const TENTE_DE_NOVO = {
  success: false,
  reason: "destination",
  error: "Não conseguimos enviar agora. Tente de novo em instantes.",
};

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

// ---------- Payload do webhook ----------

test("webhook payload: campos pedidos, telefone E.164, tag isca, origem fixa e enviado_em ISO", () => {
  const p = buildMaterialWebhookPayload(lead, tracking, PAGE_URL, new Date("2026-11-19T17:00:00Z"));
  assert.deepEqual(p, {
    nome: "Ana Souza",
    email: "ana@ex.com",
    telefone: "+5561911110001",
    tag: "isca",
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

test("rate limit material: webhook falhou → cota devolvida para tentar de novo", async () => {
  const { limiters } = memoryLimiters();
  await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0);
  await releaseLeadRateLimit({ ...input, scope: "material-demanda" }, limiters);
  assert.equal((await checkLeadRateLimit({ ...input, scope: "material-demanda" }, limiters, 0)).ok, true);
});


// ---------- Envio: SÓ o webhook do n8n ----------

// fetch falso: responde a qualquer URL com o handler e guarda cada chamada.
function mockFetch(handler: () => Response | Promise<Response>, calls: FetchCall[]) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return handler();
  }) as unknown as typeof fetch;
}

const ok200 = () => new Response("ok", { status: 200 });

async function submit(handler: () => Response | Promise<Response>, opts: { webhookUrl?: string; limiters?: Limiters } = {}) {
  const calls: FetchCall[] = [];
  const limiters = opts.limiters ?? memoryLimiters().limiters;
  let res: unknown;
  const logs = await captureErrors(async () => {
    res = await processMaterialLead(
      { data: lead, rawTracking: tracking, rawPageUrl: PAGE_URL, ip: "200.1.1.1" },
      { fetchImpl: mockFetch(handler, calls), limiters, webhookUrl: opts.webhookUrl ?? WEBHOOK_URL }
    );
  });
  return { res, calls, logs, limiters };
}

test("fluxo: webhook ok → 1 POST só no webhook (nenhum CRM) e redireciona", async () => {
  process.env.CRM_API_URL = "https://crm.ex.com/";
  process.env.LEAD_DESTINATION = "crm";
  const { res, calls } = await submit(ok200);
  assert.deepEqual(res, OBRIGADO);
  assert.deepEqual(
    calls.map((c) => c.url),
    [WEBHOOK_URL]
  );
  assert.equal(calls[0].init.method, "POST");
  assert.equal((calls[0].init.headers as Record<string, string>)["Content-Type"], "application/json");
  assert.ok(calls[0].init.signal instanceof AbortSignal);
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.tag, "isca");
  assert.equal(body.telefone, "+5561911110001");
  assert.equal(body.origem, "material-5-hacks-geracao-de-demanda");
  assert.equal(body.page_url, PAGE_URL);
});

test("fluxo: não depende de LEAD_DESTINATION (vazia ou webhook continua indo pro n8n)", async () => {
  for (const value of [undefined, "webhook", "xyz"]) {
    if (value === undefined) delete process.env.LEAD_DESTINATION;
    else process.env.LEAD_DESTINATION = value;
    const { res, calls } = await submit(ok200);
    assert.deepEqual(res, OBRIGADO);
    assert.deepEqual(
      calls.map((c) => c.url),
      [WEBHOOK_URL]
    );
  }
});

test("fluxo: webhook fora (500, rede, timeout) → tente de novo; log sem URL nem dados", async () => {
  for (const handler of [
    () => new Response("erro ana@ex.com", { status: 500 }),
    () => {
      throw new TypeError("fetch failed ana@ex.com");
    },
    () => {
      throw new DOMException("timeout ana@ex.com", "TimeoutError");
    },
  ]) {
    const { res, calls, logs } = await submit(handler);
    assert.deepEqual(res, TENTE_DE_NOVO);
    assert.equal(calls.length, 1);
    assert.ok(semDadosPessoais(logs));
    assert.ok(logs.every((l) => !l.includes("n8n") && !l.includes("ex.com") && !l.includes("http")));
  }
});

test("fluxo: webhook falhou → cota devolvida; nova tentativa passa", async () => {
  const { limiters } = memoryLimiters();
  const first = await submit(() => new Response("", { status: 502 }), { limiters });
  assert.deepEqual(first.res, TENTE_DE_NOVO);
  const second = await submit(ok200, { limiters });
  assert.deepEqual(second.res, OBRIGADO);
});

test("fluxo: sem LEAD_WEBHOOK_URL_MATERIAL → tente de novo, sem chamar nada", async () => {
  const { res, calls, logs } = await submit(ok200, { webhookUrl: "" });
  assert.deepEqual(res, TENTE_DE_NOVO);
  assert.equal(calls.length, 0);
  assert.ok(logs.some((l) => l.includes("LEAD_WEBHOOK_URL_MATERIAL")));
});

test("envio: status/motivo no retorno do webhook", async () => {
  const payload = buildMaterialWebhookPayload(lead, tracking, PAGE_URL);
  await captureErrors(async () => {
    assert.deepEqual(await sendMaterialToWebhook(payload, mockFetch(ok200, []), WEBHOOK_URL), { ok: true, httpStatus: 200 });
    assert.deepEqual(
      await sendMaterialToWebhook(payload, mockFetch(() => new Response("", { status: 404 }), []), WEBHOOK_URL),
      { ok: false, httpStatus: 404, reason: "http_404" }
    );
  });
});
