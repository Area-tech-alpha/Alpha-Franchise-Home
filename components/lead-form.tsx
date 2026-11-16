"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ArrowRight, Check } from "lucide-react";
import { submitLead } from "@/app/actions/submit-lead";
import type PhoneFieldType from "@/components/ui/phone-field";
import { content } from "@/lib/content";
import { ATUACAO_EXIGE_FATURAMENTO, type LeadTracking } from "@/lib/lead-constants";
import { captureBrowserTracking } from "@/lib/tracking";

const { form } = content;
const { fields } = form;

// Seletor de DDI (libphonenumber) e zod ficam fora do JS inicial: o seletor
// carrega na primeira interação com o form e o zod no envio.
type PhoneFieldComponent = typeof PhoneFieldType;
let phoneFieldPromise: Promise<PhoneFieldComponent> | null = null;
function loadPhoneField() {
  phoneFieldPromise ??= import("@/components/ui/phone-field").then((m) => m.default);
  return phoneFieldPromise;
}

// Antes do seletor carregar, o telefone digitado vale como número do Brasil.
function fallbackToE164(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+55${digits}` : undefined;
}

type FormValues = {
  nome: string;
  email: string;
  telefone: string | undefined;
  atuacao: string;
  faturamento_agencia: string;
  inicio: string;
  investimento: string;
};

type FieldName = keyof FormValues;

const initial: FormValues = {
  nome: "",
  email: "",
  telefone: undefined,
  atuacao: "",
  faturamento_agencia: "",
  inicio: "",
  investimento: "",
};

function FieldError({ name, message }: { name: FieldName; message?: string }) {
  if (!message) return null;
  return (
    <span id={`erro-${name}`} className="mt-1 block text-[11.5px] text-error" role="alert">
      {message}
    </span>
  );
}

// Respostas como cartões/chips clicáveis: rádio nativo (teclado e leitor de
// tela funcionam sem JS extra). "short" é só o texto visível do chip; o leitor
// de tela lê o valor literal, que é o que vai no envio.
function ChoiceGroup({
  name,
  legend,
  options,
  short,
  value,
  error,
  columns,
  variant,
  onChange,
}: {
  name: FieldName;
  legend: string;
  options: readonly string[];
  short?: readonly string[];
  value: string;
  error?: string;
  columns: string;
  variant: "card" | "chip";
  onChange: (value: string) => void;
}) {
  return (
    <fieldset
      id={name}
      tabIndex={-1}
      aria-invalid={!!error}
      aria-describedby={error ? `erro-${name}` : undefined}
      className="min-w-0 outline-none"
    >
      <legend className="field-label">{legend}</legend>
      <div className={`grid gap-1.5 ${columns}`}>
        {options.map((opt, i) => {
          const checked = value === opt;
          const label = short?.[i];
          return (
            <label
              key={opt}
              className={`choice choice-${variant} ${checked ? "is-checked" : ""} ${error ? "is-invalid" : ""}`}
            >
              <input
                type="radio"
                name={name}
                value={opt}
                checked={checked}
                onChange={() => onChange(opt)}
                className="sr-only"
              />
              {variant === "card" && (
                <span className="choice-dot" aria-hidden="true">
                  {checked && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
                </span>
              )}
              {label ? (
                <>
                  <span aria-hidden="true">{label}</span>
                  <span className="sr-only">{opt}</span>
                </>
              ) : (
                <span>{opt}</span>
              )}
            </label>
          );
        })}
      </div>
      <FieldError name={name} message={error} />
    </fieldset>
  );
}

export default function LeadForm() {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const trackingRef = useRef<LeadTracking>({});
  const [PhoneField, setPhoneField] = useState<ComponentType<Parameters<PhoneFieldComponent>[0]> | null>(null);
  const [rawPhone, setRawPhone] = useState("");
  const rawPhoneRef = useRef("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  function warmUp() {
    if (PhoneField) return;
    loadPhoneField().then((Component) => {
      setValues((prev) => (prev.telefone ? prev : { ...prev, telefone: fallbackToE164(rawPhoneRef.current) }));
      setPhoneField(() => Component);
    });
  }

  useEffect(() => {
    trackingRef.current = captureBrowserTracking();
  }, []);

  const needsFaturamento = values.atuacao === ATUACAO_EXIGE_FATURAMENTO;

  function set(field: FieldName, value: string | undefined) {
    setValues((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function setAtuacao(value: string) {
    setValues((prev) => ({
      ...prev,
      atuacao: value,
      faturamento_agencia: value === ATUACAO_EXIGE_FATURAMENTO ? prev.faturamento_agencia : "",
    }));
    setErrors((prev) => ({ ...prev, atuacao: undefined, faturamento_agencia: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value;
    if (honeypot) return;

    const payload = {
      nome: values.nome.trim(),
      email: values.email.trim(),
      telefone: (PhoneField ? values.telefone : fallbackToE164(rawPhone)) ?? "",
      atuacao: values.atuacao,
      ...(needsFaturamento && { faturamento_agencia: values.faturamento_agencia }),
      inicio: values.inicio,
      investimento: values.investimento,
    };

    const { leadSchema } = await import("@/lib/validation");
    const parsed = leadSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const first = (Object.keys(initial) as FieldName[]).find((f) => fieldErrors[f]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setSending(true);
    setGlobalError("");
    try {
      const res = await submitLead(parsed.data, trackingRef.current);
      if (res.success) {
        window.location.assign(res.redirectTo);
        return;
      }
      setGlobalError(res.error);
    } catch {
      setGlobalError(form.errors.destination);
    }
    setSending(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      onFocusCapture={warmUp}
      onPointerDownCapture={warmUp}
      noValidate
      className="flex flex-col gap-3"
    >
      <input type="text" name="website" tabIndex={-1} aria-hidden="true" autoComplete="off" className="hidden" />

      <div>
        <label htmlFor="nome" className="field-label">
          {fields.nome.label}
        </label>
        <input
          id="nome"
          name="nome"
          type="text"
          autoComplete="name"
          required
          placeholder={fields.nome.placeholder}
          value={values.nome}
          onChange={(e) => set("nome", e.target.value)}
          aria-invalid={!!errors.nome}
          aria-describedby={errors.nome ? "erro-nome" : undefined}
          className="field-input"
        />
        <FieldError name="nome" message={errors.nome} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="email" className="field-label">
            {fields.email.label}
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder={fields.email.placeholder}
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "erro-email" : undefined}
            className="field-input"
          />
          <FieldError name="email" message={errors.email} />
        </div>

        <div>
          <label htmlFor="telefone" className="field-label">
            {fields.telefone.label}
          </label>
          {PhoneField ? (
            <PhoneField
              value={values.telefone}
              onChange={(v) => set("telefone", v)}
              placeholder={fields.telefone.placeholder}
              invalid={!!errors.telefone}
              describedBy={errors.telefone ? "erro-telefone" : undefined}
              autoFocus={phoneFocused}
            />
          ) : (
            // Mesmo layout do seletor carregado, para não haver layout shift.
            <div className="phone-input-wrapper">
              <span
                className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border bg-white/[0.04] px-2.5 text-[13.5px] text-white"
                aria-hidden="true"
              >
                <span>🇧🇷</span>
                <span>+55</span>
                <span className="text-[10px] text-text-dim">▾</span>
              </span>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                autoComplete="tel"
                placeholder={fields.telefone.placeholder}
                value={rawPhone}
                onChange={(e) => {
                  rawPhoneRef.current = e.target.value;
                  setRawPhone(e.target.value);
                }}
                onFocus={() => setPhoneFocused(true)}
                aria-invalid={!!errors.telefone}
                aria-describedby={errors.telefone ? "erro-telefone" : undefined}
                className="PhoneInputInput"
              />
            </div>
          )}
          <FieldError name="telefone" message={errors.telefone} />
        </div>
      </div>

      <ChoiceGroup
        name="atuacao"
        legend={fields.atuacao.label}
        options={fields.atuacao.options}
        value={values.atuacao}
        error={errors.atuacao}
        columns="grid-cols-3"
        variant="card"
        onChange={setAtuacao}
      />

      {/* Faturamento: sempre no DOM para animar a abertura; fechado fica inert
          (fora do teclado e do leitor de tela). */}
      <div className="collapse-rows" data-open={needsFaturamento} inert={!needsFaturamento}>
        <div className="min-h-0 overflow-hidden">
          <ChoiceGroup
            name="faturamento_agencia"
            legend={fields.faturamentoAgencia.label}
            options={fields.faturamentoAgencia.options}
            short={fields.faturamentoAgencia.short}
            value={values.faturamento_agencia}
            error={errors.faturamento_agencia}
            columns="grid-cols-3"
            variant="chip"
            onChange={(v) => set("faturamento_agencia", v)}
          />
        </div>
      </div>

      <ChoiceGroup
        name="inicio"
        legend={fields.inicio.label}
        options={fields.inicio.options}
        value={values.inicio}
        error={errors.inicio}
        columns="grid-cols-2 min-[420px]:grid-cols-4"
        variant="chip"
        onChange={(v) => set("inicio", v)}
      />

      <ChoiceGroup
        name="investimento"
        legend={fields.investimento.label}
        options={fields.investimento.options}
        short={fields.investimento.short}
        value={values.investimento}
        error={errors.investimento}
        columns="grid-cols-3 min-[420px]:grid-cols-4"
        variant="chip"
        onChange={(v) => set("investimento", v)}
      />

      {globalError && (
        <p className="text-center text-sm text-error" role="alert">
          {globalError}
        </p>
      )}

      <button type="submit" disabled={sending} className="btn btn-primary mt-1 min-h-[50px] w-full py-3.5">
        {sending ? form.sending : form.submitLabel}
        {!sending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </form>
  );
}
