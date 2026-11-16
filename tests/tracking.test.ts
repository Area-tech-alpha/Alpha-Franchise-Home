import { test } from "node:test";
import assert from "node:assert/strict";
import { captureTracking, TRACKING_STORAGE_KEY } from "@/lib/tracking";

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

const adUrl = "https://lp.ex.com/?utm_source=facebook&utm_medium=paid&utm_campaign=c1&utm_content=v2&utm_term=t&fbclid=FB1&x=1";

test("lê UTMs, fbclid, landing_page e referrer da URL", () => {
  const t = captureTracking({
    href: adUrl,
    search: new URL(adUrl).search,
    referrer: "https://l.facebook.com/",
    storage: memoryStorage(),
  });
  assert.deepEqual(t, {
    utm_source: "facebook",
    utm_medium: "paid",
    utm_campaign: "c1",
    utm_content: "v2",
    utm_term: "t",
    fbclid: "FB1",
    landing_page: adUrl,
    referrer: "https://l.facebook.com/",
  });
});

test("first-touch: segunda página da sessão não sobrescreve", () => {
  const storage = memoryStorage();
  captureTracking({ href: adUrl, search: new URL(adUrl).search, referrer: "", storage });
  const second = captureTracking({ href: "https://lp.ex.com/?utm_source=google", search: "?utm_source=google", referrer: "", storage });
  assert.equal(second.utm_source, "facebook");
  assert.equal(second.fbclid, "FB1");
  assert.ok(storage.getItem(TRACKING_STORAGE_KEY));
});

test("storage bloqueado: usa a página atual sem quebrar", () => {
  const blocked = {
    getItem: () => {
      throw new Error("SecurityError");
    },
    setItem: () => {
      throw new Error("SecurityError");
    },
  };
  const t = captureTracking({ href: "https://lp.ex.com/?fbclid=Z", search: "?fbclid=Z", referrer: "", storage: blocked });
  assert.equal(t.fbclid, "Z");
  assert.equal(t.referrer, undefined);
});
