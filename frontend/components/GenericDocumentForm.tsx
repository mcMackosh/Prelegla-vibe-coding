"use client";

import { TemplateField } from "@/lib/templates";

export default function GenericDocumentForm({
  fields,
  formData,
  onFieldChange,
}: {
  fields: TemplateField[];
  formData: Record<string, string>;
  onFieldChange: (key: string, value: string) => void;
}) {
  const inputClasses =
    "w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <label key={field.key} className="block">
          <span className="mb-1 block text-sm font-medium text-ink/80">{field.label}</span>
          <input
            className={inputClasses}
            value={formData[field.key] ?? ""}
            onChange={(e) => onFieldChange(field.key, e.target.value)}
          />
        </label>
      ))}
    </div>
  );
}
