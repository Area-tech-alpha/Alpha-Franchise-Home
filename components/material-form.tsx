"use client";

import { useEffect, useRef, useState, type ComponentType } from "react";
import { ArrowRight } from "lucide-react";
import { submitMaterialLead } from "@/app/actions/submit-material-lead";
import type PhoneFieldType from "@/components/ui/phone-field";
import { FlagBR } from "@/components/ui/flags";
import type { LeadTracking } from "@/lib/lead-constants";
import { material } from "@/lib/material-content";
import { captureBrowserTracking } from "@/lib/tracking";

const { form } = material;
const { fields } = form;

// Mesmo esquema do form da franquia: seletor de DDI na primeira interação, zod no envio.
type PhoneFieldComponent = typeof PhoneFieldType;
let phoneFieldPromise: Promise<PhoneFieldComponent> | null = null;
function loadPhoneField() {
  phoneFieldPromise ??= import("@/components/ui/phone-field").then((m) => m.default);
  return phoneFieldPromise;
}

function fallbackToE164(raw: string) {
  const digits = raw.replace(/\D/g, "");
  return digits ? `+55${digits}` : undefined;
}

type FieldName = "nome" | "telefone" | "email";
const FIELD_ORDER: FieldName[] = ["nome", "telefone", "email"];

function FieldError({ name, message }: { name: FieldName; message?: string }) {
  if (!message) return null;
  return (
    <span id={`erro-${name}`} className="mt-1 block text-[12px] text-error" role="alert">
      {message}
    </span>
  );
}

export default function MaterialForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState<string | undefined>(undefined);
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({});
  const [sending, setSending] = useState(false);
  const [globalError, setGlobalError] = useState("");
  const trackingRef = useRef<LeadTracking>({});
  const [PhoneField, setPhoneField] = useState<ComponentType<Parameters<PhoneFieldComponent>[0]> | null>(null);
  const [rawPhone, setRawPhone] = useState("");
  const rawPhoneRef = useRef("");
  const [phoneFocused, setPhoneFocused] = useState(false);

  useEffect(() => {
    trackingRef.current = captureBrowserTracking();
  }, []);

  function warmUp() {
    if (PhoneField) return;
    loadPhoneField().then((Component) => {
      setTelefone((prev) => prev ?? fallbackToE164(rawPhoneRef.current));
      setPhoneField(() => Component);
    });
  }

  function clearError(field: FieldName) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;

    const honeypot = (e.currentTarget.elements.namedItem("website") as HTMLInputElement | null)?.value;
    if (honeypot) return;

    const payload = {
      nome: nome.trim(),
      telefone: (PhoneField ? telefone : fallbackToE164(rawPhone)) ?? "",
      email: email.trim(),
    };

    const { materialLeadSchema } = await import("@/lib/material-schema");
    const parsed = materialLeadSchema.safeParse(payload);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<FieldName, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as FieldName;
        fieldErrors[field] ??= issue.message;
      }
      setErrors(fieldErrors);
      const first = FIELD_ORDER.find((f) => fieldErrors[f]);
      if (first) document.getElementById(first)?.focus();
      return;
    }

    setSending(true);
    setGlobalError("");
    try {
      const res = await submitMaterialLead(parsed.data, trackingRef.current, window.location.href);
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
      className="flex flex-col gap-4"
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
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            clearError("nome");
          }}
          aria-invalid={!!errors.nome}
          aria-describedby={errors.nome ? "erro-nome" : undefined}
          className="field-input field-input-lg"
        />
        <FieldError name="nome" message={errors.nome} />
      </div>

      <div className="field-lg">
        <label htmlFor="telefone" className="field-label">
          {fields.telefone.label}
        </label>
        {PhoneField ? (
          <PhoneField
            value={telefone}
            onChange={(v) => {
              setTelefone(v);
              clearError("telefone");
            }}
            placeholder={fields.telefone.placeholder}
            invalid={!!errors.telefone}
            describedBy={errors.telefone ? "erro-telefone" : undefined}
            autoFocus={phoneFocused}
            svgFlags
          />
        ) : (
          // Mesmo layout do seletor carregado, para não haver layout shift.
          <div className="phone-input-wrapper">
            <span
              className="flex shrink-0 items-center gap-1.5 rounded-[9px] border border-border bg-white/[0.04] px-2.5 text-[13.5px] text-white"
              aria-hidden="true"
            >
              <FlagBR className="flag-svg" />
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
                clearError("telefone");
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

      <div>
        <label htmlFor="email" className="field-label">
          {fields.email.label}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder={fields.email.placeholder}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError("email");
          }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "erro-email" : undefined}
          className="field-input field-input-lg"
        />
        <FieldError name="email" message={errors.email} />
      </div>

      {globalError && (
        <p className="text-center text-sm text-error" role="alert">
          {globalError}
        </p>
      )}

      <button type="submit" disabled={sending} className="btn btn-primary mt-1 w-full">
        {sending ? form.sending : form.submitLabel}
        {!sending && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
      </button>
    </form>
  );
}
