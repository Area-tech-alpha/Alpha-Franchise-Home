import { TIPO_LEAD_POR_ATUACAO } from "@/lib/lead-constants";
import type { LeadResult } from "@/lib/lead-destination";
import type { LeadFormData, LeadTracking } from "@/lib/validation";

// Destino "crm": mesmo intake do Alpha_Home (Dashboard-Comercial-Back-V2),
// POST {CRM_API_URL}/external/leads com x-api-key. 4xx é definitivo.

export function buildCrmLeadPayload(
  lead: LeadFormData,
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
  };
}

export type CrmLeadPayload = ReturnType<typeof buildCrmLeadPayload>;

// Logs só com status e o código de erro estável do CRM: nunca o corpo, que pode
// ecoar dados do lead. Também usado pela LP do material (lib/material.ts).
export async function sendLeadToCrm(payload: Record<string, unknown>, fetchImpl: typeof fetch = fetch): Promise<LeadResult> {
  const baseUrl = process.env.CRM_API_URL;
  const apiKey = process.env.CRM_EXTERNAL_LEADS_API_KEY;
  if (!baseUrl || !apiKey) {
    console.error("[crm] CRM_API_URL / CRM_EXTERNAL_LEADS_API_KEY não definidas");
    return { ok: false, httpStatus: 0, reason: "crm_not_configured" };
  }

  try {
    const res = await fetchImpl(`${baseUrl.replace(/\/+$/, "")}/external/leads`, {
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
