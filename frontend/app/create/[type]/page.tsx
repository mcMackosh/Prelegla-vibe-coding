"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import AuthNav from "@/components/AuthNav";
import DocumentChatPanel from "@/components/DocumentChatPanel";
import GenericDocumentForm from "@/components/GenericDocumentForm";
import GenericDocumentPreview from "@/components/GenericDocumentPreview";
import SiteHeader from "@/components/SiteHeader";
import { getDocument, saveDocument } from "@/lib/documents";
import { getSession } from "@/lib/session";
import { DocumentTypeDetail, getDocumentType } from "@/lib/templates";

const GenericDocumentDownloadButton = dynamic(
  () => import("@/components/GenericDocumentDownloadButton"),
  {
    ssr: false,
    loading: () => (
      <span className="inline-flex items-center justify-center rounded-md bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
        Loading…
      </span>
    ),
  }
);

function SaveDocumentButton({
  documentTypeId,
  documentName,
  formData,
}: {
  documentTypeId: string;
  documentName: string;
  formData: Record<string, string>;
}) {
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
      await saveDocument(documentTypeId, documentName, formData);
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

function CreateDocumentContent() {
  const params = useParams<{ type: string }>();
  const searchParams = useSearchParams();
  const documentTypeId = params.type;

  const [documentType, setDocumentType] = useState<DocumentTypeDetail | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    getDocumentType(documentTypeId)
      .then((detail) => {
        setDocumentType(detail);
        setFormData(Object.fromEntries(detail.fields.map((f) => [f.key, ""])));
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load document type"));
  }, [documentTypeId]);

  useEffect(() => {
    const documentId = searchParams.get("documentId");
    if (!documentId || !getSession()) return;

    getDocument(Number(documentId))
      .then((document) => setFormData((prev) => ({ ...prev, ...document.data })))
      .catch(() => {
        // Not our document, or it no longer exists — leave the form as-is.
      });
  }, [searchParams]);

  function handleFieldChange(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  function handleFieldsExtracted(fields: Record<string, string>) {
    const nonEmptyFields = Object.fromEntries(Object.entries(fields).filter(([, value]) => value));
    setFormData((prev) => ({ ...prev, ...nonEmptyFields }));
  }

  if (error) {
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader>
          <AuthNav />
        </SiteHeader>
        <main className="mx-auto max-w-3xl px-6 py-10">
          <p className="text-sm text-red-600">{error}</p>
          <Link href="/create" className="mt-4 inline-block text-sm font-medium text-brand-700 hover:text-brand-900">
            ← Back to document types
          </Link>
        </main>
      </div>
    );
  }

  if (!documentType) {
    return (
      <div className="min-h-screen bg-paper">
        <SiteHeader>
          <AuthNav />
        </SiteHeader>
        <main className="mx-auto max-w-3xl px-6 py-10 text-sm text-ink/60">Loading…</main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader>
        <AuthNav />
      </SiteHeader>

      <div className="border-b border-brand-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <h1 className="font-serif text-3xl font-semibold text-brand-900">{documentType.name}</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/70">
            Chat with the assistant or fill in the form directly, preview it live, and download it as a PDF.
          </p>
        </div>
      </div>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-10 lg:grid-cols-2">
        <section className="space-y-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-brand-700">Details</h2>
          <div className="rounded-xl border border-brand-100 bg-white p-6 shadow-sm">
            <GenericDocumentForm
              fields={documentType.fields}
              formData={formData}
              onFieldChange={handleFieldChange}
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <GenericDocumentDownloadButton
              title={documentType.name}
              clauses={documentType.clauses}
              attribution={documentType.attribution}
              formData={formData}
            />
            <SaveDocumentButton
              documentTypeId={documentType.id}
              documentName={documentType.name}
              formData={formData}
            />
          </div>
        </section>

        <section className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-700">Live Preview</h2>
          <GenericDocumentPreview
            title={documentType.name}
            clauses={documentType.clauses}
            attribution={documentType.attribution}
            formData={formData}
          />
        </section>
      </main>

      <DocumentChatPanel
        documentTypeId={documentType.id}
        documentName={documentType.name}
        onFieldsExtracted={handleFieldsExtracted}
      />
    </div>
  );
}

export default function CreateDocumentPage() {
  return (
    <Suspense fallback={null}>
      <CreateDocumentContent />
    </Suspense>
  );
}
