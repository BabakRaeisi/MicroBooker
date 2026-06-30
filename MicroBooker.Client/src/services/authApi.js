const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5001";

async function postJson(url, payload) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

export function register(payload) {
  return postJson(`${AUTH_BASE_URL}/api/Auth/register`, payload);
}

export function login(payload) {
  return postJson(`${AUTH_BASE_URL}/api/Auth/login`, payload);
}
