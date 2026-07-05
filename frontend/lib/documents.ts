import { NdaFormData } from "@/lib/types";
import { getSession } from "@/lib/session";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type DocumentSummary = {
  id: number;
  type: string;
  title: string;
  createdAt: string;
};

export type DocumentDetail = DocumentSummary & {
  data: NdaFormData;
};

function authHeader(): string {
  const session = getSession();
  if (!session) {
    throw new Error("You must be signed in to do that");
  }
  return `Bearer ${session.token}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? "Request failed");
  }
  return response.json();
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch(`${API_URL}/documents`, {
    headers: { Authorization: authHeader() },
  });
  return parseResponse(response);
}

export async function getDocument(id: number): Promise<DocumentDetail> {
  const response = await fetch(`${API_URL}/documents/${id}`, {
    headers: { Authorization: authHeader() },
  });
  return parseResponse(response);
}

export async function saveDocument(title: string, data: NdaFormData): Promise<DocumentSummary> {
  const response = await fetch(`${API_URL}/documents`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: authHeader() },
    body: JSON.stringify({ type: "mutual-nda", title, data }),
  });
  return parseResponse(response);
}
