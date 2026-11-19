"use server";

import { headers } from "next/headers";
import { deliverMaterialLead, materialLeadSchema } from "@/lib/material";
import { MATERIAL_OBRIGADO_PATH, material } from "@/lib/material-content";
import { checkLeadRateLimit, clientIp, releaseLeadRateLimit } from "@/lib/rate-limit";
import { parseTracking } from "@/lib/validation";

export type SubmitMaterialLeadResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; reason: "validation" | "rate_limited" | "destination" };

const { errors } = material.form;
const SCOPE = "material-demanda";

// Só libera o material (redirect) quando o CRM confirma o lead.
export async function submitMaterialLead(data: unknown, rawTracking?: unknown): Promise<SubmitMaterialLeadResult> {
  const parsed = materialLeadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: errors.validation, reason: "validation" };
  }
  const tracking = parseTracking(rawTracking);

  const limit = await checkLeadRateLimit({
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    ip: clientIp(await headers()),
    scope: SCOPE,
  });
  if (!limit.ok) {
    console.warn(`[submit-material-lead] Rate limit por ${limit.by}`);
    return {
      success: false,
      reason: "rate_limited",
      error: errors.rateLimited.replace("{min}", String(limit.retryAfterMinutes)),
    };
  }

  const result = await deliverMaterialLead(parsed.data, tracking);
  if (!result.ok) {
    await releaseLeadRateLimit({ ...parsed.data, scope: SCOPE });
    return { success: false, error: errors.destination, reason: "destination" };
  }
  return { success: true, redirectTo: MATERIAL_OBRIGADO_PATH };
}
