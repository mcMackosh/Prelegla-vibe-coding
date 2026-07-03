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

export async function sendNdaChatMessage(messages: ChatMessage[]): Promise<NdaChatResult> {
  const response = await fetch(`${API_URL}/chat/nda`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message = Array.isArray(body?.message) ? body.message.join(", ") : body?.message;
    throw new Error(message ?? "Chat request failed");
  }

  return response.json();
}
