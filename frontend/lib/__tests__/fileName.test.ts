import { describe, expect, it } from "vitest";
import { buildNdaFileName, sanitizeFileNameSegment } from "@/lib/fileName";

describe("sanitizeFileNameSegment", () => {
  it("returns the value unchanged when it is already filename-safe", () => {
    expect(sanitizeFileNameSegment("Acme", "fallback")).toBe("Acme");
  });

  it("collapses internal whitespace to hyphens", () => {
    expect(sanitizeFileNameSegment("Acme Corp International", "fallback")).toBe(
      "Acme-Corp-International"
    );
  });

  it("strips OS-invalid filename characters", () => {
    expect(sanitizeFileNameSegment('Smith & Co. / "Holdings"', "fallback")).toBe(
      "Smith-&-Co.-Holdings"
    );
  });

  it.each([
    ["back/slash", "back", "slash"],
    ["back\\slash", "back", "slash"],
    ["colon:name", "colon", "name"],
  ])("strips path separators from %s", (input) => {
    expect(sanitizeFileNameSegment(input, "fallback")).not.toMatch(/[\\/:]/);
  });

  it("falls back when the value is empty", () => {
    expect(sanitizeFileNameSegment("", "PartyA")).toBe("PartyA");
  });

  it("falls back when the value is only whitespace", () => {
    expect(sanitizeFileNameSegment("   ", "PartyA")).toBe("PartyA");
  });

  it("falls back when the value consists entirely of invalid characters", () => {
    expect(sanitizeFileNameSegment("///???", "PartyA")).toBe("PartyA");
  });
});

describe("buildNdaFileName", () => {
  it("builds a filename from both party names", () => {
    expect(buildNdaFileName({ partyAName: "Acme Corp.", partyBName: "Globex Inc." })).toBe(
      "Mutual-NDA-Acme-Corp.-Globex-Inc..pdf"
    );
  });

  it("uses placeholder names when both parties are blank", () => {
    expect(buildNdaFileName({ partyAName: "", partyBName: "" })).toBe(
      "Mutual-NDA-PartyA-PartyB.pdf"
    );
  });

  it("produces a filename with no path-separator characters even for adversarial input", () => {
    const fileName = buildNdaFileName({
      partyAName: "../../etc/passwd",
      partyBName: "C:\\Windows\\System32",
    });
    expect(fileName).not.toMatch(/[\\/:]/);
    expect(fileName.endsWith(".pdf")).toBe(true);
  });
});
