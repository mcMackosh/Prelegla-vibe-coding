import { describe, expect, it } from "vitest";
import { EMPTY_FORM_DATA, FIELD_LABELS, TOKEN_TO_FIELD } from "@/lib/types";

describe("EMPTY_FORM_DATA", () => {
  it("initializes every field to an empty string", () => {
    for (const value of Object.values(EMPTY_FORM_DATA)) {
      expect(value).toBe("");
    }
  });

  it("has a label for every form field", () => {
    const formKeys = Object.keys(EMPTY_FORM_DATA).sort();
    const labelKeys = Object.keys(FIELD_LABELS).sort();
    expect(labelKeys).toEqual(formKeys);
  });
});

describe("TOKEN_TO_FIELD", () => {
  it("maps every coverpage token to a real key on NdaFormData", () => {
    const formKeys = new Set(Object.keys(EMPTY_FORM_DATA));
    for (const fieldKey of Object.values(TOKEN_TO_FIELD)) {
      expect(formKeys.has(fieldKey)).toBe(true);
    }
  });
});
