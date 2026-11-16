"use server";

import { headers } from "next/headers";
import { content } from "@/lib/content";
import { deliverLead } from "@/lib/lead-destination";
import { checkLeadRateLimit, clientIp, releaseLeadRateLimit } from "@/lib/rate-limit";
import { leadSchema, parseTracking } from "@/lib/validation";

export type SubmitLeadResult =
  | { success: true; redirectTo: string }
  | { success: false; error: string; reason: "validation" | "rate_limited" | "destination" };

const { errors } = content.form;

export async function submitLead(data: unknown, rawTracking?: unknown): Promise<SubmitLeadResult> {
  const parsed = leadSchema.safeParse(data);
  if (!parsed.success) {
    return { success: false, error: errors.validation, reason: "validation" };
  }
  const tracking = parseTracking(rawTracking);

  const limit = await checkLeadRateLimit({
    email: parsed.data.email,
    telefone: parsed.data.telefone,
    ip: clientIp(await headers()),
  });
  if (!limit.ok) {
    console.warn(`[submit-lead] Rate limit por ${limit.by}`);
    return {
      success: false,
      reason: "rate_limited",
      error: errors.rateLimited.replace("{min}", String(limit.retryAfterMinutes)),
    };
  }

  const result = await deliverLead(parsed.data, tracking);
  if (!result.ok) {
    await releaseLeadRateLimit(parsed.data);
    return { success: false, error: errors.destination, reason: "destination" };
  }
  return { success: true, redirectTo: "/obrigado" };
}
