import { NdaFormData } from "@/lib/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type NdaChatResult = {
  reply: string;
  fields: Partial<NdaFormData>;
};

export type DocumentChatResult = {
  reply: string;
  fields: Record<string, string>;
};

export type RouteResult = {
  documentTypeId: string;
  reply: string;
};

async function parseResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? fallbackMessage);
  }
  return response.json();
}

export async function sendNdaChatMessage(messages: ChatMessage[]): Promise<NdaChatResult> {
  const response = await fetch(`${API_URL}/chat/nda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  return parseResponse(response, "Chat request failed");
}

export async function sendDocumentChatMessage(
  documentTypeId: string,
  messages: ChatMessage[]
): Promise<DocumentChatResult> {
  const response = await fetch(`${API_URL}/chat/documents/${documentTypeId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  return parseResponse(response, "Chat request failed");
}

export async function sendRouteMessage(message: string): Promise<RouteResult> {
  const response = await fetch(`${API_URL}/chat/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  return parseResponse(response, "Routing request failed");
}
