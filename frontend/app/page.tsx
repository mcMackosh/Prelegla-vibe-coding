"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import NdaChatPanel from "@/components/NdaChatPanel";
import NdaForm from "@/components/NdaForm";
import NdaPreview from "@/components/NdaPreview";
import SiteHeader from "@/components/SiteHeader";
import { EMPTY_FORM_DATA, NdaFormData } from "@/lib/types";

const NdaDownloadButton = dynamic(() => import("@/components/NdaDownloadButton"), {
  ssr: false,
  loading: () => (
    <span className="inline-flex items-center justify-center rounded-md bg-brand-100 px-4 py-2 text-sm font-semibold text-brand-700">
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
    <div className="min-h-screen bg-paper">
      <SiteHeader>
        <nav className="flex shrink-0 gap-6 text-sm font-medium">
          <Link href="/signin" className="text-brand-700 hover:text-brand-900">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-md bg-brand-800 px-3 py-1.5 text-white shadow-sm hover:bg-brand-900"
          >
            Sign up
          </Link>
        </nav>
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
          <NdaDownloadButton formData={formData} />
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
