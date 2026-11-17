import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import MonthChips, { lastMonths } from "../components/MonthChips";
import ProgressBar from "../components/ProgressBar";
import ReportPreview from "../components/ReportPreview";
import Screen from "../components/Screen";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { useApp } from "../lib/AppContext";
import {
  formatNumber,
  formatRWF,
  monthKey,
  monthLabel,
  monthName,
} from "../lib/format";
import { buildReport, statusLabel } from "../lib/report";

export default function Reports({ go }: { go: (path: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const app = useApp();
  const { plan } = app;

  // Month pills: the last 6 months, newest first
  const months = lastMonths(6);
  const [selected, setSelected] = useState(monthKey());
  const [previewOpen, setPreviewOpen] = useState(false);

  // The app keeps one plan (the current month's). Other months have no data yet.
  const report =
    plan && plan.month === selected
      ? buildReport(plan, app.budgets, app.spent)
      : null;

  const footer = (
    <View style={styles.footer}>
      <Button
        label="Preview & Download"
        onPress={() => setPreviewOpen(true)}
        disabled={!report}
      />
      <BottomNav active="reports" go={go} />
    </View>
  );

  return (
    <Screen circles footer={footer}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>{monthLabel(selected)}</Text>
      </View>

      <MonthChips months={months} selected={selected} onSelect={setSelected} />

      {!report ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons
              name="calendar-outline"
              size={28}
              color={colors.primary}
            />
          </View>
          <Text style={styles.emptyTitle}>No plan this month</Text>
          <Text style={styles.emptyText}>
            There is no report for {monthLabel(selected)}.
          </Text>
        </View>
      ) : (
        <>
          {/* Summary panel */}
          <View style={styles.hero}>
            <View pointerEvents="none" style={styles.shapeBig} />
            <View pointerEvents="none" style={styles.shapeSmall} />
            <Text style={styles.heroLabel}>
              {report.left < 0 ? "Overspent by" : "Left to spend"}
            </Text>
            <Text style={styles.heroAmount}>
              {formatNumber(Math.abs(report.left))}
              <Text style={styles.heroUnit}> RWF</Text>
            </Text>

            <View style={styles.statsRow}>
              <Stat label="Available" value={report.available} />
              <Stat label="Savings" value={report.savings} gold />
              <Stat label="Spent" value={report.spent} />
            </View>

            {report.rows.some((r) => r.used > r.limit) ? (
              <View style={styles.flagRow}>
                <Ionicons name="alert-circle" size={16} color="#FFB4B4" />
                <Text style={styles.flagText}>
                  {report.rows.filter((r) => r.used > r.limit).length} over
                  budget
                </Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.muted}>
            {formatRWF(report.spent)} spent of {formatRWF(report.budgeted)}{" "}
            budgeted
          </Text>

          {report.rows.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                No budgets were set this month.
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {report.rows.map((r, i) => (
                <View
                  key={r.id}
                  style={[
                    styles.row,
                    i < report.rows.length - 1 && styles.rowDivider,
                  ]}
                >
                  <View style={styles.rowIcon}>
                    <Text style={styles.rowIconText}>{r.icon}</Text>
                  </View>
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.rowName}>{r.name}</Text>
                      <Text
                        style={[
                          styles.rowPercent,
                          r.status === "over"
                            ? styles.statusOver
                            : r.status === "warning"
                              ? styles.statusWarn
                              : styles.statusOk,
                        ]}
                      >
                        {r.percent}%
                      </Text>
                    </View>
                    <ProgressBar percent={r.percent} height={6} />
                    <View style={styles.rowTop}>
                      <Text style={styles.muted}>
                        {formatRWF(r.used)} of {formatRWF(r.limit)}
                      </Text>
                      {r.status !== "ok" ? (
                        <Text
                          style={[
                            styles.flagSmall,
                            r.status === "over"
                              ? styles.statusOver
                              : styles.statusWarn,
                          ]}
                        >
                          {r.status === "over" && r.used > r.limit
                            ? `Over by ${formatRWF(r.used - r.limit)}`
                            : statusLabel(r.status)}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}

          {report.unbudgeted > 0 ? (
            <Text style={styles.muted}>
              {formatRWF(report.unbudgeted)} was spent in categories with no
              budget.
            </Text>
          ) : null}
        </>
      )}

      <ReportPreview
        visible={previewOpen}
        report={report}
        onClose={() => setPreviewOpen(false)}
      />
    </Screen>
  );
}

function Stat({
  label,
  value,
  gold = false,
}: {
  label: string;
  value: number;
  gold?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, gold && { color: colors.gold }]}>
        {formatNumber(value)}
      </Text>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  header: {
    gap: 2,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  // Summary panel
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden",
  },
  shapeBig: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.splashMid,
  },
  shapeSmall: {
    position: "absolute",
    bottom: -80,
    left: -50,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.splashLight,
    opacity: 0.5,
  },
  heroLabel: {
    fontSize: fontSize.small,
    color: colors.onInkMuted,
  },
  heroAmount: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
    fontVariant: ["tabular-nums"],
  },
  heroUnit: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.medium,
    color: colors.onInkMuted,
  },
  statsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  stat: {
    flex: 1,
    gap: 2,
    padding: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  statLabel: {
    fontSize: 11,
    color: colors.onInkMuted,
  },
  statValue: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
    fontVariant: ["tabular-nums"],
  },
  flagRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  flagText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: "#FFB4B4",
  },

  muted: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  // Category rows
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowIconText: {
    fontSize: fontSize.title,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  rowName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rowPercent: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
  flagSmall: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
  },
  statusOk: {
    color: colors.success,
  },
  statusWarn: {
    color: colors.warningText,
  },
  statusOver: {
    color: colors.danger,
  },

  // Empty state
  empty: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  emptyText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
  },

  footer: {
    gap: spacing.sm,
  },
}));
