// src/components/ReportPreview.tsx
// Bottom sheet that shows the report as a page BEFORE it is downloaded.
// The user reads it, then taps "Download CSV" (or Close).
import { useEffect, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  Share,
  Text,
  View,
} from "react-native";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import {
  formatDate,
  formatNumber,
  formatRWF,
  monthLabel,
  toISODate,
} from "../lib/format";
import { Report, reportToCSV, statusLabel } from "../lib/report";
import Button from "./Button";
import Card from "./Card";
import Logo from "./Logo";

type Props = {
  visible: boolean;
  report: Report | null;
  onClose: () => void;
};

export default function ReportPreview({ visible, report, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(
    null,
  );

  // Clear the old message every time the preview opens
  useEffect(() => {
    if (visible) setNotice(null);
  }, [visible]);

  if (!report) return null;

  const title = monthLabel(report.month);
  const fileName = `pesa-report-${report.month}.csv`;

  async function handleDownload() {
    if (!report) return;
    const csv = reportToCSV(report, title);
    try {
      if (Platform.OS === "web") {
        // Browser: save a real .csv file (BOM first so Excel reads it correctly)
        const g = globalThis as any;
        const blob = new g.Blob(["﻿" + csv], {
          type: "text/csv;charset=utf-8",
        });
        const url = g.URL.createObjectURL(blob);
        const a = g.document.createElement("a");
        a.href = url;
        a.download = fileName;
        g.document.body.appendChild(a);
        a.click();
        a.remove();
        g.URL.revokeObjectURL(url);
        setNotice({ ok: true, text: `Downloaded ${fileName}` });
      } else {
        // Phone: open the share sheet (save to Files, send on WhatsApp, email...)
        await Share.share({ title: fileName, message: csv });
      }
    } catch {
      setNotice({ ok: false, text: "Could not download the report. Try again." });
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.sheetTitle}>Report preview</Text>
          <Text style={styles.sheetHint}>
            Check the report, then download it.
          </Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* The "paper" */}
            <View style={styles.paper}>
              <View style={styles.paperHead}>
                <Logo size={34} body={colors.success} clasp={colors.primaryDark} />
                <View>
                  <Text style={styles.paperBrand}>PESA</Text>
                  <Text style={styles.paperSub}>Monthly Report · {title}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Line label="Available" value={formatRWF(report.available)} />
              <Line label="Savings" value={formatRWF(report.savings)} gold />
              <Line label="Budgeted" value={formatRWF(report.budgeted)} />
              <Line label="Spent" value={formatRWF(report.spent)} />
              <Line
                label={report.left < 0 ? "Overspent by" : "Left to spend"}
                value={formatRWF(Math.abs(report.left))}
                bold
                danger={report.left < 0}
              />

              <View style={styles.divider} />

              {/* Table */}
              <View style={styles.tr}>
                <Text style={[styles.th, styles.colName]}>Category</Text>
                <Text style={[styles.th, styles.colNum]}>Budget</Text>
                <Text style={[styles.th, styles.colNum]}>Spent</Text>
                <Text style={[styles.th, styles.colPct]}>Used</Text>
              </View>

              {report.rows.length === 0 ? (
                <Text style={styles.noRows}>No budgets were set this month.</Text>
              ) : (
                report.rows.map((r) => (
                  <View key={r.id} style={styles.trBody}>
                    <View style={styles.tr}>
                      <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                        {r.icon} {r.name}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {formatNumber(r.limit)}
                      </Text>
                      <Text style={[styles.td, styles.colNum]}>
                        {formatNumber(r.used)}
                      </Text>
                      <Text
                        style={[
                          styles.td,
                          styles.colPct,
                          styles.pct,
                          r.status === "over" && styles.over,
                          r.status === "warning" && styles.warn,
                        ]}
                      >
                        {r.percent}%
                      </Text>
                    </View>
                    {r.status !== "ok" ? (
                      <Text
                        style={[
                          styles.flag,
                          r.status === "over" ? styles.over : styles.warn,
                        ]}
                      >
                        {statusLabel(r.status)}
                      </Text>
                    ) : null}
                  </View>
                ))
              )}

              {report.unbudgeted > 0 ? (
                <Text style={styles.noRows}>
                  {formatRWF(report.unbudgeted)} was spent in categories with no
                  budget.
                </Text>
              ) : null}

              <View style={styles.divider} />
              <Text style={styles.paperFoot}>
                Amounts in RWF · Generated {formatDate(toISODate())}
              </Text>
            </View>

            <Text style={styles.fileLine}>File: {fileName}</Text>

            {notice ? (
              <Card tone={notice.ok ? "highlight" : "danger"}>
                <Text style={styles.noticeText}>{notice.text}</Text>
              </Card>
            ) : null}
          </ScrollView>

          <View style={styles.buttons}>
            <Button label="Download CSV" onPress={handleDownload} />
            <Button label="Close" variant="ghost" onPress={onClose} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Line({
  label,
  value,
  gold,
  bold,
  danger,
}: {
  label: string;
  value: string;
  gold?: boolean;
  bold?: boolean;
  danger?: boolean;
}) {
  const styles = useStyles();
  const { isDark } = useTheme();
  return (
    <View style={styles.line}>
      <Text style={[styles.lineLabel, bold && styles.lineBold]}>{label}</Text>
      <Text
        style={[
          styles.lineValue,
          bold && styles.lineBold,
          gold && { color: isDark ? "#E9B949" : "#9A7410" },
          danger && styles.over,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 74, 51, 0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
    maxWidth: 560,
    width: "100%",
    maxHeight: "94%",
    alignSelf: "center",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  sheetHint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: "center",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Paper look
  paper: {
    padding: spacing.md,
    gap: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  paperHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  paperBrand: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    color: colors.text,
  },
  paperSub: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.xs,
  },
  line: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lineLabel: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  lineValue: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  lineBold: {
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  // Table
  tr: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  trBody: {
    gap: 2,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.textMuted,
  },
  td: {
    fontSize: 12,
    color: colors.text,
    fontVariant: ["tabular-nums"],
  },
  colName: {
    flex: 1.7,
  },
  colNum: {
    flex: 1.1,
    textAlign: "right",
  },
  colPct: {
    flex: 0.7,
    textAlign: "right",
  },
  pct: {
    fontWeight: fontWeight.bold,
  },
  flag: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    textAlign: "right",
  },
  over: {
    color: colors.danger,
  },
  warn: {
    color: colors.warningText,
  },
  noRows: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  paperFoot: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
  },

  fileLine: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: "center",
  },
  noticeText: {
    fontSize: fontSize.small,
    color: colors.text,
  },
  buttons: {
    gap: spacing.xs,
  },
}));
