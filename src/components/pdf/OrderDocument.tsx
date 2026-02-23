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



const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Noto Sans JP",
    lineHeight: 1.5,
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 30,
    textDecoration: "underline",
  },
  dateInfo: {
    textAlign: "right",
    marginBottom: 10,
  },
  clientSection: {
    marginTop: 20,
    marginBottom: 20,
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
  col2: { width: "45%" },
  col3: { width: "10%" },
  col4: { width: "15%" },
  col5: { width: "15%" },
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
});

export const OrderDocument = ({ invoice, company }: any) => {
  const subtotal = (invoice.items || []).reduce((acc: number, item: any) => acc + Number(item.amount || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.dateInfo}>
          <Text>注文日: {safeFormatDate(invoice.issueDate)}</Text>
        </View>

        <Text style={styles.title}>御 注 文 書</Text>

        <View style={styles.clientSection}>
          <Text style={{ fontSize: 14 }}>{company?.name} 御中</Text>
        </View>

        <View style={styles.companySection}>
          <Text style={{ fontSize: 12, fontWeight: "bold" }}>{invoice.client.name}</Text>
          <Text>〒{invoice.client.zipCode}</Text>
          <Text>{invoice.client.address}</Text>
          <Text>TEL: {invoice.client.tel}</Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <Text>下記の通り注文いたします。</Text>
        </View>

        <View style={styles.amountBox}>
          <Text>注文合計金額</Text>
          <Text style={{ fontSize: 18 }}>¥{safeFormatNumber(invoice.totalAmount)}- (税込)</Text>
        </View>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.col1]}><Text>案件No</Text></View>
            <View style={[styles.tableColHeader, styles.col2]}><Text>品名 / 備考</Text></View>
            <View style={[styles.tableColHeader, styles.col3]}><Text>数量</Text></View>
            <View style={[styles.tableColHeader, styles.col4]}><Text>単価</Text></View>
            <View style={[styles.tableColHeader, styles.col5]}><Text>金額</Text></View>
          </View>
          {invoice.items.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <View style={[styles.tableCol, styles.col1]}><Text>{item.serviceMonth || ""}</Text></View>
              <View style={[styles.tableCol, styles.col2]}>
                <Text>{item.personName ? `${item.personName} - ` : ""}{item.description}</Text>
              </View>
              <View style={[styles.tableCol, styles.col3]}><Text>{Number(item.quantity || 0)}{item.unit || "h"}</Text></View>
              <View style={[styles.tableCol, styles.col4]}><Text>{safeFormatNumber(item.unitPrice)}</Text></View>
              <View style={[styles.tableCol, styles.col5]}><Text>{safeFormatNumber(item.amount)}</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryRow}>
            <Text>小計</Text>
            <Text>¥{safeFormatNumber(subtotal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text>消費税</Text>
            <Text>¥{safeFormatNumber(invoice.taxAmount)}</Text>
          </View>
          <View style={[styles.summaryRow, { borderBottomWidth: 2 }]}>
            <Text>合計</Text>
            <Text>¥{safeFormatNumber(invoice.totalAmount)}</Text>
          </View>
        </View>

        <View style={styles.notes}>
          <Text>【備考】</Text>
          <Text>{invoice.notes}</Text>
        </View>
      </Page>
    </Document>
  );
};
