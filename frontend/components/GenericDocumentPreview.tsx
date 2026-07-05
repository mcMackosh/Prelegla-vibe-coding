import { Clause, Segment } from "@/lib/templates";

type FormData = Record<string, string>;

function fieldDisplay(segment: Extract<Segment, { type: "field" }>, formData: FormData) {
  const raw = formData[segment.key]?.trim();
  if (!raw) {
    return { text: `[${segment.label}]`, empty: true };
  }
  return { text: segment.possessive ? `${raw}'s` : raw, empty: false };
}

function RichText({ segments, formData }: { segments: Segment[]; formData: FormData }) {
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "bold") {
          return <strong key={i}>{segment.content}</strong>;
        }
        if (segment.type === "link") {
          return (
            <a key={i} href={segment.url} target="_blank" rel="noreferrer" className="underline">
              {segment.text}
            </a>
          );
        }
        if (segment.type === "field") {
          const { text, empty } = fieldDisplay(segment, formData);
          return (
            <span
              key={i}
              className={
                empty
                  ? "rounded bg-accent-100 px-1 text-accent-600"
                  : "rounded bg-brand-50 px-1 font-medium text-brand-700"
              }
            >
              {text}
            </span>
          );
        }
        return <span key={i}>{segment.content}</span>;
      })}
    </>
  );
}

const LIST_STYLE_BY_DEPTH = ["decimal", "lower-alpha", "lower-roman", "decimal"];

function ClauseView({ clause, depth, formData }: { clause: Clause; depth: number; formData: FormData }) {
  return (
    <li>
      {clause.title && <span className="font-semibold text-brand-900">{clause.title}. </span>}
      {clause.body.length > 0 && (
        <span className="text-ink/90">
          <RichText segments={clause.body} formData={formData} />
        </span>
      )}
      {clause.children.length > 0 && (
        <ol
          className="mt-2 space-y-2 pl-6"
          style={{ listStyleType: LIST_STYLE_BY_DEPTH[depth % LIST_STYLE_BY_DEPTH.length] }}
        >
          {clause.children.map((child, i) => (
            <ClauseView key={i} clause={child} depth={depth + 1} formData={formData} />
          ))}
        </ol>
      )}
    </li>
  );
}

export default function GenericDocumentPreview({
  title,
  clauses,
  attribution,
  formData,
}: {
  title: string;
  clauses: Clause[];
  attribution: Segment[];
  formData: FormData;
}) {
  return (
    <article className="prose prose-sm max-w-none rounded-xl border border-brand-100 bg-white p-6 shadow-sm sm:p-8">
      <h1 className="font-serif text-xl font-semibold text-brand-900">{title}</h1>

      <ol className="space-y-4" style={{ listStyleType: "decimal" }}>
        {clauses.map((clause, i) => (
          <ClauseView key={i} clause={clause} depth={1} formData={formData} />
        ))}
      </ol>

      {attribution.length > 0 && (
        <p className="mt-8 text-xs text-ink/40">
          <RichText segments={attribution} formData={formData} />
        </p>
      )}
    </article>
  );
}
