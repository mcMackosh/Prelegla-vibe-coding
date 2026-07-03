import { NdaFormData } from "./types";

const INVALID_FILENAME_CHARS = /[\\/:*?"<>|]/g;

/** Strips OS-invalid filename characters and collapses whitespace to hyphens. */
export function sanitizeFileNameSegment(value: string, fallback: string): string {
  const cleaned = value.trim().replace(INVALID_FILENAME_CHARS, "").trim().replace(/\s+/g, "-");
  return cleaned || fallback;
}

export function buildNdaFileName(formData: Pick<NdaFormData, "partyAName" | "partyBName">): string {
  const partyA = sanitizeFileNameSegment(formData.partyAName, "PartyA");
  const partyB = sanitizeFileNameSegment(formData.partyBName, "PartyB");
  return `Mutual-NDA-${partyA}-${partyB}.pdf`;
}
