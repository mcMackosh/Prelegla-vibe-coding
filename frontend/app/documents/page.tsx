"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import AuthNav from "@/components/AuthNav";
import SiteHeader from "@/components/SiteHeader";
import { DocumentSummary, listDocuments } from "@/lib/documents";
import { getSession } from "@/lib/session";

export default function DocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!getSession()) {
      router.push("/signin");
      return;
    }

    listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"));
  }, [router]);

  return (
    <div className="min-h-screen bg-paper">
      <SiteHeader>
        <AuthNav />
      </SiteHeader>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="mb-6 font-serif text-2xl font-semibold text-brand-900">My Documents</h1>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {documents && documents.length === 0 && (
          <p className="text-sm text-ink/60">
            You haven&apos;t saved any documents yet.{" "}
            <Link href="/" className="font-medium text-brand-700 hover:text-brand-900">
              Create one
            </Link>
            .
          </p>
        )}

        {documents && documents.length > 0 && (
          <ul className="space-y-3">
            {documents.map((document) => (
              <li key={document.id}>
                <Link
                  href={`/?documentId=${document.id}`}
                  className="block rounded-xl border border-brand-100 bg-white p-4 shadow-sm transition hover:border-accent-500"
                >
                  <p className="font-serif text-base font-semibold text-brand-900">{document.title}</p>
                  <p className="text-xs text-ink/60">
                    {document.type} · {new Date(document.createdAt).toLocaleString()}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
