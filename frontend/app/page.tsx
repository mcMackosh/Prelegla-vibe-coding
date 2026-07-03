"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-6">
          <h1 className="text-2xl font-bold text-gray-900">Mutual NDA Creator</h1>
          <p className="text-sm text-gray-600">
            Fill in the details below to generate a Common Paper Mutual Non-Disclosure Agreement,
            preview it live, and download it as a PDF.
          </p>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-6 py-8 lg:grid-cols-2">
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
