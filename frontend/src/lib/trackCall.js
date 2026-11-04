import { BASE_URL } from "@/lib/api";

export function trackCall(shopId, source = "profile") {
  if (!shopId) return;
  try {
    fetch(`${BASE_URL}/customers/${shopId}/call`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
      keepalive: true,
    }).catch(() => {});
  } catch {}
}
