"use server";

import { headers } from "next/headers";
import { processMaterialLead, type SubmitMaterialLeadResult } from "@/lib/material";
import { clientIp } from "@/lib/rate-limit";

export type { SubmitMaterialLeadResult };

// Fluxo em lib/material.ts: valida, rate limit "material-demanda", CRM e,
// só com o CRM ok, cópia para o webhook do n8n (falha nele não bloqueia).
export async function submitMaterialLead(
  data: unknown,
  rawTracking?: unknown,
  rawPageUrl?: unknown
): Promise<SubmitMaterialLeadResult> {
  return processMaterialLead({ data, rawTracking, rawPageUrl, ip: clientIp(await headers()) });
}
