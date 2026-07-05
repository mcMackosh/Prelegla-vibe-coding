"use client";

import { NDA_ATTRIBUTION, NDA_CLAUSES } from "@/lib/ndaClauses";
import { parseSegments, Segment } from "@/lib/richText";
import { NdaFormData } from "@/lib/types";

type OnFieldChange = (key: keyof NdaFormData, value: string) => void;

/** An inline, click-to-edit span used for fields embedded in flowing clause text. */
function EditableField({
  fieldKey,
  content,
  empty,
  onFieldChange,
}: {
  fieldKey: keyof NdaFormData;
  content: string;
  empty: boolean;
  onFieldChange: OnFieldChange;
}) {
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={fieldKey}
      onBlur={(e) => onFieldChange(fieldKey, e.currentTarget.textContent ?? "")}
      className={
        (empty
          ? "border-accent-300 bg-accent-50 text-accent-600"
          : "border-brand-200 bg-white font-medium text-brand-700") +
        " rounded border px-1.5 py-0.5 shadow-sm outline-none transition focus:border-accent-500 focus:ring-1 focus:ring-accent-500"
      }
    >
      {content}
    </span>
  );
}

function RichText({
  text,
  formData,
  onFieldChange,
}: {
  text: string;
  formData: NdaFormData;
  onFieldChange: OnFieldChange;
}) {
  const segments = parseSegments(text, formData);
  return (
    <>
      {segments.map((segment: Segment, i) => {
        if (segment.type === "bold") {
          return <strong key={i}>{segment.content}</strong>;
        }
        if (segment.type === "field") {
          if (!segment.fieldKey) {
            return <span key={i}>{segment.content}</span>;
          }
          return (
            <EditableField
              key={i}
              fieldKey={segment.fieldKey}
              content={segment.content}
              empty={segment.empty}
              onFieldChange={onFieldChange}
            />
          );
        }
        return <span key={i}>{segment.content}</span>;
      })}
    </>
  );
}

function CoverField({
  label,
  fieldKey,
  value,
  onFieldChange,
  multiline,
}: {
  label: string;
  fieldKey: keyof NdaFormData;
  value: string;
  onFieldChange: OnFieldChange;
  multiline?: boolean;
}) {
  const inputClasses =
    "mt-1 w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500";

  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wide text-brand-700/70">
        {label}
        {multiline ? (
          <textarea
            className={inputClasses}
            rows={2}
            placeholder="Not yet provided"
            value={value}
            onChange={(e) => onFieldChange(fieldKey, e.target.value)}
          />
        ) : (
          <input
            className={inputClasses}
            placeholder="Not yet provided"
            value={value}
            onChange={(e) => onFieldChange(fieldKey, e.target.value)}
          />
        )}
      </label>
    </div>
  );
}

function SignerField({
  fieldKey,
  value,
  placeholder,
  onFieldChange,
}: {
  fieldKey: keyof NdaFormData;
  value: string;
  placeholder: string;
  onFieldChange: OnFieldChange;
}) {
  return (
    <input
      className="w-full rounded-md border border-brand-100 bg-white px-3 py-2 text-sm text-ink shadow-sm transition focus:border-accent-500 focus:outline-none focus:ring-1 focus:ring-accent-500"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onFieldChange(fieldKey, e.target.value)}
    />
  );
}

export default function NdaPreview({
  formData,
  onFieldChange,
}: {
  formData: NdaFormData;
  onFieldChange: OnFieldChange;
}) {
  return (
    <article className="prose prose-sm max-w-none rounded-xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-serif text-xl font-semibold text-brand-900">Mutual Non-Disclosure Agreement</h1>

      <section className="not-prose mb-6 grid grid-cols-1 gap-x-6 gap-y-4 rounded-md bg-brand-50 p-4 sm:grid-cols-2">
        <CoverField label="Party A" fieldKey="partyAName" value={formData.partyAName} onFieldChange={onFieldChange} />
        <CoverField label="Party B" fieldKey="partyBName" value={formData.partyBName} onFieldChange={onFieldChange} />
        <CoverField
          label="Party A Address"
          fieldKey="partyAAddress"
          value={formData.partyAAddress}
          onFieldChange={onFieldChange}
        />
        <CoverField
          label="Party B Address"
          fieldKey="partyBAddress"
          value={formData.partyBAddress}
          onFieldChange={onFieldChange}
        />
        <CoverField
          label="Effective Date"
          fieldKey="effectiveDate"
          value={formData.effectiveDate}
          onFieldChange={onFieldChange}
        />
        <CoverField
          label="Purpose"
          fieldKey="purpose"
          value={formData.purpose}
          onFieldChange={onFieldChange}
          multiline
        />
      </section>

      <ol className="space-y-4">
        {NDA_CLAUSES.map((clause) => (
          <li key={clause.title}>
            <span className="font-semibold text-brand-900">{clause.title}. </span>
            <span className="text-ink/90">
              <RichText text={clause.body} formData={formData} onFieldChange={onFieldChange} />
            </span>
          </li>
        ))}
      </ol>

      <section className="not-prose mt-8 grid grid-cols-1 gap-6 border-t border-brand-100 pt-6 sm:grid-cols-2">
        {(
          [
            {
              label: "Party A",
              nameKey: "partyASignerName" as const,
              titleKey: "partyASignerTitle" as const,
            },
            {
              label: "Party B",
              nameKey: "partyBSignerName" as const,
              titleKey: "partyBSignerTitle" as const,
            },
          ]
        ).map((signer) => (
          <div key={signer.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">{signer.label} Signature</p>
            <div className="mt-3 space-y-2">
              <SignerField
                fieldKey={signer.nameKey}
                value={formData[signer.nameKey]}
                placeholder="Signer name"
                onFieldChange={onFieldChange}
              />
              <SignerField
                fieldKey={signer.titleKey}
                value={formData[signer.titleKey]}
                placeholder="Signer title"
                onFieldChange={onFieldChange}
              />
            </div>
          </div>
        ))}
      </section>

      <p className="mt-8 text-xs text-ink/40">{NDA_ATTRIBUTION}</p>
    </article>
  );
}
