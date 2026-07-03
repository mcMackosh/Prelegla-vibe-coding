"use client";

import { NdaFormData } from "@/lib/types";

type FieldConfig = {
  key: keyof NdaFormData;
  label: string;
  placeholder: string;
  multiline?: boolean;
  type?: string;
};

const PARTY_A_FIELDS: FieldConfig[] = [
  { key: "partyAName", label: "Legal Name", placeholder: "Acme Corp." },
  { key: "partyAAddress", label: "Address", placeholder: "123 Main St, San Francisco, CA 94105" },
  { key: "partyASignerName", label: "Signer Name", placeholder: "Jane Doe" },
  { key: "partyASignerTitle", label: "Signer Title", placeholder: "CEO" },
];

const PARTY_B_FIELDS: FieldConfig[] = [
  { key: "partyBName", label: "Legal Name", placeholder: "Globex Inc." },
  { key: "partyBAddress", label: "Address", placeholder: "456 Market St, New York, NY 10001" },
  { key: "partyBSignerName", label: "Signer Name", placeholder: "John Smith" },
  { key: "partyBSignerTitle", label: "Signer Title", placeholder: "COO" },
];

const AGREEMENT_FIELDS: FieldConfig[] = [
  { key: "effectiveDate", label: "Effective Date", placeholder: "", type: "date" },
  {
    key: "purpose",
    label: "Purpose",
    placeholder: "evaluating a potential business relationship between the parties",
    multiline: true,
  },
  { key: "mndaTerm", label: "MNDA Term", placeholder: "one (1) year from the Effective Date" },
  {
    key: "termOfConfidentiality",
    label: "Term of Confidentiality",
    placeholder: "three (3) years after expiration or termination of this MNDA",
  },
  { key: "governingLaw", label: "Governing Law (State)", placeholder: "Delaware" },
  { key: "jurisdiction", label: "Jurisdiction (Courts)", placeholder: "Wilmington, Delaware" },
];

function Field({
  config,
  value,
  onChange,
}: {
  config: FieldConfig;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputClasses =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-gray-700">{config.label}</span>
      {config.multiline ? (
        <textarea
          className={inputClasses}
          rows={2}
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className={inputClasses}
          type={config.type ?? "text"}
          placeholder={config.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}

function FieldGroup({
  title,
  fields,
  formData,
  onFieldChange,
}: {
  title: string;
  fields: FieldConfig[];
  formData: NdaFormData;
  onFieldChange: (key: keyof NdaFormData, value: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-base font-semibold text-gray-900">{title}</legend>
      {fields.map((field) => (
        <Field
          key={field.key}
          config={field}
          value={formData[field.key]}
          onChange={(value) => onFieldChange(field.key, value)}
        />
      ))}
    </fieldset>
  );
}

export default function NdaForm({
  formData,
  onFieldChange,
}: {
  formData: NdaFormData;
  onFieldChange: (key: keyof NdaFormData, value: string) => void;
}) {
  return (
    <div className="space-y-8">
      <FieldGroup title="Party A (Disclosing / Receiving Party)" fields={PARTY_A_FIELDS} formData={formData} onFieldChange={onFieldChange} />
      <FieldGroup title="Party B (Disclosing / Receiving Party)" fields={PARTY_B_FIELDS} formData={formData} onFieldChange={onFieldChange} />
      <FieldGroup title="Agreement Terms" fields={AGREEMENT_FIELDS} formData={formData} onFieldChange={onFieldChange} />
    </div>
  );
}
