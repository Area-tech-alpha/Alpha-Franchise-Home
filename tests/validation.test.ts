import { test } from "node:test";
import assert from "node:assert/strict";
import { leadSchema, parseTracking } from "@/lib/validation";
import { lead } from "./helpers";

const issues = (data: unknown) => {
  const r = leadSchema.safeParse(data);
  return r.success ? [] : r.error.issues.map((i) => String(i.path[0]));
};

test("lead válido de dono de agência passa", () => {
  assert.deepEqual(issues(lead), []);
});

test("dono de agência sem faturamento: erro em faturamento_agencia", () => {
  assert.deepEqual(issues({ ...lead, faturamento_agencia: undefined }), ["faturamento_agencia"]);
});

test("outras atuações: faturamento não é exigido e é descartado", () => {
  const r = leadSchema.parse({ ...lead, atuacao: "Quero empreender" });
  assert.equal(r.faturamento_agencia, undefined);
  assert.deepEqual(issues({ ...lead, atuacao: "Sou empresário de outro ramo", faturamento_agencia: undefined }), []);
});

test("respostas fora das opções do WP são recusadas", () => {
  assert.deepEqual(issues({ ...lead, atuacao: "Outro" }), ["atuacao"]);
  assert.deepEqual(issues({ ...lead, inicio: "Amanhã" }), ["inicio"]);
  assert.deepEqual(issues({ ...lead, investimento: "1 real" }), ["investimento"]);
  assert.deepEqual(issues({ ...lead, faturamento_agencia: "Muito" }), ["faturamento_agencia"]);
});

test("telefone com DDI: aceita +351, recusa inválido", () => {
  assert.deepEqual(issues({ ...lead, telefone: "+351912345678" }), []);
  assert.deepEqual(issues({ ...lead, telefone: "+55123" }), ["telefone"]);
});

test("parseTracking: só chaves conhecidas, descarta vazio e não-string", () => {
  assert.deepEqual(
    parseTracking({ utm_source: " fb ", fbclid: "", utm_term: 5, landing_page: "https://x", foo: "bar" }),
    { utm_source: "fb", landing_page: "https://x" }
  );
  assert.deepEqual(parseTracking(null), {});
});
