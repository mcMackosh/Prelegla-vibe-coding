import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import NdaDownloadButton from "@/components/NdaDownloadButton";
import { EMPTY_FORM_DATA } from "@/lib/types";

describe("NdaDownloadButton", () => {
  it("renders a loading state and then a ready-to-download link with a safe filename", async () => {
    const formData = { ...EMPTY_FORM_DATA, partyAName: "Acme Corp.", partyBName: "Globex Inc." };
    render(<NdaDownloadButton formData={formData} />);

    await waitFor(() => expect(screen.getByText("Download PDF")).toBeInTheDocument(), {
      timeout: 10000,
    });

    const link = screen.getByText("Download PDF").closest("a");
    expect(link).toHaveAttribute("download", "Mutual-NDA-Acme-Corp.-Globex-Inc..pdf");
    expect(link?.getAttribute("href")).toMatch(/^blob:/);
  });

  it("still renders a downloadable PDF when party names contain OS-invalid filename characters", async () => {
    const formData = {
      ...EMPTY_FORM_DATA,
      partyAName: "Smith & Co. / Holdings",
      partyBName: "",
    };
    render(<NdaDownloadButton formData={formData} />);

    await waitFor(() => expect(screen.getByText("Download PDF")).toBeInTheDocument(), {
      timeout: 10000,
    });

    const link = screen.getByText("Download PDF").closest("a");
    const download = link?.getAttribute("download") ?? "";
    expect(download).not.toMatch(/[\\/:*?"<>|]/);
    expect(download.endsWith(".pdf")).toBe(true);
  });
}, 15000);
