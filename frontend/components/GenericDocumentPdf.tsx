import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { Clause, Segment } from "@/lib/templates";

type FormData = Record<string, string>;

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 16, textAlign: "center" },
  clause: { marginBottom: 8, lineHeight: 1.5 },
  clauseTitle: { fontFamily: "Helvetica-Bold" },
  bold: { fontFamily: "Helvetica-Bold" },
  field: { fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  attribution: { marginTop: 24, fontSize: 7, color: "#9ca3af" },
});

function fieldDisplay(segment: Extract<Segment, { type: "field" }>, formData: FormData) {
  const raw = formData[segment.key]?.trim();
  if (!raw) return `[${segment.label}]`;
  return segment.possessive ? `${raw}'s` : raw;
}

function RichPdfInline({ segments, formData }: { segments: Segment[]; formData: FormData }) {
  return (
    <>
      {segments.map((segment, i) => {
        if (segment.type === "bold") {
          return (
            <Text key={i} style={styles.bold}>
              {segment.content}
            </Text>
          );
        }
        if (segment.type === "field") {
          return (
            <Text key={i} style={styles.field}>
              {fieldDisplay(segment, formData)}
            </Text>
          );
        }
        if (segment.type === "link") {
          return <Text key={i}>{segment.text}</Text>;
        }
        return <Text key={i}>{segment.content}</Text>;
      })}
    </>
  );
}

function ClausePdf({
  clause,
  formData,
  numberPrefix,
}: {
  clause: Clause;
  formData: FormData;
  numberPrefix: string;
}) {
  return (
    <View wrap={false}>
      <Text style={styles.clause}>
        {clause.title && (
          <Text style={styles.clauseTitle}>
            {numberPrefix} {clause.title}.{" "}
          </Text>
        )}
        <RichPdfInline segments={clause.body} formData={formData} />
      </Text>
      {clause.children.map((child, i) => (
        <View key={i} style={{ marginLeft: 16 }}>
          <ClausePdf clause={child} formData={formData} numberPrefix={`${numberPrefix}${i + 1}.`} />
        </View>
      ))}
    </View>
  );
}

export default function GenericDocumentPdf({
  title,
  clauses,
  attribution,
  formData,
}: {
  title: string;
  clauses: Clause[];
  attribution: Segment[];
  formData: FormData;
}) {
  return (
    <Document title={title}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{title}</Text>

        {clauses.map((clause, i) => (
          <ClausePdf key={i} clause={clause} formData={formData} numberPrefix={`${i + 1}.`} />
        ))}

        {attribution.length > 0 && (
          <Text style={styles.attribution}>
            <RichPdfInline segments={attribution} formData={formData} />
          </Text>
        )}
      </Page>
    </Document>
  );
}
