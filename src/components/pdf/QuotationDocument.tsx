import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { format } from "date-fns";
import { registerFonts } from "./registerFonts";

registerFonts();



const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Noto Sans JP",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
    textDecoration: "underline",
  },
  invoiceInfo: {
    position: "absolute",
    top: 40,
    left: 40,
  },
  dateInfo: {
    position: "absolute",
    top: 40,
    right: 40,
    textAlign: "right",
  },
  clientSection: {
    marginTop: 60,
    marginBottom: 40,
    width: "50%",
    borderBottomWidth: 1,
    paddingBottom: 5,
  },
  companySection: {
    position: "absolute",
    top: 100,
    right: 40,
    textAlign: "right",
    width: "40%",
  },
  stamp: {
    position: "absolute",
    top: -10,
    right: -10,
    width: 60,
    height: 60,
    opacity: 0.5,
  },
  amountBox: {
    marginTop: 20,
    marginBottom: 20,
    padding: 10,
    borderWidth: 1,
    width: "60%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  table: {
    display: "flex",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginTop: 10,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
    fontWeight: "bold",
  },
  tableCol: {
    padding: 5,
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  col1: { width: "15%" },
  col2: { width: "40%" },
  col3: { width: "10%" },
  col4: { width: "15%" },
  col5: { width: "20%" },
  // SES columns
  sesCol1: { width: "15%" },
  sesCol2: { width: "22%" },
  sesCol3: { width: "28%" },
  sesCol4: { width: "10%" },
  sesCol5: { width: "12%" },
  sesCol6: { width: "13%" },
  summary: {
    marginTop: 20,
    width: "30%",
    alignSelf: "flex-end",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  notes: {
    marginTop: 40,
  },
  adjustmentText: {
    fontSize: 8,
    color: "#666",
    marginTop: 2,
  },
});

const safeFormatDate = (dateStr: any) => {
  try {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return format(date, "yyyy年MM月dd日");
  } catch (e) {
    return "";
  }
};

const safeFormatNumber = (num: any) => {
  const n = Number(num);
  if (isNaN(n)) return "0";
  return new Intl.NumberFormat("ja-JP").format(n);
};

export const QuotationDocument = ({ quotation, company }: any) => {
  const subtotal = (quotation.items || []).reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

  return (
    <Document title={`見積書_${quotation.quotationNumber}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.invoiceInfo}>
          <Text>見積書番号: {quotation?.quotationNumber || ""}</Text>
          <Text>登録番号: {quotation?.registrationNumber || company?.registrationNumber || ""}</Text>
        </View>

        <View style={styles.dateInfo}>
          <Text>発行日: {safeFormatDate(quotation.issueDate)}</Text>
          <Text>有効期限: {safeFormatDate(quotation.expiryDate)}</Text>
        </View>

        <Text style={styles.title}>御 見 積 書</Text>

        <View style={styles.clientSection}>
          <Text style={{ fontSize: 14 }}>{quotation.client.name} {quotation.client.honorific}</Text>
          {quotation.client.department && <Text>{quotation.client.department}</Text>}
          {quotation.client.manager && <Text>{quotation.client.manager} 様</Text>}
        </View>

        <View style={styles.companySection}>
          {company?.stampUrl && (
            <Image src={company.stampUrl} style={styles.stamp} />
          )}
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>{company?.name}</Text>
          <Text>〒{company?.zipCode}</Text>
          <Text>{company?.address}</Text>
          <Text>TEL: {company?.tel}</Text>

          <View style={{ marginTop: 15, textAlign: "right" }}>
            <Text style={{ fontSize: 8, fontWeight: "bold" }}>【振込先情報】</Text>
            <Text style={{ fontSize: 8 }}>{company?.bankName} {company?.bankBranch}</Text>
            <Text style={{ fontSize: 8 }}>{company?.bankAccountType} {company?.bankAccountNumber}</Text>
            <Text style={{ fontSize: 8 }}>口座名義: {company?.bankAccountName}</Text>
          </View>
        </View>

        <View style={styles.amountBox}>
          <Text>見積金額</Text>
          <Text style={{ fontSize: 18 }}>¥{safeFormatNumber(quotation.totalAmount)}- (税込)</Text>
        </View>

        <View style={styles.table}>
          {quotation.templateType === "SES" ? (
            <>
              <View style={styles.tableRow}>
                <View style={[styles.tableColHeader, styles.sesCol1]}><Text>年月</Text></View>
                <View style={[styles.tableColHeader, styles.sesCol2]}><Text>該当者</Text></View>
                <View style={[styles.tableColHeader, styles.sesCol3]}><Text>内容 / 品目</Text></View>
                <View style={[styles.tableColHeader, styles.sesCol4]}><Text>時間</Text></View>
                <View style={[styles.tableColHeader, styles.sesCol5]}><Text>単価</Text></View>
                <View style={[styles.tableColHeader, styles.sesCol6]}><Text>金額</Text></View>
              </View>
              {quotation.items.map((item: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.tableCol, styles.sesCol1]}><Text>{item.serviceMonth || ""}</Text></View>
                  <View style={[styles.tableCol, styles.sesCol2]}><Text>{item.personName || ""}</Text></View>
                  <View style={[styles.tableCol, styles.sesCol3]}>
                    <Text>{item.description}</Text>
                    {(Number(item.overtimeAmount || 0) > 0 || Number(item.deductionAmount || 0) > 0) && (
                      <View style={styles.adjustmentText}>
                        {Number(item.overtimeAmount || 0) > 0 && (
                          <Text>超過精算: ¥{safeFormatNumber(item.overtimeAmount)} ({item.maxHours}h超)</Text>
                        )}
                        {Number(item.deductionAmount || 0) > 0 && (
                          <Text>控除精算: -¥{safeFormatNumber(item.deductionAmount)} ({item.minHours}h未満)</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={[styles.tableCol, styles.sesCol4]}><Text>{Number(item.quantity) || 0}h</Text></View>
                  <View style={[styles.tableCol, styles.sesCol5]}><Text>{safeFormatNumber(item.unitPrice)}</Text></View>
                  <View style={[styles.tableCol, styles.sesCol6]}><Text>{safeFormatNumber(item.amount)}</Text></View>
                </View>
              ))}
            </>
          ) : (
            <>
              <View style={[styles.tableRow]}>
                <View style={[styles.tableColHeader, styles.col1]}><Text>年月</Text></View>
                <View style={[styles.tableColHeader, styles.col2]}><Text>内容 / 品目</Text></View>
                <View style={[styles.tableColHeader, styles.col3]}><Text>数量</Text></View>
                <View style={[styles.tableColHeader, styles.col4]}><Text>単価</Text></View>
                <View style={[styles.tableColHeader, styles.col5]}><Text>金額</Text></View>
              </View>
              {quotation.items.map((item: any, i: number) => (
                <View key={i} style={styles.tableRow}>
                  <View style={[styles.tableCol, styles.col1]}><Text></Text></View>
                  <View style={[styles.tableCol, styles.col2]}><Text>{item.description}</Text></View>
                  <View style={[styles.tableCol, styles.col3]}><Text>{Number(item.quantity || 0)}{item.unit || ""}</Text></View>
                  <View style={[styles.tableCol, styles.col4]}><Text>{safeFormatNumber(item.unitPrice)}</Text></View>
                  <View style={[styles.tableCol, styles.col5]}><Text>{safeFormatNumber(item.amount)}</Text></View>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>小計</Text>
            <Text>¥{safeFormatNumber(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>消費税 (10%)</Text>
            <Text>¥{safeFormatNumber(quotation.taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 2 }]}>
            <Text>合計</Text>
            <Text>¥{safeFormatNumber(quotation.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text>【備考】</Text>
          <Text>{quotation.notes}</Text>
        </View>
      </Page>
    </Document>
  );
};
