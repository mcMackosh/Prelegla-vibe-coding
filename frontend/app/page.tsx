"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthNav from "@/components/AuthNav";
import NdaChatPanel from "@/components/NdaChatPanel";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import SiteHeader from "@/components/SiteHeader";
import { getDocument, saveDocument } from "@/lib/documents";
import { getSession } from "@/lib/session";
import { EMPTY_FORM_DATA, NdaFormData } from "@/lib/types";

const NdaDownloadButton = dynamic(() => import("@/components/NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-md bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
      Loading…
    </span>
  ),
});

function SaveDocumentButton({ formData }: { formData: NdaFormData }) {
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    // localStorage isn't available during SSR, so this reads the external session
    // state after mount rather than during render (avoids a hydration mismatch).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSignedIn(getSession() !== null);
  }, []);

  if (!signedIn) {
    return null;
  }

  async function handleSave() {
    setStatus("saving");
    setErrorMessage("");
    try {
      const title =
        [formData.partyAName, formData.partyBName].filter((name) => name.trim()).join(" × ") ||
        "Untitled Mutual NDA";
      await saveDocument(title, formData);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Failed to save document");
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleSave}
        disabled={status === "saving"}
        className="rounded-md border border-brand-100 bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm hover:bg-brand-50 disabled:opacity-50"
      >
        {status === "saving" ? "Saving…" : "Save to My Documents"}
      </button>
      {status === "saved" && <span className="text-sm text-green-700">Saved.</span>}
      {status === "error" && <span className="text-sm text-red-600">{errorMessage}</span>}
    </div>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState<NdaFormData>(EMPTY_FORM_DATA);

  useEffect(() => {
    const documentId = searchParams.get("documentId");
    if (!documentId || !getSession()) return;

    getDocument(Number(documentId))
      .then((document) => setFormData(document.data))
      .catch(() => {
        // Not our document, or it no longer exists — leave the form as-is.
      });
  }, [searchParams]);

  function handleFieldChange(key: keyof NdaFormData, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldsExtracted(fields: Partial<NdaFormData>) {
    const nonEmptyFields = Object.fromEntries(
      Object.entries(fields).filter(([, value]) => value)
    );
    setFormData((prev) => ({ ...prev, ...nonEmptyFields }));
  }

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader>
        <AuthNav />
      </SiteHeader>

      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-serif text-3xl font-semibold text-brand-900">Mutual NDA Creator</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Chat with the assistant or fill in the form directly to generate a Common Paper Mutual
            Non-Disclosure Agreement, preview it live, and download it as a PDF.
          </p>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
        <section className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">
            Agreement Details
          </h2>
          <div className="rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
            <NdaForm formData={formData} onFieldChange={handleFieldChange} />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <NdaDownloadButton formData={formData} />
            <SaveDocumentButton formData={formData} />
          </div>
        </section>

        <section className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">
            Live Preview
          </h2>
          <NdaPreview formData={formData} />
        </section>
      </main>

      <NdaChatPanel onFieldsExtracted={handleFieldsExtracted} />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
