import { test } from "node:test";
import assert from "node:assert/strict";
import { deliverLead, resolveLeadDestination } from "@/lib/lead-destination";
import { captureErrors, fakeFetch, lead, throwingFetch, tracking, type FetchCall } from "./helpers";

test("resolveLeadDestination: crm, webhook, maiúsculas/espaços; resto = null", () => {
  assert.equal(resolveLeadDestination("crm"), "crm");
  assert.equal(resolveLeadDestination(" WEBHOOK "), "webhook");
  assert.equal(resolveLeadDestination(undefined), null);
  assert.equal(resolveLeadDestination(""), null);
  assert.equal(resolveLeadDestination("planilha"), null);
});

test('LEAD_DESTINATION="crm": vai só para o CRM', async () => {
  process.env.CRM_API_URL = "https://crm.ex.com";
  process.env.CRM_EXTERNAL_LEADS_API_KEY = "chave";
  process.env.LEAD_WEBHOOK_URL = "https://n8n.ex.com/webhook/x";
  const calls: FetchCall[] = [];
  const res = await deliverLead(lead, tracking, {
    destination: "crm",
    fetchImpl: fakeFetch(() => new Response("{}", { status: 201 }), calls),
  });
  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://crm.ex.com/external/leads");
  assert.equal(JSON.parse(String(calls[0].init.body)).source, "alpha-franchise");
});

test('LEAD_DESTINATION="webhook": vai só para o webhook', async () => {
  process.env.LEAD_WEBHOOK_URL = "https://n8n.ex.com/webhook/x";
  const calls: FetchCall[] = [];
  const res = await deliverLead(lead, tracking, {
    destination: "webhook",
    fetchImpl: fakeFetch(() => new Response("ok"), calls),
  });
  assert.equal(res.ok, true);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://n8n.ex.com/webhook/x");
  const body = JSON.parse(String(calls[0].init.body));
  assert.equal(body.origem, "alpha-franchise");
  assert.equal(body.landing_page, tracking.landing_page);
});

test("lê LEAD_DESTINATION do ambiente quando não é passado", async () => {
  process.env.LEAD_DESTINATION = "webhook";
  process.env.LEAD_WEBHOOK_URL = "https://n8n.ex.com/webhook/x";
  const calls: FetchCall[] = [];
  await deliverLead(lead, tracking, { fetchImpl: fakeFetch(() => new Response("ok"), calls) });
  assert.equal(calls[0].url, "https://n8n.ex.com/webhook/x");
  delete process.env.LEAD_DESTINATION;
});

test("destino ausente: erro de configuração, nenhum envio", async () => {
  const logs = await captureErrors(async () => {
    const res = await deliverLead(lead, tracking, { destination: null, fetchImpl: throwingFetch(new Error("não deveria chamar")) });
    assert.deepEqual(res, { ok: false, httpStatus: 0, reason: "destination_not_configured" });
  });
  assert.match(logs[0], /LEAD_DESTINATION/);
});
