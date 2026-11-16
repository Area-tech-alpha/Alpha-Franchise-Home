import type { LeadFormData } from "@/lib/validation";

export const lead: LeadFormData = {
  nome: "Ana Souza",
  email: "ana@ex.com",
  telefone: "+5561911110001",
  atuacao: "Dono (a) de agência",
  faturamento_agencia: "De 50 mil até 100 mil",
  inicio: "3 meses",
  investimento: "De 80 mil até 100 mil",
};

export const tracking = {
  utm_source: "facebook",
  utm_medium: "paid",
  utm_campaign: "franquia",
  fbclid: "abc",
  landing_page: "https://lp.ex.com/?utm_source=facebook&fbclid=abc",
  referrer: "https://l.facebook.com/",
};

export type FetchCall = { url: string; init: RequestInit };

export function fakeFetch(response: () => Response | Promise<Response>, calls: FetchCall[] = []) {
  return (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return response();
  }) as unknown as typeof fetch;
}

export const throwingFetch = (err: Error) =>
  (async () => {
    throw err;
  }) as unknown as typeof fetch;

export async function captureErrors(fn: () => Promise<void>) {
  const logs: string[] = [];
  const originalError = console.error;
  console.error = (...args: unknown[]) => logs.push(args.map(String).join(" "));
  try {
    await fn();
  } finally {
    console.error = originalError;
  }
  return logs;
}

export const semDadosPessoais = (logs: string[]) =>
  logs.length > 0 && logs.every((l) => !/ana|Ana|5561|segredo/.test(l));
