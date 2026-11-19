// Textos da LP do material "Os 5 hacks para geração de demanda". Sem
// dependências: o form importa daqui sem puxar o zod no carregamento da página.

export const MATERIAL_PATH = "/material-geracao-de-demanda";
export const MATERIAL_OBRIGADO_PATH = `${MATERIAL_PATH}/obrigado`;
export const MATERIAL_PDF = "/files/5-hacks-geracao-de-demanda.pdf";

export const material = {
  name: "Os 5 hacks para geração de demanda",
  title: "Para liberar o material, antes precisamos apenas de alguns dados seus",
  form: {
    fields: {
      nome: { label: "Nome", placeholder: "Seu nome" },
      telefone: { label: "WhatsApp", placeholder: "(00) 00000-0000" },
      email: { label: "E-mail", placeholder: "Seu melhor e-mail" },
    },
    submitLabel: "Liberar material",
    sending: "Enviando...",
    errors: {
      validation: "Confira os campos destacados.",
      rateLimited: "Recebemos seu envio há pouco. Tente de novo em {min} min.",
      destination: "Não conseguimos enviar agora. Tente de novo em instantes.",
    },
  },
  obrigado: {
    title: "Aqui está seu material",
    download: "Baixar o material",
  },
} as const;
