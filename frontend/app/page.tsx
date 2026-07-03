"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import NdaChatPanel from "@/components/NdaChatPanel";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import { EMPTY_FORM_DATA, NdaFormData } from "@/lib/types";

const NdaDownloadButton = dynamic(() => import("@/components/NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-500">
      Loading…
    </span>
  ),
});

export default function Home() {
  const [formData, setFormData] = useState<NdaFormData>(EMPTY_FORM_DATA);

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
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-6 py-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold text-gray-900">Mutual NDA Creator</h1>
            <p className="text-sm text-gray-600">
              Fill in the details below to generate a Common Paper Mutual Non-Disclosure Agreement,
              preview it live, and download it as a PDF.
            </p>
          </div>
          <nav className="flex shrink-0 gap-4 pt-1 text-sm font-medium">
            <Link href="/signin" className="text-gray-700 hover:underline">
              Sign in
            </Link>
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-3">
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Chat Assistant
          </h2>
          <NdaChatPanel onFieldsExtracted={handleFieldsExtracted} />
        </section>

        <section className="space-y-6">
          <NdaForm formData={formData} onFieldChange={handleFieldChange} />
          <NdaDownloadButton formData={formData} />
        </section>

        <section className="lg:sticky lg:top-8 lg:self-start">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Live Preview
          </h2>
          <NdaPreview formData={formData} />
        </section>
      </main>
    </div>
  );
}
