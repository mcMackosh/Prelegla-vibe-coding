import { describe, expect, it } from "vitest";
import { NDA_CLAUSES } from "@/lib/ndaClauses";
import { TOKEN_TO_FIELD } from "@/lib/types";

const TOKEN_PATTERN = /\{\{(\w+)\}\}/g;
const BOLD_MARKER_PATTERN = /\*\*/g;

describe("NDA_CLAUSES", () => {
  it("has a non-empty title and body for every clause", () => {
    expect(NDA_CLAUSES.length).toBeGreaterThan(0);
    for (const clause of NDA_CLAUSES) {
      expect(clause.title.trim().length).toBeGreaterThan(0);
      expect(clause.body.trim().length).toBeGreaterThan(0);
    }
  });

  it("only references coverpage tokens that richText.ts knows how to resolve", () => {
    const knownTokens = new Set(Object.keys(TOKEN_TO_FIELD));
    for (const clause of NDA_CLAUSES) {
      const tokens = [...clause.body.matchAll(TOKEN_PATTERN)].map((match) => match[1]);
      for (const token of tokens) {
        expect(knownTokens.has(token), `clause "${clause.title}" uses unknown token {{${token}}}`).toBe(
          true
        );
      }
    }
  });

  it("has balanced ** bold markers in every clause body", () => {
    for (const clause of NDA_CLAUSES) {
      const markerCount = clause.body.match(BOLD_MARKER_PATTERN)?.length ?? 0;
      expect(markerCount % 2, `clause "${clause.title}" has an unmatched ** marker`).toBe(0);
    }
  });

  it("has unique clause titles", () => {
    const titles = NDA_CLAUSES.map((clause) => clause.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
});
