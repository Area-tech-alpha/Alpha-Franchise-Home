import { z } from "zod";
import { isValidPhoneNumber } from "libphonenumber-js";

// Validação do form do material (navegador e servidor). Sem código de servidor:
// o form carrega este arquivo sob demanda no envio.

export const materialLeadSchema = z.object({
  nome: z.string().trim().min(2, "Nome obrigatório").max(120),
  telefone: z
    .string()
    .min(1, "WhatsApp obrigatório")
    .refine((v) => isValidPhoneNumber(v), "WhatsApp inválido"),
  email: z.string().trim().email("E-mail inválido").max(200),
});

export type MaterialLeadData = z.output<typeof materialLeadSchema>;
