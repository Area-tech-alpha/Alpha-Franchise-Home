# Alpha Franchise Home

LP "Seja um Franqueado" da Assessoria Alpha (Next 15, SSG, Tailwind v4) e a `/01-lp` (LP de restaurantes migrada da `/00-lp/` do WP).

```bash
npm run dev        # desenvolvimento
npm run lint       # eslint
npm run typecheck  # tsc
npm test           # testes (node:test + tsx)
npm run build      # confere as mídias (scripts/check-assets.ts) e gera o build
```

## Rotas

| Rota | O que é | Indexação |
|---|---|---|
| `/` | LP da franquia; lead vai para o destino de `LEAD_DESTINATION` (`lib/lead-destination.ts`) | só com `NEXT_PUBLIC_ALLOW_INDEXING=true` |
| `/obrigado` | Obrigado da franquia | noindex |
| `/01-lp` | LP de restaurantes (migração da `/00-lp/` do WP, ID 3445); lead vai para o webhook do n8n | só com `NEXT_PUBLIC_ALLOW_INDEXING=true` (e só então no sitemap) |
| `/obrigado-a`, `/obrigado-b`, `/obrigado-c` | Pós-envio da /01-lp (leads A, B, C; a faixa "80 mil até 100 mil" também cai na `/obrigado-a`) | noindex |
| `/agradecimento` | Pós-envio da /01-lp (desqualificado) | noindex |

## Variáveis de ambiente

| Variável | Uso | Onde |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL pública, sem barra no fim (canonical, sitemap, `redirect_url` do payload da /01-lp) | todas |
| `NEXT_PUBLIC_ALLOW_INDEXING` | `true` só no deploy definitivo; qualquer outro valor = noindex em tudo | todas |
| `LEAD_DESTINATION` | `crm` ou `webhook` (form da franquia) | servidor |
| `CRM_API_URL`, `CRM_EXTERNAL_LEADS_API_KEY`, `CRM_SDR_EMAIL` | Form da franquia com `LEAD_DESTINATION=crm` | servidor |
| `LEAD_WEBHOOK_URL` | Form da franquia com `LEAD_DESTINATION=webhook` | servidor |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limit dos dois forms (sem elas, passa direto) | servidor |
| `LEAD_WEBHOOK_URL_01LP` | Webhook do n8n que recebe o lead da /01-lp (**Sensitive** na Vercel) | servidor |

## /01-lp

Veio do repo Alpha_Home (commit `e65c529`), com o mesmo visual e comportamento. Arquivos próprios: `app/01-lp`, `app/actions/submit-lead-01lp.ts`, `app/obrigado-a|b|c`, `app/agradecimento`, `components/lp01/*`, `lib/*01lp*`, `lib/content-01-lp.ts`, `lib/validation-01lp.ts`. O form da franquia (`lib/validation.ts`, `components/lead-form.tsx`, `app/actions/submit-lead.ts`, `components/ui/phone-field.tsx`) não é usado pela /01-lp.

### Estilos isolados

O `globals.css` da franquia e o do Alpha_Home usam os mesmos nomes de classe e tokens (`.btn`, `.field-input`, `--gold-1`…) com valores diferentes. A /01-lp e as páginas de obrigado dela ficam dentro de `.lp01-scope`, e `components/lp01/lp01-scope.css` redefine ali só o que elas usam, com os valores do Alpha_Home (tokens, fundo do body, títulos, `.btn`, campos do form). O resto do visual está em `app/01-lp/lp01.css`, com escopo em `.lp01`, e nas fontes próprias (`components/lp01/fonts.ts`: Montserrat, Roboto e Public Sans). A barra de rolagem amarela da franquia não vale dentro de `.lp01-scope`.

### Envio do lead

`app/actions/submit-lead-01lp.ts` (server action):

1. Valida com `leadSchema01lp` (`lib/validation-01lp.ts`): CNPJ e "investiria" só em "Até 30 mil".
2. Rate limit com `lib/rate-limit.ts` no escopo `01lp:` (cota separada da franquia, que usa `franchise:`).
3. Monta o payload (`lib/webhook-01lp.ts`) e faz `POST` para `LEAD_WEBHOOK_URL_01LP` com timeout de 10 s. Os logs têm só status e motivo, nunca a URL nem dados do lead.
4. Se falhar, devolve a cota do rate limit e o form pede para tentar de novo. Se der certo, redireciona conforme a regra abaixo.

### Roteamento pós-envio (`rotear01lp` em `lib/lead-01lp.ts`)

Regra do script da 00-lp (ramo `pageId` 3445). A `/obrigado` deste repo é da franquia, então a faixa "80 mil até 100 mil" navega para `/obrigado-a`. O payload continua igual ao WP.

| Faturamento | Investiria R$4.000? | Navega para | `tipo_lead` | `redirect_url` no payload |
|---|---|---|---|---|
| Até 30 mil | Não | `/agradecimento` | `desqualificado` | `…/agradecimento/` |
| Até 30 mil | Sim | `/obrigado-c` | `c` | `…/obrigado-c/` |
| 30 mil até 50 mil | – | `/obrigado-c` | `c` | `…/obrigado-c/` |
| 50 mil até 80 mil | – | `/obrigado-b` | `b` | `…/obrigado-b/` |
| 80 mil até 100 mil | – | `/obrigado-a` | `qualificado-geral` | `…/obrigado/` (como no WP) |
| 100 mil até 150 mil … Mais de 1 milhão | – | `/obrigado-a` | `a` | `…/obrigado-a/` |

### Payload do webhook

Mesmo formato que o form nativo do Elementor manda pela ação Webhook. A referência é a função `montarPayloadElementor` da página WP `obrigado-seja-um-franqueado-c`. Os metadados dela foram copiados byte a byte de um payload real que o n8n recebeu.

- `POST`, `Content-Type: application/x-www-form-urlencoded`
- Chaves na ordem: `form[id]`, `form[name]` e, para cada campo do form (inclusive os do tipo `html`, com valor vazio), `fields[<id>][id|type|title|value|raw_value|required]`
- Sem `meta[...]` e sem `post_id`, como na referência
- `origem=alpha-home-01-lp` no fim (chave extra pedida para a /01-lp)

```
form[id]=e1b938c
form[name]=Formulario_Qualificacao
fields[<id>][id]=<id>
fields[<id>][type]=text|email|tel|select|hidden|html
fields[<id>][title]=<rótulo do campo no WP>
fields[<id>][value]=<valor>
fields[<id>][raw_value]=<valor>
fields[<id>][required]=1|0
origem=alpha-home-01-lp
```

Campos (ids reais do form do WP, na mesma ordem):

| id | tipo | título | valor |
|---|---|---|---|
| `name` | text | Nome | nome |
| `email` | email | Email | e-mail |
| `field_bb2d15f` | tel | Telefone | telefone em E.164 (`+5511…`) |
| `field_4169f50` | text | Nome da Empresa | empresa |
| `field_b47b91e` | html | (vazio) | vazio |
| `field_13a1e79` | select | Qual o seu segmento? | segmento |
| `field_5cf7e87` | html | (vazio) | vazio |
| `faturamento` | select | Faturamento | faixa (ex.: `50 mil até 80 mil`) |
| `cnpj` | text | Seu CNPJ | CNPJ com máscara (só em "Até 30 mil") |
| `field_4e810df` | html | (vazio) | vazio |
| `disposto_investir` | select | Você investiria R$4.000,00 por mês para vender mais? | `obrigado` (Sim) / `agradecimento` (Não), como no WP |
| `utm_source`, `utm_campaign`, `utm_medium`, `utm_id`, `utm_content`, `utm_term`, `fbclid`, `gclid`, `fbc`, `gcl_aw` | hidden | (o próprio id) | first-touch lido no navegador (30 dias em `localStorage`). `fbc`/`gcl_aw` vêm dos cookies `_fbc`/`_gcl_aw`; sem cookie, o `fbc` é montado do `fbclid` (`fb.1.<ms>.<fbclid>`) |
| `creation_time` | hidden | creation_time | Unix (segundos) no envio |
| `debug_full_url` | hidden | debug_full_url | URL completa da página no envio |
| `redirect_url` | hidden | redirect_url | URL de destino com barra no fim, como no WP (ex.: `https://assessorialpha.com/obrigado-a/`) |
| `tipo_lead` | hidden | tipo_lead | `a`, `b`, `c`, `desqualificado` ou `qualificado-geral` |
| `field_a8828d3` | html | (vazio) | vazio |

Obrigatórios (`required=1`): `name`, `email`, `field_bb2d15f`, `field_4169f50`, `field_13a1e79` e `faturamento`, como no HTML do form. Os títulos dos ocultos são o próprio id, como na referência. Os rótulos dos 4 campos `html` só existem no editor do Elementor e não aparecem no HTML público, então vão vazios.

Diferença intencional em relação ao WP: as UTMs vêm do navegador do próprio visitante. No WP, o cache do LiteSpeed servia o HTML com UTMs de outro visitante já preenchidas nos campos ocultos.

## Pendências (Max)

- Faixa "80 mil até 100 mil" não está em nenhuma faixa do script do WP: vai com `tipo_lead` `qualificado-geral` e `redirect_url` `…/obrigado/`, e o visitante vê a `/obrigado-a`.
- Rótulos dos 4 campos `html` do form da 00-lp no editor do Elementor (`field_b47b91e`, `field_5cf7e87`, `field_4e810df`, `field_a8828d3`), se o n8n precisar de `title` idêntico. Hoje vão vazios.
- `/agradecimento`: texto provisório ("Cadastro Concluído!" + botão). A página do WP está quebrada.
