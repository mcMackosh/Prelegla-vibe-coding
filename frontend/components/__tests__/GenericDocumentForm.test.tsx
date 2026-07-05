import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import GenericDocumentForm from "@/components/GenericDocumentForm";

describe("GenericDocumentForm", () => {
  it("renders one labeled input per field", () => {
    render(
      <GenericDocumentForm
        fields={[
          { key: "customer", label: "Customer" },
          { key: "provider", label: "Provider" },
        ]}
        formData={{}}
        onFieldChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Customer")).toBeInTheDocument();
    expect(screen.getByLabelText("Provider")).toBeInTheDocument();
  });

  it("shows the current value for a filled field", () => {
    render(
      <GenericDocumentForm
        fields={[{ key: "customer", label: "Customer" }]}
        formData={{ customer: "Acme Corp." }}
        onFieldChange={vi.fn()}
      />
    );

    expect(screen.getByLabelText("Customer")).toHaveValue("Acme Corp.");
  });

  it("calls onFieldChange with the field key when edited", () => {
    const onFieldChange = vi.fn();
    render(
      <GenericDocumentForm
        fields={[{ key: "customer", label: "Customer" }]}
        formData={{}}
        onFieldChange={onFieldChange}
      />
    );

    fireEvent.change(screen.getByLabelText("Customer"), { target: { value: "Acme Corp." } });

    expect(onFieldChange).toHaveBeenCalledWith("customer", "Acme Corp.");
  });
});
