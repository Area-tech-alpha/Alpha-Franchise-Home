import { TIPO_LEAD_POR_ATUACAO } from "@/lib/lead-constants";
import type { LeadResult } from "@/lib/lead-destination";
import type { LeadFormData, LeadTracking } from "@/lib/validation";

// Destino "crm": entrada de leads do CRM da Comercial Franquias
// (Dashboard-Comercial-Back-V2), POST {CRM_API_URL}/external/lead-intake/franchise/franquia
// com x-api-key = CRM_LEAD_INTAKE_KEY (a LEAD_INTAKE_FRANCHISE_KEY do CRM). O CRM cria o lead na
// Comercial Franquias (produto franquia), grava a planilha, avisa o grupo e manda a COF.
// Antes ia para /external/leads com destination "hq", que cria o lead na MATRIZ — errado para
// lead de franquia. 4xx é definitivo.

export const CRM_INTAKE_PATH = "/external/lead-intake/franchise/franquia";

export function buildCrmLeadPayload(lead: LeadFormData, tracking: LeadTracking) {
  return {
    origem: "alpha-franchise",
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    atuacao: lead.atuacao,
    faturamento_agencia: lead.faturamento_agencia,
    inicio: lead.inicio,
    investimento: lead.investimento,
    tipo_lead: TIPO_LEAD_POR_ATUACAO[lead.atuacao],
    utm_source: tracking.utm_source,
    utm_medium: tracking.utm_medium,
    utm_campaign: tracking.utm_campaign,
    utm_content: tracking.utm_content,
    utm_term: tracking.utm_term,
    fbclid: tracking.fbclid,
    landing_page: tracking.landing_page,
    referrer: tracking.referrer,
  };
}

export type CrmLeadPayload = ReturnType<typeof buildCrmLeadPayload>;

// Logs só com status e o código de erro estável do CRM: nunca o corpo, que pode
// ecoar dados do lead.
export async function sendLeadToCrm(payload: CrmLeadPayload, fetchImpl: typeof fetch = fetch): Promise<LeadResult> {
  const baseUrl = process.env.CRM_API_URL;
  const apiKey = process.env.CRM_LEAD_INTAKE_KEY;
  if (!baseUrl || !apiKey) {
    console.error("[crm] CRM_API_URL / CRM_LEAD_INTAKE_KEY não definidas");
    return { ok: false, httpStatus: 0, reason: "crm_not_configured" };
  }

  try {
    const res = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}${CRM_INTAKE_PATH}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": apiKey },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await res.json().catch(() => null)) as { code?: unknown } | null;
    if (!res.ok) {
      const code = typeof body?.code === "string" ? body.code : "sem_codigo";
      console.error(`[crm] Intake retornou ${res.status} (${code})`);
      return { ok: false, httpStatus: res.status, reason: code };
    }
    return { ok: true, httpStatus: res.status };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "erro_desconhecido";
    console.error(`[crm] Falha de rede ao chamar o intake (${reason})`);
    return { ok: false, httpStatus: 0, reason };
  }
}
