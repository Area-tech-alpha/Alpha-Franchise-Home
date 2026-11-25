import { TIPO_LEAD_POR_ATUACAO } from "@/lib/lead-constants";
import type { LeadResult } from "@/lib/lead-destination";
import type { LeadFormData, LeadTracking } from "@/lib/validation";

// Destino "webhook": mesmo formato da LP do treinamento (lp-treinamento-franquias):
// dados + UTMs + fbclid + landing_page + referrer + enviado_em, chaves fixas e
// string vazia quando não houver valor.

/** Data/hora ISO 8601 no fuso America/Sao_Paulo, ex.: 2026-11-11T17:20:05-03:00 */
export function nowSaoPaulo(date = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Sao_Paulo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZoneName: "longOffset",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  const offset = (parts.timeZoneName ?? "GMT-03:00").replace("GMT", "") || "+00:00";
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}${offset}`;
}

export function buildWebhookPayload(lead: LeadFormData, tracking: LeadTracking, now = new Date()) {
  return {
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    // Só dígitos com DDI (ex.: 5561999999999), pronto para link de WhatsApp.
    whatsapp: lead.telefone.replace(/\D/g, ""),
    atuacao: lead.atuacao,
    faturamento_agencia: lead.faturamento_agencia ?? "",
    inicio: lead.inicio,
    investimento: lead.investimento,
    tipo_lead: TIPO_LEAD_POR_ATUACAO[lead.atuacao] ?? "",
    utm_source: tracking.utm_source ?? "",
    utm_medium: tracking.utm_medium ?? "",
    utm_campaign: tracking.utm_campaign ?? "",
    utm_content: tracking.utm_content ?? "",
    utm_term: tracking.utm_term ?? "",
    fbclid: tracking.fbclid ?? "",
    landing_page: tracking.landing_page ?? "",
    referrer: tracking.referrer ?? "",
    origem: "alpha-franchise",
    enviado_em: nowSaoPaulo(now),
  };
}

export type WebhookPayload = ReturnType<typeof buildWebhookPayload>;

/** URL mascarada para log: só host + primeiros 8 caracteres do path. */
export function maskUrl(raw: string): string {
  try {
    const u = new URL(raw);
    return `${u.host}${u.pathname.slice(0, 8)}…`;
  } catch {
    return "(URL inválida)";
  }
}

// Logs de falha: nunca a URL completa nem os dados do lead.
export async function sendLeadToWebhook(payload: WebhookPayload, fetchImpl: typeof fetch = fetch): Promise<LeadResult> {
  const url = process.env.LEAD_WEBHOOK_URL?.trim();
  if (!url) {
    console.error("[webhook] LEAD_WEBHOOK_URL não definida");
    return { ok: false, httpStatus: 0, reason: "webhook_not_configured" };
  }
  const target = maskUrl(url);
  // LEAD_WEBHOOK_KEY: chave da entrada de leads do CRM (LEAD_INTAKE_FRANCHISE_KEY), em x-api-key.
  // Vazia = sem header (webhook antigo do n8n).
  const key = process.env.LEAD_WEBHOOK_KEY?.trim();
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(key && { "x-api-key": key }) },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[webhook] Retornou ${res.status} (destino ${target})`);
      return { ok: false, httpStatus: res.status, reason: `http_${res.status}` };
    }
    return { ok: true, httpStatus: res.status };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "erro_desconhecido";
    console.error(`[webhook] Falha de rede (${reason}, destino ${target})`);
    return { ok: false, httpStatus: 0, reason };
  }
}
