/**
 * Mirrors frontend/lib/types.ts's NdaFormData + FIELD_LABELS. Duplicated rather than
 * shared because the frontend and backend are separate npm packages with no shared
 * package today — acceptable for a single-document-type chat (see KAN-4 design notes).
 */
export const NDA_FIELDS: { key: string; description: string }[] = [
  { key: 'partyAName', description: 'Legal name of Party A' },
  { key: 'partyAAddress', description: 'Mailing address of Party A' },
  { key: 'partyASignerName', description: "Name of the person signing for Party A" },
  { key: 'partyASignerTitle', description: "Title of the person signing for Party A" },
  { key: 'partyBName', description: 'Legal name of Party B' },
  { key: 'partyBAddress', description: 'Mailing address of Party B' },
  { key: 'partyBSignerName', description: "Name of the person signing for Party B" },
  { key: 'partyBSignerTitle', description: "Title of the person signing for Party B" },
  { key: 'effectiveDate', description: 'Effective date of the agreement' },
  { key: 'purpose', description: 'Purpose of the disclosure, e.g. "evaluating a potential business relationship"' },
  { key: 'mndaTerm', description: 'How long the agreement itself lasts, e.g. "one (1) year from the Effective Date"' },
  { key: 'termOfConfidentiality', description: 'How long confidentiality obligations survive after expiration/termination' },
  { key: 'governingLaw', description: 'US state whose law governs the agreement' },
  { key: 'jurisdiction', description: 'Courts/venue for disputes, e.g. a city and state' },
];

export type NdaChatFields = Partial<Record<(typeof NDA_FIELDS)[number]['key'], string>>;
