import { describe, expect, it } from "vitest";
import { parseSegments } from "@/lib/richText";
import { EMPTY_FORM_DATA, NdaFormData } from "@/lib/types";

function withData(overrides: Partial<NdaFormData>): NdaFormData {
  return { ...EMPTY_FORM_DATA, ...overrides };
}

describe("parseSegments", () => {
  it("returns a single text segment for plain text with no markup", () => {
    const segments = parseSegments("just plain text", EMPTY_FORM_DATA);
    expect(segments).toEqual([{ type: "text", content: "just plain text" }]);
  });

  it("returns an empty array for an empty string", () => {
    expect(parseSegments("", EMPTY_FORM_DATA)).toEqual([]);
  });

  it("parses a bold segment", () => {
    const segments = parseSegments('the **"MNDA"** term', EMPTY_FORM_DATA);
    expect(segments).toEqual([
      { type: "text", content: "the " },
      { type: "bold", content: '"MNDA"' },
      { type: "text", content: " term" },
    ]);
  });

  it("resolves a filled field token to its trimmed value", () => {
    const data = withData({ governingLaw: "  Delaware  " });
    const segments = parseSegments("State of {{governingLaw}}.", data);
    expect(segments).toEqual([
      { type: "text", content: "State of " },
      { type: "field", content: "Delaware", empty: false, fieldKey: "governingLaw" },
      { type: "text", content: "." },
    ]);
  });

  it("treats a missing field value as empty and shows a bracketed placeholder", () => {
    const segments = parseSegments("for the {{purpose}}", EMPTY_FORM_DATA);
    expect(segments).toEqual([
      { type: "text", content: "for the " },
      { type: "field", content: "[purpose]", empty: true, fieldKey: "purpose" },
    ]);
  });

  it("treats a whitespace-only field value as empty", () => {
    const data = withData({ purpose: "   " });
    const segments = parseSegments("{{purpose}}", data);
    expect(segments).toEqual([
      { type: "field", content: "[purpose]", empty: true, fieldKey: "purpose" },
    ]);
  });

  it("resolves an unmapped token name to an empty placeholder instead of crashing", () => {
    const segments = parseSegments("{{notARealToken}}", EMPTY_FORM_DATA);
    expect(segments).toEqual([{ type: "field", content: "[notARealToken]", empty: true }]);
  });

  it("handles two adjacent tokens with no separating text", () => {
    const data = withData({ effectiveDate: "2026-07-03", mndaTerm: "one year" });
    const segments = parseSegments("{{effectiveDate}}{{mndaTerm}}", data);
    expect(segments).toEqual([
      { type: "field", content: "2026-07-03", empty: false, fieldKey: "effectiveDate" },
      { type: "field", content: "one year", empty: false, fieldKey: "mndaTerm" },
    ]);
  });

  it("leaves unmatched/unterminated ** markers as literal text", () => {
    const segments = parseSegments("this **never closes", EMPTY_FORM_DATA);
    expect(segments).toEqual([{ type: "text", content: "this **never closes" }]);
  });

  it("passes special characters in field values through unescaped as plain text content", () => {
    const data = withData({ purpose: '<script>alert("x")</script> & "quotes"' });
    const segments = parseSegments("{{purpose}}", data);
    expect(segments).toEqual([
      {
        type: "field",
        content: '<script>alert("x")</script> & "quotes"',
        empty: false,
        fieldKey: "purpose",
      },
    ]);
  });

  it("parses a realistic mixed clause with bold and multiple field tokens in order", () => {
    const data = withData({ effectiveDate: "2026-07-03", mndaTerm: "one (1) year" });
    const text =
      "This **MNDA** commences on the {{effectiveDate}} and expires at the end of the {{mndaTerm}}.";
    const segments = parseSegments(text, data);
    expect(segments).toEqual([
      { type: "text", content: "This " },
      { type: "bold", content: "MNDA" },
      { type: "text", content: " commences on the " },
      { type: "field", content: "2026-07-03", empty: false, fieldKey: "effectiveDate" },
      { type: "text", content: " and expires at the end of the " },
      { type: "field", content: "one (1) year", empty: false, fieldKey: "mndaTerm" },
      { type: "text", content: "." },
    ]);
  });
});
