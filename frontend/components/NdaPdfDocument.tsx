import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { NDA_ATTRIBUTION, NDA_CLAUSES } from "@/lib/ndaClauses";
import { parseSegments, Segment } from "@/lib/richText";
import { NdaFormData } from "@/lib/types";

const styles = StyleSheet.create({
  page: { paddingVertical: 48, paddingHorizontal: 56, fontSize: 10, fontFamily: "Helvetica", color: "#1f2937" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 16, textAlign: "center" },
  coverBox: { flexDirection: "row", flexWrap: "wrap", marginBottom: 20, borderWidth: 1, borderColor: "#e5e7eb", padding: 12 },
  coverField: { width: "50%", marginBottom: 8, paddingRight: 8 },
  coverLabel: { fontSize: 7, textTransform: "uppercase", color: "#6b7280", marginBottom: 2 },
  coverValue: { fontSize: 9 },
  clause: { marginBottom: 10, lineHeight: 1.5 },
  clauseTitle: { fontFamily: "Helvetica-Bold" },
  bold: { fontFamily: "Helvetica-Bold" },
  field: { fontFamily: "Helvetica-Bold", textDecoration: "underline" },
  signRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 28, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#e5e7eb" },
  signBlock: { width: "45%" },
  signLine: { borderBottomWidth: 1, borderBottomColor: "#374151", marginBottom: 4, marginTop: 24, height: 1 },
  signLabel: { fontSize: 7, textTransform: "uppercase", color: "#6b7280" },
  signName: { fontSize: 9 },
  attribution: { marginTop: 24, fontSize: 7, color: "#9ca3af" },
});

function coverValue(value: string) {
  return value.trim() || "Not yet provided";
}

export default function NdaPdfDocument({ formData }: { formData: NdaFormData }) {
  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>

        <View style={styles.coverBox}>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Party A</Text>
            <Text style={styles.coverValue}>{coverValue(formData.partyAName)}</Text>
          </View>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Party B</Text>
            <Text style={styles.coverValue}>{coverValue(formData.partyBName)}</Text>
          </View>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Party A Address</Text>
            <Text style={styles.coverValue}>{coverValue(formData.partyAAddress)}</Text>
          </View>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Party B Address</Text>
            <Text style={styles.coverValue}>{coverValue(formData.partyBAddress)}</Text>
          </View>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Effective Date</Text>
            <Text style={styles.coverValue}>{coverValue(formData.effectiveDate)}</Text>
          </View>
          <View style={styles.coverField}>
            <Text style={styles.coverLabel}>Purpose</Text>
            <Text style={styles.coverValue}>{coverValue(formData.purpose)}</Text>
          </View>
        </View>

        {NDA_CLAUSES.map((clause, index) => (
          <View key={clause.title} wrap={false}>
            <Text style={styles.clause}>
              <Text style={styles.clauseTitle}>
                {index + 1}. {clause.title}.{" "}
              </Text>
              <RichPdfInline text={clause.body} formData={formData} />
            </Text>
          </View>
        ))}

        <View style={styles.signRow}>
          <View style={styles.signBlock}>
            <Text style={styles.signLabel}>Party A Signature</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>
              {coverValue(formData.partyASignerName)}
              {formData.partyASignerTitle.trim() ? `, ${formData.partyASignerTitle}` : ""}
            </Text>
          </View>
          <View style={styles.signBlock}>
            <Text style={styles.signLabel}>Party B Signature</Text>
            <View style={styles.signLine} />
            <Text style={styles.signName}>
              {coverValue(formData.partyBSignerName)}
              {formData.partyBSignerTitle.trim() ? `, ${formData.partyBSignerTitle}` : ""}
            </Text>
          </View>
        </View>

        <Text style={styles.attribution}>{NDA_ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}

function RichPdfInline({ text, formData }: { text: string; formData: NdaFormData }) {
  const segments = parseSegments(text, formData);
  return (
    <>
      {segments.map((segment: Segment, i) => {
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
              {segment.content}
            </Text>
          );
        }
        return <Text key={i}>{segment.content}</Text>;
      })}
    </>
  );
}
