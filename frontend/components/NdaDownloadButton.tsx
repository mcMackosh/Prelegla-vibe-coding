"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import NdaPdfDocument from "@/components/NdaPdfDocument";
import { NdaFormData } from "@/lib/types";

export default function NdaDownloadButton({ formData }: { formData: NdaFormData }) {
  const fileName = `Mutual-NDA-${formData.partyAName || "PartyA"}-${formData.partyBName || "PartyB"}.pdf`.replace(
    /\s+/g,
    "-"
  );

  return (
    <PDFDownloadLink
      document={<NdaPdfDocument formData={formData} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
