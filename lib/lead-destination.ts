import { buildCrmLeadPayload, sendLeadToCrm } from "@/lib/crm";
import type { LeadFormData, LeadTracking } from "@/lib/validation";
import { buildWebhookPayload, sendLeadToWebhook } from "@/lib/webhook";

// Destino do lead é plugável (ainda em decisão): env LEAD_DESTINATION.
//   "crm"     -> CRM comercial (lib/crm.ts)
//   "webhook" -> LEAD_WEBHOOK_URL (lib/webhook.ts)
// Valor ausente ou desconhecido = erro de configuração: o lead não é descartado
// em silêncio, o form mostra erro e o log aponta a env.

export type LeadDestination = "crm" | "webhook";

// httpStatus 0 = não houve resposta (env faltando, rede ou timeout).
export type LeadResult = { ok: true; httpStatus: number } | { ok: false; httpStatus: number; reason: string };

export function resolveLeadDestination(raw: string | undefined = process.env.LEAD_DESTINATION): LeadDestination | null {
  const value = raw?.trim().toLowerCase();
  return value === "crm" || value === "webhook" ? value : null;
}

export async function deliverLead(
  lead: LeadFormData,
  tracking: LeadTracking,
  {
    destination = resolveLeadDestination(),
    fetchImpl = fetch,
  }: { destination?: LeadDestination | null; fetchImpl?: typeof fetch } = {}
): Promise<LeadResult> {
  if (destination === "crm") return sendLeadToCrm(buildCrmLeadPayload(lead, tracking), fetchImpl);
  if (destination === "webhook") return sendLeadToWebhook(buildWebhookPayload(lead, tracking), fetchImpl);
  console.error('[lead] LEAD_DESTINATION ausente ou inválida (use "crm" ou "webhook")');
  return { ok: false, httpStatus: 0, reason: "destination_not_configured" };
}
