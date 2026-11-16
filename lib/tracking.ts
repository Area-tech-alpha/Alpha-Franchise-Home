import { TRACKING_URL_KEYS, type LeadTracking } from "@/lib/lead-constants";

// Atribuição first-touch (navegador): na primeira página da sessão guarda UTMs,
// fbclid, landing_page e referrer. Visitas seguintes na mesma sessão não
// sobrescrevem o que já foi guardado.

export const TRACKING_STORAGE_KEY = "alpha-franchise:tracking";

type Env = { href: string; search: string; referrer: string; storage: Pick<Storage, "getItem" | "setItem"> | null };

export function fromPage({ href, search, referrer }: Pick<Env, "href" | "search" | "referrer">): LeadTracking {
  const tracking: LeadTracking = {};
  const params = new URLSearchParams(search);
  for (const key of TRACKING_URL_KEYS) {
    const value = params.get(key)?.slice(0, 500);
    if (value) tracking[key] = value;
  }
  tracking.landing_page = href.slice(0, 1000);
  if (referrer) tracking.referrer = referrer.slice(0, 1000);
  return tracking;
}

export function captureTracking(env: Env): LeadTracking {
  try {
    const stored = env.storage?.getItem(TRACKING_STORAGE_KEY);
    if (stored) return JSON.parse(stored) as LeadTracking;
  } catch {
    /* JSON inválido ou storage bloqueado: usa a página atual */
  }
  const current = fromPage(env);
  try {
    env.storage?.setItem(TRACKING_STORAGE_KEY, JSON.stringify(current));
  } catch {
    /* aba anônima / storage bloqueado */
  }
  return current;
}

export function captureBrowserTracking(): LeadTracking {
  let storage: Env["storage"] = null;
  try {
    storage = window.sessionStorage;
  } catch {
    storage = null;
  }
  return captureTracking({
    href: window.location.href,
    search: window.location.search,
    referrer: document.referrer,
    storage,
  });
}
