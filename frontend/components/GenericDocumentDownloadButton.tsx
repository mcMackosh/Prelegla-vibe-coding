"use client";

import { PDFDownloadLink } from "@react-pdf/renderer";
import GenericDocumentPdf from "@/components/GenericDocumentPdf";
import { buildDocumentFileName } from "@/lib/fileName";
import { Clause, Segment } from "@/lib/templates";

export default function GenericDocumentDownloadButton({
  title,
  clauses,
  attribution,
  formData,
}: {
  title: string;
  clauses: Clause[];
  attribution: Segment[];
  formData: Record<string, string>;
}) {
  const fileName = buildDocumentFileName(title);

  return (
    <PDFDownloadLink
      document={<GenericDocumentPdf title={title} clauses={clauses} attribution={attribution} formData={formData} />}
      fileName={fileName}
      className="inline-flex items-center justify-center rounded-md bg-accent-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-accent-600"
    >
      {({ loading }) => (loading ? "Preparing PDF…" : "Download PDF")}
    </PDFDownloadLink>
  );
}
