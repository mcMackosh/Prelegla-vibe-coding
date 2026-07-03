import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import NdaForm from "@/components/NdaForm";
import { EMPTY_FORM_DATA } from "@/lib/types";

describe("NdaForm", () => {
  it("renders every cover-page field label", () => {
    render(<NdaForm formData={EMPTY_FORM_DATA} onFieldChange={vi.fn()} />);

    for (const label of [
      "Legal Name",
      "Address",
      "Signer Name",
      "Signer Title",
      "Effective Date",
      "Purpose",
      "MNDA Term",
      "Term of Confidentiality",
      "Governing Law (State)",
      "Jurisdiction (Courts)",
    ]) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
  });

  it("calls onFieldChange with the field key and new value when a text input changes", async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<NdaForm formData={EMPTY_FORM_DATA} onFieldChange={onFieldChange} />);

    const [partyAName] = screen.getAllByPlaceholderText("Acme Corp.");
    await user.type(partyAName, "X");

    expect(onFieldChange).toHaveBeenCalledWith("partyAName", "X");
  });

  it("calls onFieldChange for the multiline purpose textarea", async () => {
    const user = userEvent.setup();
    const onFieldChange = vi.fn();
    render(<NdaForm formData={EMPTY_FORM_DATA} onFieldChange={onFieldChange} />);

    const purpose = screen.getByPlaceholderText(
      "evaluating a potential business relationship between the parties"
    );
    await user.type(purpose, "Y");

    expect(onFieldChange).toHaveBeenCalledWith("purpose", "Y");
  });

  it("reflects the current formData value in each input", () => {
    const formData = { ...EMPTY_FORM_DATA, partyAName: "Acme Corp." };
    render(<NdaForm formData={formData} onFieldChange={vi.fn()} />);

    expect(screen.getByDisplayValue("Acme Corp.")).toBeInTheDocument();
  });
});
