"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AuthNav from "@/components/AuthNav";
import SiteHeader from "@/components/SiteHeader";
import { sendRouteMessage } from "@/lib/chat";
import { DocumentTypeSummary, listDocumentTypes } from "@/lib/templates";

function documentHref(type: DocumentTypeSummary): string {
  return type.id === "mutual-nda" ? "/" : `/create/${type.id}`;
}

function RouterAssistant() {
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const [result, setResult] = useState<{ documentTypeId: string; reply: string } | null>(null);
  const [matchedName, setMatchedName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || status === "sending") return;

    setStatus("sending");
    setResult(null);
    try {
      const routeResult = await sendRouteMessage(message.trim());
      const types = await listDocumentTypes();
      const matched = types.find((t) => t.id === routeResult.documentTypeId);
      setMatchedName(matched?.name ?? routeResult.documentTypeId);
      setResult(routeResult);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
      <h2 className="mb-2 font-serif text-lg font-semibold text-brand-900">Not sure which document you need?</h2>
      <p className="mb-4 text-sm text-ink/70">
        Describe what you&apos;re trying to do, and we&apos;ll point you to the closest document we can generate.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          className="w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
          placeholder="e.g. I need to share confidential data with a contractor"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          disabled={status === "sending"}
        />
        <button
          type="submit"
          disabled={status === "sending" || !message.trim()}
          className="shrink-0 rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 disabled:opacity-50"
        >
          {status === "sending" ? "Thinking…" : "Find my document"}
        </button>
      </form>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-600">Something went wrong. Please try again.</p>
      )}

      {result && (
        <div className="mt-4 rounded-md bg-brand-50 p-4">
          <p className="text-sm text-ink">{result.reply}</p>
          <Link
            href={result.documentTypeId === "mutual-nda" ? "/" : `/create/${result.documentTypeId}`}
            className="mt-2 inline-block text-sm font-semibold text-brand-700 hover:text-brand-900"
          >
            Continue with {matchedName} →
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CreatePage() {
  const [types, setTypes] = useState<DocumentTypeSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    listDocumentTypes()
      .then(setTypes)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load document types"));
  }, []);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader>
        <AuthNav />
      </SiteHeader>

      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-5xl px-6 py-8">
          <h1 className="font-serif text-3xl font-semibold text-brand-900">Create a Document</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Pick a document type below, or describe what you need and let the assistant point you to the
            closest match.
          </p>
        </div>
      </div>

      <main className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <RouterAssistant />

        {error && <p className="text-sm text-red-600">{error}</p>}

        {types && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {types.map((type) => (
              <Link
                key={type.id}
                href={documentHref(type)}
                className="block rounded-xl border border-brand-100 bg-white p-5 shadow-sm transition hover:border-accent-500"
              >
                <h3 className="font-serif text-base font-semibold text-brand-900">{type.name}</h3>
                <p className="mt-1 text-sm text-ink/70">{type.description}</p>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
