import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWebhookPayload, maskUrl, nowSaoPaulo, sendLeadToWebhook } from "@/lib/webhook";
import { captureErrors, fakeFetch, lead, semDadosPessoais, throwingFetch, tracking, type FetchCall } from "./helpers";

const WEBHOOK = "https://n8n.ex.com/webhook/segredo-123";
const now = new Date("2026-11-11T20:20:05Z");

test("webhook payload: dados + UTMs + fbclid + landing_page + referrer + enviado_em", () => {
  assert.deepEqual(buildWebhookPayload(lead, tracking, now), {
    nome: "Ana Souza",
    email: "ana@ex.com",
    telefone: "+5561911110001",
    whatsapp: "5561911110001",
    atuacao: "Dono (a) de agência",
    faturamento_agencia: "De 50 mil até 100 mil",
    inicio: "3 meses",
    investimento: "De 80 mil até 100 mil",
    tipo_lead: "a",
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "franquia",
    utm_content: "",
    utm_term: "",
    fbclid: "abc",
    landing_page: "https://lp.ex.com/?utm_source=facebook&fbclid=abc",
    referrer: "https://l.facebook.com/",
    origem: "alpha-franchise",
    enviado_em: "2026-11-11T17:20:05-03:00",
  });
});

test("webhook payload: chaves fixas com string vazia sem atribuição e sem faturamento", () => {
  const p = buildWebhookPayload({ ...lead, atuacao: "Quero empreender", faturamento_agencia: undefined }, {}, now);
  assert.equal(p.faturamento_agencia, "");
  assert.equal(p.tipo_lead, "c");
  for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "landing_page", "referrer"] as const) {
    assert.equal(p[k], "");
  }
});

test("nowSaoPaulo: fuso -03:00", () => {
  assert.equal(nowSaoPaulo(new Date("2026-01-01T03:00:00Z")), "2026-01-01T00:00:00-03:00");
});

test("webhook envio: POST JSON para LEAD_WEBHOOK_URL", async () => {
  process.env.LEAD_WEBHOOK_URL = WEBHOOK;
  const calls: FetchCall[] = [];
  const res = await sendLeadToWebhook(buildWebhookPayload(lead, tracking, now), fakeFetch(() => new Response("ok"), calls));
  assert.deepEqual(res, { ok: true, httpStatus: 200 });
  assert.equal(calls[0].url, WEBHOOK);
  assert.equal(calls[0].init.method, "POST");
  assert.equal(JSON.parse(String(calls[0].init.body)).nome, "Ana Souza");
});

test("webhook falha 5xx: ok false; log sem URL completa nem dados do lead", async () => {
  process.env.LEAD_WEBHOOK_URL = WEBHOOK;
  const logs = await captureErrors(async () => {
    const res = await sendLeadToWebhook(buildWebhookPayload(lead, tracking, now), fakeFetch(() => new Response("erro ana", { status: 502 })));
    assert.deepEqual(res, { ok: false, httpStatus: 502, reason: "http_502" });
  });
  assert.ok(semDadosPessoais(logs));
});

test("webhook falha de rede: status 0", async () => {
  process.env.LEAD_WEBHOOK_URL = WEBHOOK;
  const logs = await captureErrors(async () => {
    const res = await sendLeadToWebhook(buildWebhookPayload(lead, tracking, now), throwingFetch(new DOMException("x", "TimeoutError")));
    assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "TimeoutError" });
  });
  assert.ok(semDadosPessoais(logs));
});

test("webhook sem env: não chama o fetch", async () => {
  delete process.env.LEAD_WEBHOOK_URL;
  await captureErrors(async () => {
    const res = await sendLeadToWebhook(buildWebhookPayload(lead, {}, now), throwingFetch(new Error("não deveria chamar")));
    assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "webhook_not_configured" });
  });
});

test("maskUrl: só host + começo do path", () => {
  assert.equal(maskUrl(WEBHOOK), "n8n.ex.com/webhook…");
  assert.equal(maskUrl("não é url"), "(URL inválida)");
});
