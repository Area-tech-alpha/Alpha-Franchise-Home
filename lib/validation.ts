import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";
import { content } from "@/lib/content";
import { ATUACAO_EXIGE_FATURAMENTO, TRACKING_KEYS, type LeadTracking } from "@/lib/lead-constants";

export { ATUACAO_EXIGE_FATURAMENTO, TRACKING_KEYS, type LeadTracking };

const { fields } = content.form;

// Só aceita as respostas que existem no form (mesmas do WP).
function oneOf(options: readonly string[], message: string) {
  return z.string({ message }).refine((v) => options.includes(v), message);
}

export const leadSchema = z
  .object({
    nome: z.string().trim().min(2, "Nome obrigatório").max(120),
    email: z.string().trim().email("E-mail inválido").max(200),
    telefone: z
      .string()
      .min(1, "Telefone obrigatório")
      .refine((v) => isValidPhoneNumber(v), "Telefone inválido"),
    atuacao: oneOf(fields.atuacao.options, "Selecione sua atuação"),
    faturamento_agencia: z.string().max(80).optional(),
    inicio: oneOf(fields.inicio.options, "Selecione quando pretende iniciar"),
    investimento: oneOf(fields.investimento.options, "Selecione quanto estaria disposto a investir"),
  })
  .superRefine((data, ctx) => {
    if (data.atuacao === ATUACAO_EXIGE_FATURAMENTO) {
      if (!data.faturamento_agencia || !fields.faturamentoAgencia.options.includes(data.faturamento_agencia)) {
        ctx.addIssue({ code: "custom", message: "Selecione o faturamento da agência", path: ["faturamento_agencia"] });
      }
    }
  })
  // Como no WP: fora de "Dono (a) de agência" o faturamento é limpo.
  .transform((data) =>
    data.atuacao === ATUACAO_EXIGE_FATURAMENTO ? data : { ...data, faturamento_agencia: undefined }
  );

export type LeadFormData = z.output<typeof leadSchema>;

// Atribuição lida no navegador. Vem de fora e nunca barra o lead: valor
// inválido, vazio ou longo demais é só descartado.
const trackingValue = z.string().trim().min(1).max(1000);

export function parseTracking(raw: unknown): LeadTracking {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const tracking: LeadTracking = {};
  for (const key of TRACKING_KEYS) {
    const parsed = trackingValue.safeParse(source[key]);
    if (parsed.success) tracking[key] = parsed.data;
  }
  return tracking;
}
