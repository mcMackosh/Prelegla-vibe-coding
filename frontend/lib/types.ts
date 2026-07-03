export type NdaFormData = {
  partyAName: string;
  partyAAddress: string;
  partyASignerName: string;
  partyASignerTitle: string;
  partyBName: string;
  partyBAddress: string;
  partyBSignerName: string;
  partyBSignerTitle: string;
  effectiveDate: string;
  purpose: string;
  mndaTerm: string;
  termOfConfidentiality: string;
  governingLaw: string;
  jurisdiction: string;
};

export const FIELD_LABELS: Record<keyof NdaFormData, string> = {
  partyAName: "Party A Name",
  partyAAddress: "Party A Address",
  partyASignerName: "Party A Signer Name",
  partyASignerTitle: "Party A Signer Title",
  partyBName: "Party B Name",
  partyBAddress: "Party B Address",
  partyBSignerName: "Party B Signer Name",
  partyBSignerTitle: "Party B Signer Title",
  effectiveDate: "Effective Date",
  purpose: "Purpose",
  mndaTerm: "MNDA Term",
  termOfConfidentiality: "Term of Confidentiality",
  governingLaw: "Governing Law (State)",
  jurisdiction: "Jurisdiction (Courts)",
};

export const EMPTY_FORM_DATA: NdaFormData = {
  partyAName: "",
  partyAAddress: "",
  partyASignerName: "",
  partyASignerTitle: "",
  partyBName: "",
  partyBAddress: "",
  partyBSignerName: "",
  partyBSignerTitle: "",
  effectiveDate: "",
  purpose: "",
  mndaTerm: "",
  termOfConfidentiality: "",
  governingLaw: "",
  jurisdiction: "",
};

/** Coverpage placeholder tokens that appear inline within the standard terms clauses. */
export type CoverPageToken =
  | "purpose"
  | "effectiveDate"
  | "mndaTerm"
  | "termOfConfidentiality"
  | "governingLaw"
  | "jurisdiction";

export const TOKEN_TO_FIELD: Record<CoverPageToken, keyof NdaFormData> = {
  purpose: "purpose",
  effectiveDate: "effectiveDate",
  mndaTerm: "mndaTerm",
  termOfConfidentiality: "termOfConfidentiality",
  governingLaw: "governingLaw",
  jurisdiction: "jurisdiction",
};
