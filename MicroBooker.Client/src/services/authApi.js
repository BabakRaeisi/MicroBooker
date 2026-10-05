import { requestFinished, requestStarted } from "../diagnostics";

const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_BASE_URL || "http://localhost:5001";

async function postJson(url, payload) {
  const requestId = requestStarted("POST", url);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const error = new Error(data?.message || `HTTP ${res.status}`);
      error.status = res.status;
      throw error;
    }

    requestFinished(requestId, res.status);
    return data;
  } catch (error) {
    requestFinished(requestId, error.status ?? null, error);
    throw error;
  }
}

export function register(payload) {
  return postJson(`${AUTH_BASE_URL}/api/Auth/register`, payload);
}

export function login(payload) {
  return postJson(`${AUTH_BASE_URL}/api/Auth/login`, payload);
}
