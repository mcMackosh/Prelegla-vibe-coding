const TOKEN_KEY = "legalflow.token";
const EMAIL_KEY = "legalflow.email";

export type Session = {
  token: string;
  email: string;
};

/** KAN-5: sessions are just a JWT in localStorage — the backing database (and any
 * accounts in it) is temporary and reset on every server restart, so there is no
 * need for anything more durable here. */
export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  const email = window.localStorage.getItem(EMAIL_KEY);
  return token && email ? { token, email } : null;
}

export function setSession(token: string, email: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(EMAIL_KEY, email);
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(EMAIL_KEY);
}
