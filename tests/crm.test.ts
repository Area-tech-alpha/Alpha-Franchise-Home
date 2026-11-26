import { test } from "node:test";
import assert from "node:assert/strict";
import { buildCrmLeadPayload, sendLeadToCrm } from "@/lib/crm";
import { captureErrors, fakeFetch, lead, semDadosPessoais, throwingFetch, tracking, type FetchCall } from "./helpers";

function withCrmEnv() {
  process.env.CRM_API_URL = "https://crm.ex.com/";
  process.env.CRM_LEAD_INTAKE_KEY = "chave";
}

test("crm payload: origem alpha-franchise, campos do form e UTMs", () => {
  assert.deepEqual(buildCrmLeadPayload(lead, tracking), {
    origem: "alpha-franchise",
    nome: "Ana Souza",
    email: "ana@ex.com",
    telefone: "+5561911110001",
    atuacao: "Dono (a) de agência",
    faturamento_agencia: "De 50 mil até 100 mil",
    inicio: "3 meses",
    investimento: "De 80 mil até 100 mil",
    tipo_lead: "a",
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "franquia",
    utm_content: undefined,
    utm_term: undefined,
    fbclid: "abc",
    landing_page: "https://lp.ex.com/?utm_source=facebook&fbclid=abc",
    referrer: "https://l.facebook.com/",
  });
});

test("crm payload: tipo_lead b e c pela atuação", () => {
  const b = buildCrmLeadPayload({ ...lead, atuacao: "Sou empresário de outro ramo", faturamento_agencia: undefined }, {});
  const c = buildCrmLeadPayload({ ...lead, atuacao: "Quero empreender", faturamento_agencia: undefined }, {});
  assert.equal(b.tipo_lead, "b");
  assert.equal(c.tipo_lead, "c");
});

test("crm payload: nunca manda destination (o CRM decide pela rota: Comercial Franquias)", () => {
  assert.equal("destination" in buildCrmLeadPayload(lead, tracking), false);
});

test("crm envio: URL da entrada de franquia, x-api-key e corpo JSON", async () => {
  withCrmEnv();
  const calls: FetchCall[] = [];
  const res = await sendLeadToCrm(
    buildCrmLeadPayload(lead, tracking),
    fakeFetch(() => new Response(JSON.stringify({ status: "crm", crmLeadId: "123" }), { status: 200 }), calls)
  );
  assert.deepEqual(res, { ok: true, httpStatus: 200 });
  assert.equal(calls[0].url, "https://crm.ex.com/external/lead-intake/franchise/franquia");
  assert.equal((calls[0].init.headers as Record<string, string>)["x-api-key"], "chave");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.origem, "alpha-franchise");
  assert.equal(body.investimento, "De 80 mil até 100 mil");
});

test("crm falha 4xx: loga status e código, nunca dados do lead", async () => {
  withCrmEnv();
  const logs = await captureErrors(async () => {
    const res = await sendLeadToCrm(
      buildCrmLeadPayload(lead, tracking),
      fakeFetch(() => new Response(JSON.stringify({ code: "SECURITY_FILTER", message: "ana@ex.com" }), { status: 400 }))
    );
    assert.deepEqual(res, { ok: false, httpStatus: 400, reason: "SECURITY_FILTER" });
  });
  assert.ok(semDadosPessoais(logs));
});

test("crm falha de rede: status 0 e log sem dados pessoais", async () => {
  withCrmEnv();
  const logs = await captureErrors(async () => {
    const res = await sendLeadToCrm(
      buildCrmLeadPayload(lead, tracking),
      throwingFetch(new DOMException("timeout ana@ex.com", "TimeoutError"))
    );
    assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "TimeoutError" });
  });
  assert.ok(semDadosPessoais(logs));
});

test("crm sem env: não chama o fetch", async () => {
  delete process.env.CRM_API_URL;
  await captureErrors(async () => {
    const res = await sendLeadToCrm(buildCrmLeadPayload(lead, {}), throwingFetch(new Error("não deveria chamar")));
    assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "crm_not_configured" });
  });
});
