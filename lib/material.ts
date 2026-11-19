import { sendLeadToCrm } from "@/lib/crm";
import type { LeadTracking } from "@/lib/lead-constants";
import { resolveLeadDestination, type LeadDestination, type LeadResult } from "@/lib/lead-destination";
import type { MaterialLeadData } from "@/lib/material-schema";

export { materialLeadSchema, type MaterialLeadData } from "@/lib/material-schema";

// Lead da LP do material: só nome, WhatsApp e e-mail. Vai para o mesmo intake
// do CRM que o form da franquia (lib/crm.ts), com destination "hq" (nenhum
// campo obrigatório no intake). Campos que este form não tem (atuação,
// investimento, tipo_lead...) não vão no payload: nada é inventado.

export function buildMaterialCrmPayload(
  lead: MaterialLeadData,
  tracking: LeadTracking,
  sdrEmail: string | undefined = process.env.CRM_SDR_EMAIL?.trim() || undefined
) {
  return {
    destination: "hq" as const,
    ...(sdrEmail && { sdr_email: sdrEmail }),
    source: "alpha-franchise",
    name: lead.nome,
    email: lead.email,
    phone: lead.telefone,
    utm_source: tracking.utm_source,
    utm_medium: tracking.utm_medium,
    utm_campaign: tracking.utm_campaign,
    utm_content: tracking.utm_content,
    utm_term: tracking.utm_term,
    fbclid: tracking.fbclid,
  };
}

// Mesmo caminho do form da franquia: só envia com LEAD_DESTINATION=crm. Outro
// valor = erro de configuração (o form mostra "tente de novo"; o lead não é
// descartado em silêncio nem mandado para o webhook, que espera os campos da franquia).
export async function deliverMaterialLead(
  lead: MaterialLeadData,
  tracking: LeadTracking,
  {
    destination = resolveLeadDestination(),
    fetchImpl = fetch,
  }: { destination?: LeadDestination | null; fetchImpl?: typeof fetch } = {}
): Promise<LeadResult> {
  if (destination === "crm") return sendLeadToCrm(buildMaterialCrmPayload(lead, tracking), fetchImpl);
  console.error('[material] LEAD_DESTINATION precisa ser "crm" para o lead do material');
  return { ok: false, httpStatus: 0, reason: "destination_not_configured" };
}
