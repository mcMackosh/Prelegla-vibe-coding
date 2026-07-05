import { CoverPageToken, NdaFormData, TOKEN_TO_FIELD } from "./types";

export type Segment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "field"; content: string; empty: boolean };

const SEGMENT_PATTERN = /\*\*(.+?)\*\*|\{\{(\w+)\}\}/g;

/** Splits clause text into plain/bold/field segments, resolving `{{token}}` against form data. */
export function parseSegments(text: string, formData: NdaFormData): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  SEGMENT_PATTERN.lastIndex = 0;
  while ((match = SEGMENT_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    const [, boldContent, token] = match;
    if (boldContent !== undefined) {
      segments.push({ type: "bold", content: boldContent });
    } else if (token !== undefined) {
      const fieldKey = TOKEN_TO_FIELD[token as CoverPageToken];
      const value = fieldKey ? formData[fieldKey] : "";
      segments.push({
        type: "field",
        content: value.trim() || `[${token}]`,
        empty: !value.trim(),
      });
    }

    lastIndex = SEGMENT_PATTERN.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}
