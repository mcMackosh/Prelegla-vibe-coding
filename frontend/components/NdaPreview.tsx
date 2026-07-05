import { NDA_ATTRIBUTION, NDA_CLAUSES } from "@/lib/ndaClauses";
import { parseSegments, Segment } from "@/lib/richText";
import { NdaFormData } from "@/lib/types";

function RichText({ text, formData }: { text: string; formData: NdaFormData }) {
  const segments = parseSegments(text, formData);
  return (
    <>
      {segments.map((segment: Segment, i) => {
        if (segment.type === "bold") {
          return <strong key={i}>{segment.content}</strong>;
        }
        if (segment.type === "field") {
          return (
            <span
              key={i}
              className={
                segment.empty
                  ? "rounded bg-accent-100 px-1 text-accent-600"
                  : "rounded bg-brand-50 px-1 font-medium text-brand-700"
              }
            >
              {segment.content}
            </span>
          );
        }
        return <span key={i}>{segment.content}</span>;
      })}
    </>
  );
}

function CoverField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">{label}</dt>
      <dd className={value.trim() ? "text-sm text-ink" : "text-sm italic text-accent-600"}>
        {value.trim() || "Not yet provided"}
      </dd>
    </div>
  );
}

export default function NdaPreview({ formData }: { formData: NdaFormData }) {
  return (
    <article className="prose prose-sm max-w-none rounded-xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-serif text-xl font-semibold text-brand-900">Mutual Non-Disclosure Agreement</h1>

      <section className="not-prose mb-6 grid grid-cols-1 gap-x-6 gap-y-4 rounded-md bg-brand-50 p-4 sm:grid-cols-2">
        <CoverField label="Party A" value={formData.partyAName} />
        <CoverField label="Party B" value={formData.partyBName} />
        <CoverField label="Party A Address" value={formData.partyAAddress} />
        <CoverField label="Party B Address" value={formData.partyBAddress} />
        <CoverField label="Effective Date" value={formData.effectiveDate} />
        <CoverField label="Purpose" value={formData.purpose} />
      </section>

      <ol className="space-y-4">
        {NDA_CLAUSES.map((clause) => (
          <li key={clause.title}>
            <span className="font-semibold text-brand-900">{clause.title}. </span>
            <span className="text-ink/90">
              <RichText text={clause.body} formData={formData} />
            </span>
          </li>
        ))}
      </ol>

      <section className="not-prose mt-8 grid grid-cols-1 gap-6 border-t border-brand-100 pt-6 sm:grid-cols-2">
        {[
          { label: "Party A", name: formData.partyASignerName, title: formData.partyASignerTitle },
          { label: "Party B", name: formData.partyBSignerName, title: formData.partyBSignerTitle },
        ].map((signer) => (
          <div key={signer.label}>
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">{signer.label} Signature</p>
            <div className="mt-4 border-b border-brand-200 pb-1 text-sm text-ink">
              {signer.name.trim() || " "}
            </div>
            <p className="mt-1 text-xs text-ink/50">
              {signer.name.trim() || "Name"} {signer.title.trim() && `— ${signer.title}`}
            </p>
          </div>
        ))}
      </section>

      <p className="mt-8 text-xs text-ink/40">{NDA_ATTRIBUTION}</p>
    </article>
  );
}
