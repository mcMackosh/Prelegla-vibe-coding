import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { NDA_CLAUSES } from "@/lib/ndaClauses";
import { EMPTY_FORM_DATA } from "@/lib/types";

describe("NdaPreview", () => {
  it("shows 'Not yet provided' for every cover-page field when the form is empty", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} />);
    expect(screen.getAllByText("Not yet provided").length).toBe(6);
  });

  it("renders every clause title and body", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} />);
    for (const clause of NDA_CLAUSES) {
      expect(screen.getByText(`${clause.title}.`)).toBeInTheDocument();
    }
  });

  it("replaces 'Not yet provided' with the actual value once a cover-page field is filled", () => {
    const formData = { ...EMPTY_FORM_DATA, partyAName: "Acme Corp." };
    render(<NdaPreview formData={formData} />);

    expect(screen.getByText("Acme Corp.")).toBeInTheDocument();
    expect(screen.getAllByText("Not yet provided").length).toBe(5);
  });

  it("renders special characters in a filled field as plain text without breaking the page", () => {
    const formData = { ...EMPTY_FORM_DATA, purpose: '<script>alert("x")</script>' };
    render(<NdaPreview formData={formData} />);

    expect(screen.getByText('<script>alert("x")</script>', { selector: "dd" })).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("shows both signer names in the signature block when provided", () => {
    const formData = {
      ...EMPTY_FORM_DATA,
      partyASignerName: "Jane Doe",
      partyASignerTitle: "CEO",
      partyBSignerName: "John Smith",
      partyBSignerTitle: "COO",
    };
    render(<NdaPreview formData={formData} />);

    expect(screen.getByText("Jane Doe — CEO")).toBeInTheDocument();
    expect(screen.getByText("John Smith — COO")).toBeInTheDocument();
  });

  it("falls back to placeholder signature labels when signer names are blank", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} />);
    expect(screen.getAllByText("Name").length).toBe(2);
  });
});
