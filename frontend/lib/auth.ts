const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type AuthCredentials = {
  email: string;
  password: string;
};

export type AuthResponse = {
  status: string;
  email: string;
};

async function postAuth(path: "signup" | "signin", credentials: AuthCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? "Request failed");
  }

  return response.json();
}

export function signUp(credentials: AuthCredentials) {
  return postAuth("signup", credentials);
}

export function signIn(credentials: AuthCredentials) {
  return postAuth("signin", credentials);
}
