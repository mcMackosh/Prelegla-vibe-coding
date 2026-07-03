"use client";

import { useState } from "react";
import { ChatMessage, sendNdaChatMessage } from "@/lib/chat";
import { NdaFormData } from "@/lib/types";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! I can help you fill out your Mutual NDA. Tell me about the two parties involved, and I'll ask for anything else I need.",
};

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M4 5h16v11H7l-3 3V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function NdaChatPanel({
  onFieldsExtracted,
}: {
  onFieldsExtracted: (fields: Partial<NdaFormData>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
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
    <>
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 flex h-[28rem] w-96 max-w-[calc(100vw-3rem)] flex-col overflow-hidden rounded-xl border border-brand-100 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-brand-100 bg-brand-900 px-4 py-3">
            <span className="text-sm font-semibold text-white">NDA Assistant</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="text-white/70 hover:text-white"
            >
              <CloseIcon />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-6 bg-brand-800 text-white"
                    : "mr-6 bg-brand-50 text-ink"
                }`}
              >
                {message.content}
              </div>
            ))}
            {status === "sending" && (
              <div className="mr-6 rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700/70">
                Typing…
              </div>
            )}
          </div>

          {status === "error" && (
            <p className="px-4 pb-2 text-sm text-red-600">
              Something went wrong talking to the assistant. Please try again.
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex gap-2 border-t border-brand-100 p-3">
            <input
              className="w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
              placeholder="Type a message…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status === "sending"}
            />
            <button
              type="submit"
              disabled={status === "sending" || !input.trim()}
              className="shrink-0 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close chat assistant" : "Open chat assistant"}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-800 text-white shadow-lg transition hover:bg-brand-900"
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </button>
    </>
  );
}
