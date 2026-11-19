import { test } from "node:test";
import assert from "node:assert/strict";
import { buildMaterialCrmPayload, deliverMaterialLead, materialLeadSchema, type MaterialLeadData } from "@/lib/material";
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
