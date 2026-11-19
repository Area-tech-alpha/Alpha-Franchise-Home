import type { LeadTracking } from "@/lib/lead-constants";
import type { LeadResult } from "@/lib/lead-destination";
import { materialLeadSchema, type MaterialLeadData } from "@/lib/material-schema";
import { MATERIAL_OBRIGADO_PATH, material } from "@/lib/material-content";
import { checkLeadRateLimit, releaseLeadRateLimit, type Limiters } from "@/lib/rate-limit";
import { parseTracking } from "@/lib/validation";
import { nowSaoPaulo } from "@/lib/webhook";

export { materialLeadSchema, type MaterialLeadData } from "@/lib/material-schema";

// Lead da LP do material: só nome, WhatsApp e e-mail. Vai SÓ para o webhook
// do n8n (LEAD_WEBHOOK_URL_MATERIAL); não passa pelo CRM nem por
// LEAD_DESTINATION (isso é só do form da franquia).

// ---------- Webhook do n8n (único destino do lead) ----------

export const MATERIAL_ORIGEM = "material-5-hacks-geracao-de-demanda";

export function buildMaterialWebhookPayload(
  lead: MaterialLeadData,
  tracking: LeadTracking,
  pageUrl: string,
  now = new Date()
) {
  return {
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone, // E.164, ex.: +5561999999999
    tag: "isca",
    utm_source: tracking.utm_source ?? "",
    utm_medium: tracking.utm_medium ?? "",
    utm_campaign: tracking.utm_campaign ?? "",
    utm_content: tracking.utm_content ?? "",
    utm_term: tracking.utm_term ?? "",
    fbclid: tracking.fbclid ?? "",
    origem: MATERIAL_ORIGEM,
    page_url: pageUrl,
    enviado_em: nowSaoPaulo(now),
  };
}

// LEAD_WEBHOOK_URL_MATERIAL fica só no servidor. Logs: só status/motivo,
// nunca a URL (nem mascarada) e nunca dados do lead.
export async function sendMaterialToWebhook(
  payload: ReturnType<typeof buildMaterialWebhookPayload>,
  fetchImpl: typeof fetch = fetch,
  url: string | undefined = process.env.LEAD_WEBHOOK_URL_MATERIAL?.trim() || undefined
): Promise<LeadResult> {
  if (!url) {
    console.error("[material-webhook] LEAD_WEBHOOK_URL_MATERIAL não definida");
    return { ok: false, httpStatus: 0, reason: "webhook_not_configured" };
  }
  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[material-webhook] Retornou ${res.status}`);
      return { ok: false, httpStatus: res.status, reason: `http_${res.status}` };
    }
    return { ok: true, httpStatus: res.status };
  } catch (err) {
    const reason = err instanceof Error ? err.name : "erro_desconhecido";
    console.error(`[material-webhook] Falha de rede (${reason})`);
    return { ok: false, httpStatus: 0, reason };
  }
}

// URL da página no envio (vem do navegador): só http(s), senão vazio.
export function parsePageUrl(raw: unknown): string {
  if (typeof raw !== "string" || raw.length > 1000) return "";
  try {
    const u = new URL(raw);
    return u.protocol === "http:" || u.protocol === "https:" ? u.href : "";
  } catch {
    return "";
  }
}

// ---------- Fluxo do submit (a server action só injeta o IP) ----------

export type SubmitMaterialLeadResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; reason: "validation" | "rate_limited" | "destination" };

const SCOPE = "material-demanda";

export async function processMaterialLead(
  input: { data: unknown; rawTracking?: unknown; rawPageUrl?: unknown; ip: string | null },
  deps: {
    fetchImpl?: typeof fetch;
    limiters?: Limiters | null;
    webhookUrl?: string;
  } = {}
): Promise<SubmitMaterialLeadResult> {
  const { errors } = material.form;
  const parsed = materialLeadSchema.safeParse(input.data);
  if (!parsed.success) {
    return { success: false, error: errors.validation, reason: "validation" };
  }
  const lead = parsed.data;
  const tracking = parseTracking(input.rawTracking);

  const rateInput = { email: lead.email, telefone: lead.telefone, ip: input.ip, scope: SCOPE } as const;
  const limit =
    deps.limiters === undefined ? await checkLeadRateLimit(rateInput) : await checkLeadRateLimit(rateInput, deps.limiters);
  if (!limit.ok) {
    console.warn(`[submit-material-lead] Rate limit por ${limit.by}`);
    return {
      success: false,
      reason: "rate_limited",
      error: errors.rateLimited.replace("{min}", String(limit.retryAfterMinutes)),
    };
  }

  // Só libera o material quando o webhook confirma; senão devolve a cota.
  const result = await sendMaterialToWebhook(
    buildMaterialWebhookPayload(lead, tracking, parsePageUrl(input.rawPageUrl)),
    deps.fetchImpl,
    deps.webhookUrl
  );
  if (!result.ok) {
    if (deps.limiters === undefined) await releaseLeadRateLimit(rateInput);
    else await releaseLeadRateLimit(rateInput, deps.limiters);
    return { success: false, error: errors.destination, reason: "destination" };
  }
  return { success: true, redirectTo: MATERIAL_OBRIGADO_PATH };
}
