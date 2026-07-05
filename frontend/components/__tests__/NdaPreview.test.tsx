import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import NdaPreview from "@/components/NdaPreview";
import { NDA_CLAUSES } from "@/lib/ndaClauses";
import { EMPTY_FORM_DATA } from "@/lib/types";

describe("NdaPreview", () => {
  it("shows 'Not yet provided' placeholders for every cover-page field when the form is empty", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={vi.fn()} />);
    expect(screen.getAllByPlaceholderText("Not yet provided").length).toBe(6);
  });

  it("renders every clause title and body", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={vi.fn()} />);
    for (const clause of NDA_CLAUSES) {
      expect(screen.getByText(`${clause.title}.`)).toBeInTheDocument();
    }
  });

  it("shows the actual value in the cover-page field once it is filled", () => {
    const formData = { ...EMPTY_FORM_DATA, partyAName: "Acme Corp." };
    render(<NdaPreview formData={formData} onFieldChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Acme Corp.")).toBeInTheDocument();
  });

  it("renders special characters in a filled field as a plain input value without breaking the page", () => {
    const formData = { ...EMPTY_FORM_DATA, purpose: '<script>alert("x")</script>' };
    render(<NdaPreview formData={formData} onFieldChange={vi.fn()} />);

    expect(screen.getByDisplayValue('<script>alert("x")</script>')).toBeInTheDocument();
    expect(document.querySelector("script")).not.toBeInTheDocument();
  });

  it("calls onFieldChange when a cover-page field is edited", () => {
    const onFieldChange = vi.fn();
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={onFieldChange} />);

    fireEvent.change(screen.getByLabelText("Party A"), { target: { value: "Acme Corp." } });

    expect(onFieldChange).toHaveBeenCalledWith("partyAName", "Acme Corp.");
  });

  it("calls onFieldChange when a signer field is edited", () => {
    const onFieldChange = vi.fn();
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={onFieldChange} />);

    const [firstNameInput] = screen.getAllByPlaceholderText("Signer name");
    fireEvent.change(firstNameInput, { target: { value: "Jane Doe" } });

    expect(onFieldChange).toHaveBeenCalledWith("partyASignerName", "Jane Doe");
  });

  it("calls onFieldChange when an inline clause field is blurred after editing", () => {
    const onFieldChange = vi.fn();
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={onFieldChange} />);

    const editable = screen.getByRole("textbox", { name: "mndaTerm" });
    editable.textContent = "one (1) year";
    fireEvent.blur(editable);

    expect(onFieldChange).toHaveBeenCalledWith("mndaTerm", "one (1) year");
  });

  it("shows signer name/title inputs for both parties", () => {
    const formData = {
      ...EMPTY_FORM_DATA,
      partyASignerName: "Jane Doe",
      partyASignerTitle: "CEO",
      partyBSignerName: "John Smith",
      partyBSignerTitle: "COO",
    };
    render(<NdaPreview formData={formData} onFieldChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Jane Doe")).toBeInTheDocument();
    expect(screen.getByDisplayValue("CEO")).toBeInTheDocument();
    expect(screen.getByDisplayValue("John Smith")).toBeInTheDocument();
    expect(screen.getByDisplayValue("COO")).toBeInTheDocument();
  });

  it("falls back to placeholder signer labels when signer names are blank", () => {
    render(<NdaPreview formData={EMPTY_FORM_DATA} onFieldChange={vi.fn()} />);
    expect(screen.getAllByPlaceholderText("Signer name").length).toBe(2);
    expect(screen.getAllByPlaceholderText("Signer title").length).toBe(2);
  });
});
