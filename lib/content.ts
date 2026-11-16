// Textos literais da LP atual (WordPress):
// https://assessorialpha.com/seja-um-franqueado-assessoria-alpha-2026/
// Não invente texto, número ou imagem. A página diz "+65" no hero e no
// ecossistema, mas "+60" na seção de números: os dois ficam literais até a
// Alpha confirmar o número certo.

export type NavLink = { label: string; href: string };

// Partes de um título: { em: true } vira o destaque em itálico amarelo, como no WP;
// { br: true } quebra a linha depois da parte.
export type TitlePart = { text: string; em?: boolean; br?: boolean };

const FORM_HREF = "#form";

export const content = {
  meta: {
    title: "Seja um Franqueado - Assessoria Alpha 2026",
    description:
      "Seja sócio executivo da maior agência de marketing nichada da América Latina. É assim que tratamos nossos franqueados: como sócios.",
    ogTitle: "Seja um Franqueado - Assessoria Alpha 2026",
    ogDescription:
      "Seja sócio executivo da maior agência de marketing nichada da América Latina. Análise em até 48h · Vagas limitadas por região.",
    siteName: "Assessoria Alpha",
  },

  logo: { src: "/images/logo-alpha.png", alt: "Alpha Assessoria", width: 764, height: 247 },

  nav: {
    links: [
      { label: "Comece com clientes", href: "#risco" },
      { label: "Escritórios", href: "#escritorios" },
      { label: "Números", href: "#numeros" },
      { label: "Pilares", href: "#pilares" },
      { label: "Na mídia", href: "#midia" },
    ] satisfies NavLink[],
    cta: { label: "Quero aplicar", href: FORM_HREF },
  },

  hero: {
    badges: ["Associado ABF", "+65 Escritórios", "+R$4MI/mês"],
    // Quebra fixa depois de "sócio executivo" (a mesma do WP): sem ela, o "da"
    // pulava de linha na troca da fonte de fallback pela Clash Display (CLS).
    title: [
      { text: "Seja " },
      { text: "sócio executivo", em: true, br: true },
      { text: "da maior agência de marketing nichada da América Latina." },
    ] satisfies TitlePart[],
    // Versão curta (literal) do subtítulo do WP: o form fica ao lado, na mesma dobra.
    subtitle: "É assim que tratamos nossos franqueados: como sócios.",
    note: "Análise em até 48h · Vagas limitadas por região",
  },

  form: {
    fields: {
      nome: { label: "Nome", placeholder: "Seu nome" },
      email: { label: "E-mail", placeholder: "Seu melhor e-mail" },
      telefone: { label: "Telefone", placeholder: "Telefone" },
      atuacao: {
        label: "Atuação:",
        options: ["Dono (a) de agência", "Sou empresário de outro ramo", "Quero empreender"],
      },
      // Só aparece (e só é obrigatório) para "Dono (a) de agência", como no WP.
      // "short" é só o texto do chip (form compacto na primeira dobra); o valor
      // enviado e validado continua o literal do WP, lido por leitor de tela.
      faturamentoAgencia: {
        label: "Faturamento da Agência",
        options: [
          "De 1 mil até 15 mil",
          "De 15 mil até 30 mil",
          "De 30 mil até 50 mil",
          "De 50 mil até 100 mil",
          "De 100 mil até 150 mil",
          "De 150 mil até 250 mil",
          "De 250 mil até 500 mil",
          "De 500 mil até 1 milhão",
          "Mais de 1 milhão",
        ],
        short: ["1–15 mil", "15–30 mil", "30–50 mil", "50–100 mil", "100–150 mil", "150–250 mil", "250–500 mil", "500 mil–1 mi", "+1 milhão"],
      },
      inicio: {
        label: "Quando pretende iniciar?",
        options: ["Imediatamente", "3 meses", "6 meses", "Após 6 meses"],
      },
      investimento: {
        label: "Quanto estaria disposto a investir na franquia da Alpha?",
        options: [
          "Até 30 mil",
          "De 30 mil até 50 mil",
          "De 50 mil até 60 mil",
          "De 60 mil até 80 mil",
          "De 80 mil até 100 mil",
          "De 100 mil até 150 mil",
          "De 150 mil até 250 mil",
          "De 250 mil até 400 mil",
          "De 400 mil até 600 mil",
          "De 600 mil até 1 milhão",
          "Mais de 1 milhão",
        ],
        short: [
          "Até 30 mil",
          "30–50 mil",
          "50–60 mil",
          "60–80 mil",
          "80–100 mil",
          "100–150 mil",
          "150–250 mil",
          "250–400 mil",
          "400–600 mil",
          "600 mil–1 mi",
          "+1 milhão",
        ],
      },
    },
    submitLabel: "QUERO APLICAR",
    sending: "Enviando...",
    errors: {
      validation: "Confira os campos destacados.",
      rateLimited: "Recebemos seu envio há pouco. Tente de novo em {min} min.",
      destination: "Não conseguimos enviar agora. Tente de novo em instantes.",
    },
  },

  risco: {
    eyebrow: "COMECE COM CLIENTES",
    title: [{ text: "A ALPHA TOMA " }, { text: "O RISCO POR VOCÊ", em: true }] satisfies TitlePart[],
    text: [
      { text: "A matriz, em sua potência comercial, entrega clientes para a unidade franqueada operar, entregar resultados e " },
      { text: "LUCRAR COM A RENOVAÇÃO DESSES CLIENTES.", em: true },
    ] satisfies TitlePart[],
    cta: { label: "Começar com clientes", href: FORM_HREF },
    vantagens: [
      {
        title: "Poder de escolha",
        text: [
          { text: "Você escolhe as empresas com quem quer " },
          { text: "negociar", em: true },
          { text: ", ao invés de receber qualquer cliente." },
        ] satisfies TitlePart[],
      },
      {
        title: "Meio caminho andado",
        text: [
          { text: "Fazemos 80% do trabalho para você.", em: true },
          { text: " As empresas já mostraram interesse é só fechar negócio." },
        ] satisfies TitlePart[],
      },
    ],
  },

  escritorios: {
    eyebrow: "SUA PRÓXIMA DECISÃO",
    title: [{ text: "Torne-se dono (a) de um de " }, { text: "nossos escritórios", em: true }] satisfies TitlePart[],
    text: [
      { text: "Porque empreender sozinho é caro. " },
      { text: "Mas reinventar a roda é mais caro ainda.", em: true },
    ] satisfies TitlePart[],
    stats: [
      { icon: "target", value: "Payback de 6–8 meses", label: "em média" },
      { icon: "trend", value: "Margem de até 40%", label: "de lucro" },
      { icon: "infinity", value: "Sem limite", label: "de faturamento" },
    ] as const,
    image: {
      src: "/images/escritorios-alpha.webp",
      alt: "Franqueados da Alpha com a camisa amarela da rede em evento da Alpha Franchise",
      width: 820,
      height: 901,
    },
  },

  numeros: {
    eyebrow: "OS NÚMEROS PROVAM",
    title: [{ text: "Os números que comprovam que a " }, { text: "Alpha é um bom investimento.", em: true }] satisfies TitlePart[],
    items: [
      { value: "+60", label: "Escritórios em todo Brasil" },
      { value: "+4000", label: "Restaurantes atendidos" },
      { value: "+4MI", label: "Faturamento mensal" },
      { value: "+89.9%", label: "Franqueados com ROI antes do prazo" },
    ],
    abf: {
      src: "/images/abf-associado.webp",
      alt: "ABF, Associação Brasileira de Franchising: associado",
      width: 640,
      height: 171,
    },
    cta: { label: "Quero fazer parte", href: FORM_HREF },
  },

  pilares: {
    title: [{ text: "Os 3 pilares que sustentam o sucesso " }, { text: "dos nossos sócios executivos:", em: true }] satisfies TitlePart[],
    items: [
      {
        icon: "chart",
        tag: "ESTRUTURA VALIDADA",
        title: "GROWTH HUB",
        text: "Nossos franqueados usam nossa estrutura de marketing, que já vende mais de 2 milhões por mês, para geração de oportunidade comercial para o time deles.",
        image: { src: "/images/pilar-growth-hub.webp", alt: "Franqueado da Alpha trabalhando no notebook" },
      },
      {
        icon: "check",
        tag: "FLUXO COMERCIAL",
        title: "CONTRATOS FECHADOS",
        text: "Sua unidade não nasce vazia: a matriz entrega cliente para você faturar desde o primeiro mês, focando no que importa, entregar resultado e crescer.",
        image: { src: "/images/pilar-contratos-fechados.webp", alt: "Franqueados da Alpha se abraçando em evento da rede" },
      },
      {
        icon: "award",
        tag: "PRESENÇA ESTRATÉGICA",
        title: "AUTORIDADE",
        // A aspa no fim é do texto original do WP.
        text: "Nossos franqueados aproveitam de todo branding e força de mercado que a Alpha desenvolveu ao longo desses anos para impulsionar o crescimento da unidade.”",
        image: { src: "/images/pilar-autoridade.webp", alt: "Franqueado da Alpha recebendo troféu" },
      },
    ] as const,
  },

  ecossistema: {
    label: "Ecossistema Alpha Franchise",
    steps: [
      { value: "+65", title: "FRANQUEADOS", text: "Unidades conectadas ao ecossistema Alpha Franchise em expansão." },
      { value: "+4000", title: "CLIENTES", text: "Negócios atendidos através da estrutura comercial e estratégica da rede." },
      { value: "Alpha", title: "CONSELHEIROS", text: "Especialistas que orientam, treinam e fortalecem os franqueados." },
    ],
    brand: { top: "alpha", bottom: "FRANCHISE" },
  },

  movimento: {
    title: [{ text: "Faça parte desse movimento " }, { text: "com a gente", em: true }] satisfies TitlePart[],
    text: "Seja dono(a) do seu próprio negócio e tenha uma parte desse projeto gigante que estamos construindo.",
    cta: { label: "Fazer parte do movimento", href: FORM_HREF },
  },

  midia: {
    eyebrow: "ALPHA NA MÍDIA",
    title: [
      { text: "Não somos nós que falamos. O mercado " },
      { text: "já reconhece a grandeza do que fazemos.", em: true },
    ] satisfies TitlePart[],
    // Mesmos cards de matéria do Alpha_Home (fotos recortadas em 16:9).
    items: [
      {
        outlet: "Forbes Portugal",
        title: "A empresa que está redefinindo o marketing gastronômico",
        text: "Como a Alpha virou referência em marketing pra restaurantes na América Latina.",
        href: "https://www.forbespt.com/assessoria-alpha-a-empresa-que-esta-a-redefinir-o-marketing-gastronomico/",
        image: { src: "/images/midia/forbes-portugal.webp", alt: "Forbes Portugal sobre a Alpha Assessoria" },
      },
      {
        outlet: "Caras Brasil",
        title: "Athos Vilarins e a ascensão da Assessoria Alpha",
        text: "A trajetória do fundador e como a empresa virou potência do setor gastronômico.",
        href: "https://caras.com.br/personalidades/athos-vilarins-transforma-assessoria-alpha-em-potencia-do-marketing-gastronomico.phtml",
        image: { src: "/images/midia/caras-brasil.webp", alt: "Caras Brasil sobre Athos Vilarins e a Alpha Assessoria" },
      },
      {
        outlet: "Metrópoles",
        title: "A empresa que movimenta milhões no food service",
        text: "Como a Alpha fatura milhões por ano ajudando restaurantes a vender mais.",
        href: "https://www.metropoles.com/conteudo-especial/empresa-de-marketing-gastronomico-movimenta-milhoes-por-ano-no-brasil",
        image: { src: "/images/midia/metropoles.webp", alt: "Metrópoles sobre a Alpha Assessoria" },
      },
      {
        outlet: "Ego Brazil",
        title: "Grupo Alpha aposta em tecnologia pra escalar",
        text: "Tecnologia e gestão como motor de expansão da Alpha pela América Latina.",
        href: "https://egobrazil.com.br/grupo-alpha-aposta-em-tecnologia-e-gestao-para-escalar-restaurantes-na-america-latina/",
        image: { src: "/images/midia/ego-brazil.webp", alt: "Ego Brazil sobre o Grupo Alpha" },
      },
    ],
    // Os 3 vídeos do WP, convertidos para 720p H.264 (sem legenda/título no WP).
    videos: [
      { src: "/videos/franquia-gustavo.mp4", poster: "/videos/franquia-gustavo-poster.jpg", label: "Vídeo 1 de 3 da Alpha Franchise" },
      { src: "/videos/franquia-imersion.mp4", poster: "/videos/franquia-imersion-poster.jpg", label: "Vídeo 2 de 3 da Alpha Franchise" },
      { src: "/videos/franquia-case.mp4", poster: "/videos/franquia-case-poster.jpg", label: "Vídeo 3 de 3 da Alpha Franchise" },
    ],
    cta: { label: "Fazer parte do movimento", href: FORM_HREF },
  },

  footer: {
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/assessorialpha/" },
      { label: "YouTube", href: "https://www.youtube.com/@assessorialpha" },
    ],
    copyright: "2026 © Alpha Assessoria. Todos os direitos reservados.",
  },

  obrigado: {
    title: "PARABÉNS PELA DECISÃO!",
    text: "Um especialista da nossa equipe entrará em contato com você para explicar mais sobre nosso ecossistema em até 5 minutos.",
    back: "Voltar para a página",
  },
};

export type Content = typeof content;
