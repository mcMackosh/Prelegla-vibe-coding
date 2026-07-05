import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import GenericDocumentPreview from "@/components/GenericDocumentPreview";
import { Clause, Segment } from "@/lib/templates";

describe("GenericDocumentPreview", () => {
  it("renders a clause title and body text", () => {
    const clauses: Clause[] = [
      {
        title: "Services",
        body: [{ type: "text", content: "Provider will perform the services." }],
        children: [],
      },
    ];
    render(<GenericDocumentPreview title="Test Agreement" clauses={clauses} attribution={[]} formData={{}} />);

    expect(screen.getByText("Test Agreement")).toBeInTheDocument();
    expect(screen.getByText("Services.")).toBeInTheDocument();
    expect(screen.getByText("Provider will perform the services.")).toBeInTheDocument();
  });

  it("shows a bracketed placeholder for an unfilled field", () => {
    const clauses: Clause[] = [
      {
        body: [
          { type: "text", content: "The customer is " },
          { type: "field", key: "customer", label: "Customer", possessive: false },
          { type: "text", content: "." },
        ],
        children: [],
      },
    ];
    render(<GenericDocumentPreview title="Test" clauses={clauses} attribution={[]} formData={{}} />);

    expect(screen.getByText("[Customer]")).toBeInTheDocument();
  });

  it("renders the filled value once the field has data", () => {
    const clauses: Clause[] = [
      {
        body: [{ type: "field", key: "customer", label: "Customer", possessive: false }],
        children: [],
      },
    ];
    render(
      <GenericDocumentPreview
        title="Test"
        clauses={clauses}
        attribution={[]}
        formData={{ customer: "Acme Corp." }}
      />
    );

    expect(screen.getByText("Acme Corp.")).toBeInTheDocument();
  });

  it("appends 's for a possessive field", () => {
    const clauses: Clause[] = [
      {
        body: [{ type: "field", key: "customer", label: "Customer", possessive: true }],
        children: [],
      },
    ];
    render(
      <GenericDocumentPreview
        title="Test"
        clauses={clauses}
        attribution={[]}
        formData={{ customer: "Acme Corp." }}
      />
    );

    expect(screen.getByText("Acme Corp.'s")).toBeInTheDocument();
  });

  it("renders nested child clauses inside their parent", () => {
    const clauses: Clause[] = [
      {
        title: "Payment",
        body: [],
        children: [
          { title: "Fees", body: [{ type: "text", content: "Fees are due monthly." }], children: [] },
        ],
      },
    ];
    render(<GenericDocumentPreview title="Test" clauses={clauses} attribution={[]} formData={{}} />);

    expect(screen.getByText("Payment.")).toBeInTheDocument();
    expect(screen.getByText("Fees.")).toBeInTheDocument();
    expect(screen.getByText("Fees are due monthly.")).toBeInTheDocument();
  });

  it("renders bold and link segments", () => {
    const attribution: Segment[] = [
      { type: "text", content: "See the " },
      { type: "link", text: "standard terms", url: "https://example.com" },
      { type: "text", content: "." },
    ];
    const clauses: Clause[] = [
      { body: [{ type: "bold", content: "IMPORTANT" }], children: [] },
    ];
    render(<GenericDocumentPreview title="Test" clauses={clauses} attribution={attribution} formData={{}} />);

    expect(screen.getByText("IMPORTANT").tagName).toBe("STRONG");
    const link = screen.getByRole("link", { name: "standard terms" });
    expect(link).toHaveAttribute("href", "https://example.com");
  });
});
