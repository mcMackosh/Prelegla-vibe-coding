"use client";

import { useState } from "react";
import { ChatMessage, sendNdaChatMessage } from "@/lib/chat";
import { NdaFormData } from "@/lib/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you fill out your Mutual NDA. Tell me about the two parties involved, and I'll ask for anything else I need.",
};

export default function NdaChatPanel({
  onFieldsExtracted,
}: {
  onFieldsExtracted: (fields: Partial<NdaFormData>) => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || status === "sending") return;

    const nextMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setStatus("sending");

    try {
      const result = await sendNdaChatMessage(nextMessages);
      setMessages([...nextMessages, { role: "assistant", content: result.reply }]);
      onFieldsExtracted(result.fields);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex h-full flex-col rounded-md border border-gray-200 bg-white">
      <div className="flex-1 space-y-3 overflow-y-auto p-4" style={{ maxHeight: "28rem" }}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-md px-3 py-2 text-sm ${
              message.role === "user"
                ? "ml-6 bg-blue-600 text-white"
                : "mr-6 bg-gray-100 text-gray-900"
            }`}
          >
            {message.content}
          </div>
        ))}
        {status === "sending" && (
          <div className="mr-6 rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-500">Typing…</div>
        )}
      </div>

      {status === "error" && (
        <p className="px-4 text-sm text-red-600">
          Something went wrong talking to the assistant. Please try again.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 p-3">
        <input
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Type a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={status === "sending"}
        />
        <button
          type="submit"
          disabled={status === "sending" || !input.trim()}
          className="shrink-0 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
