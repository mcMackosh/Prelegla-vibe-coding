/**
 * Generic parser for the Common Paper markdown templates in `templates/`. These 11
 * documents share a numbered-list structure (1-4 levels deep, via 4-space indent) with
 * inline `<span class="X_link">Field Name</span>` markers for fillable variables and
 * `<span class="header_2/3">Title</span>` markers for section/clause titles — but the
 * exact span class names, definitions-list markup, and nesting depth vary per document
 * (see KAN-6 research). This parser is deliberately tolerant rather than strict: unknown
 * or absent markup degrades gracefully (untitled clause, plain text) instead of throwing.
 */

export type Segment =
  | { type: "text"; content: string }
  | { type: "bold"; content: string }
  | { type: "link"; text: string; url: string }
  | { type: "field"; key: string; label: string; possessive: boolean };

export type TemplateField = {
  key: string;
  label: string;
};

export type Clause = {
  title?: string;
  body: Segment[];
  children: Clause[];
};

export type ParsedTemplate = {
  clauses: Clause[];
  fields: TemplateField[];
  attribution: Segment[];
};

/** "Effective Date" -> "effectiveDate". Same text always produces the same key within one template. */
function slugify(text: string): string {
  const words = text
    .replace(/['’]/g, "")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "field";
  return (
    words[0].toLowerCase() +
    words
      .slice(1)
      .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
      .join("")
  );
}

/** "Customer's" and "Customer" should fill the same field; the possessive "'s" is re-added at render time. */
function parseFieldLabel(rawText: string): { key: string; label: string; possessive: boolean } {
  const possessiveMatch = rawText.match(/^(.*)['’]s$/);
  if (possessiveMatch) {
    const base = possessiveMatch[1].trim();
    return { key: slugify(base), label: base, possessive: true };
  }
  const label = rawText.trim();
  return { key: slugify(label), label, possessive: false };
}

const TOKEN_PATTERN =
  /<span([^>]*)>([\s\S]*?)<\/span>|\*\*([\s\S]+?)\*\*|\[([^\]]+)\]\(([^)]+)\)|<(https?:\/\/[^>]+)>/;

function parseInline(text: string, fields: Map<string, TemplateField>): Segment[] {
  const segments: Segment[] = [];
  let remaining = text;

  while (remaining.length > 0) {
    const match = remaining.match(TOKEN_PATTERN);
    if (!match || match.index === undefined) {
      segments.push({ type: "text", content: remaining });
      break;
    }

    if (match.index > 0) {
      segments.push({ type: "text", content: remaining.slice(0, match.index) });
    }

    const [full, spanAttrs, spanInner, boldContent, linkText, linkUrl, autoLinkUrl] = match;

    if (spanAttrs !== undefined) {
      const classMatch = spanAttrs.match(/class="([^"]*)"/);
      const className = classMatch?.[1] ?? "";
      const innerText = spanInner.trim();
      if (className.endsWith("_link") && innerText.length > 0) {
        const { key, label, possessive } = parseFieldLabel(innerText);
        if (!fields.has(key)) fields.set(key, { key, label });
        segments.push({ type: "field", key, label, possessive });
      } else if (innerText.length > 0) {
        segments.push(...parseInline(spanInner, fields));
      }
    } else if (boldContent !== undefined) {
      segments.push({ type: "bold", content: boldContent });
    } else if (linkText !== undefined) {
      segments.push({ type: "link", text: linkText, url: linkUrl });
    } else if (autoLinkUrl !== undefined) {
      segments.push({ type: "link", text: autoLinkUrl, url: autoLinkUrl });
    }

    remaining = remaining.slice(match.index + full.length);
  }

  return segments;
}

const HEADER_SPAN_TITLE = /^\s*<span class="header_[23]">([^<]*)<\/span>\.?\s*/;
const BOLD_TITLE = /^\s*\*\*([\s\S]+?)\*\*\.?\s*/;

function splitTitle(rawText: string): { title?: string; rest: string } {
  const headerMatch = rawText.match(HEADER_SPAN_TITLE);
  if (headerMatch) {
    const title = headerMatch[1].trim().replace(/\.$/, "");
    return { title: title || undefined, rest: rawText.slice(headerMatch[0].length) };
  }
  const boldMatch = rawText.match(BOLD_TITLE);
  if (boldMatch) {
    const title = boldMatch[1].trim().replace(/\.$/, "");
    return { title, rest: rawText.slice(boldMatch[0].length) };
  }
  return { rest: rawText };
}

type MutableClause = { rawText: string; children: MutableClause[] };

// Matches any "<marker>. <rest of line>" list item, at any indent depth. Deliberately
// doesn't distinguish digits/letters/roman numerals — only the indent depth matters here.
const MARKER_LINE = /^(\s*)([a-zA-Z0-9]+)\.\s+(.*)$/;

function parseListLines(lines: string[]): MutableClause[] {
  const roots: MutableClause[] = [];
  const stack: { depth: number; clause: MutableClause }[] = [];

  for (const rawLine of lines) {
    const match = rawLine.match(MARKER_LINE);
    if (match) {
      const indent = match[1].length;
      const depth = Math.round(indent / 4);
      const clause: MutableClause = { rawText: match[3], children: [] };

      while (stack.length && stack[stack.length - 1].depth >= depth) {
        stack.pop();
      }
      if (stack.length === 0) {
        roots.push(clause);
      } else {
        stack[stack.length - 1].clause.children.push(clause);
      }
      stack.push({ depth, clause });
    } else if (rawLine.trim().length > 0 && stack.length > 0) {
      stack[stack.length - 1].clause.rawText += " " + rawLine.trim();
    }
  }

  return roots;
}

function finalizeClause(mutable: MutableClause, fields: Map<string, TemplateField>): Clause {
  const { title, rest } = splitTitle(mutable.rawText);
  return {
    title,
    body: parseInline(rest.trim(), fields),
    children: mutable.children.map((child) => finalizeClause(child, fields)),
  };
}

export function parseTemplate(raw: string): ParsedTemplate {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");

  const firstMarkerIndex = lines.findIndex((line) => MARKER_LINE.test(line));
  let contentLines = firstMarkerIndex === -1 ? [] : lines.slice(firstMarkerIndex);

  // The Common Paper attribution/license line is the trailing non-list paragraph.
  let attributionLine: string | undefined;
  for (let i = contentLines.length - 1; i >= 0; i--) {
    const trimmed = contentLines[i].trim();
    if (!trimmed) continue;
    if (!MARKER_LINE.test(contentLines[i]) && trimmed.includes("Common Paper")) {
      attributionLine = trimmed;
      contentLines = contentLines.slice(0, i);
    }
    break;
  }

  const fields = new Map<string, TemplateField>();
  const clauses = parseListLines(contentLines).map((clause) => finalizeClause(clause, fields));
  const attribution = attributionLine ? parseInline(attributionLine, new Map()) : [];

  return { clauses, fields: Array.from(fields.values()), attribution };
}
