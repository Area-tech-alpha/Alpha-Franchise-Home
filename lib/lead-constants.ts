// Constantes do form sem dependências: o componente do form importa daqui para
// não puxar o zod no carregamento da página.

// Única resposta de "Atuação" que mostra (e exige) o faturamento da agência, como no WP.
export const ATUACAO_EXIGE_FATURAMENTO = "Dono (a) de agência";

// Tipo do lead por perfil, igual ao script do WP (tipo_lead a/b/c).
export const TIPO_LEAD_POR_ATUACAO: Record<string, "a" | "b" | "c"> = {
  "Dono (a) de agência": "a",
  "Sou empresário de outro ramo": "b",
  "Quero empreender": "c",
};

// Parâmetros lidos da URL (first-touch). A LP recebe tráfego do Meta Ads.
export const TRACKING_URL_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
] as const;

export const TRACKING_KEYS = [...TRACKING_URL_KEYS, "landing_page", "referrer"] as const;

export type LeadTracking = Partial<Record<(typeof TRACKING_KEYS)[number], string>>;
