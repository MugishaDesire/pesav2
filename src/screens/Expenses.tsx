import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import Card from "../components/Card";
import Pager, { usePaged } from "../components/Pager";
import PaymentModal from "../components/PaymentModal";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { useApp } from "../lib/AppContext";
import {
  formatDate,
  formatNumber,
  formatRWF,
  monthLabel,
} from "../lib/format";
import { getCategory } from "../lib/mockData";

type Filter = "all" | "confirmed" | "pending";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "confirmed", label: "Paid" },
  { key: "pending", label: "Pending" },
];

export default function Expenses({ go }: { go: (path: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const app = useApp();
  const { plan } = app;

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [payId, setPayId] = useState<string | null>(null); // pending expense being paid
  const [verifying, setVerifying] = useState(false);

  const canAdd = !!plan && plan.savingsStatus === "paid";
  const totalSpent = Object.values(app.spent).reduce((sum, n) => sum + n, 0);
  const confirmedCount = app.expenses.filter(
    (e) => e.status === "confirmed",
  ).length;

  function nameOf(e: (typeof app.expenses)[number]): string {
    return e.customName?.trim() || getCategory(e.categoryId)?.name || "Expense";
  }

  // Newest first, then apply the pill and the search text
  const q = query.trim().toLowerCase();
  const rows = [...app.expenses]
    .sort((a, b) => (a.spentOn < b.spentOn ? 1 : a.spentOn > b.spentOn ? -1 : 0))
    .filter((e) => {
      if (filter === "confirmed" && e.status !== "confirmed") return false;
      if (filter === "pending" && e.status !== "pending_payment") return false;
      if (q && !nameOf(e).toLowerCase().includes(q)) return false;
      return true;
    });

  // As many rows per page as fit the screen (about 72px a row; the rest is header, filters, pager and nav)
  const { height } = useWindowDimensions();
  const pageSize = Math.max(3, Math.floor((height - 460) / 72));
  const pg = usePaged(rows, pageSize);
  const { setPage } = pg;
  useEffect(() => setPage(1), [filter, query, setPage]); // back to page 1 when the filter or search changes

  const paying = app.expenses.find((e) => e.id === payId) ?? null;

  function handlePaid() {
    if (!payId) return;
    const id = payId;
    setVerifying(true);
    // Mock check for now. The real one verifies the MoMo SMS with the backend.
    setTimeout(() => {
      app.confirmExpense(id);
      setVerifying(false);
      setPayId(null);
    }, 1500);
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        label="Add Expense"
        onPress={() => go("/add-expense")}
        disabled={!canAdd}
      />
      <BottomNav active="expenses" go={go} />
    </View>
  );

  return (
    <Screen circles footer={footer}>
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <Text style={styles.subtitle}>
          {monthLabel(plan?.month)}
        </Text>
      </View>

      {/* Total spent this month */}
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.shapeBig} />
        <View pointerEvents="none" style={styles.shapeSmall} />
        <Text style={styles.heroLabel}>Spent this month</Text>
        <Text style={styles.heroAmount}>
          {formatNumber(totalSpent)}
          <Text style={styles.heroUnit}> RWF</Text>
        </Text>
        <Text style={styles.heroMeta}>
          {confirmedCount} paid expense{confirmedCount === 1 ? "" : "s"}
        </Text>
      </View>

      {!canAdd ? (
        <Card tone="warning">
          <Text style={styles.warnText}>
            {plan
              ? "Pay your savings on Home to unlock expenses."
              : "Plan your month on Home to start adding expenses."}
          </Text>
        </Card>
      ) : null}

      {/* Filter pills */}
      <View style={styles.pills}>
        {FILTERS.map((f) => {
          const active = f.key === filter;
          return (
            <Pressable
              key={f.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setFilter(f.key)}
              style={[styles.pill, active && styles.pillActive]}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <TextField
        icon="search-outline"
        placeholder="Search expenses..."
        value={query}
        onChangeText={setQuery}
        autoCapitalize="none"
      />

      {/* List */}
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="receipt-outline" size={28} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {app.expenses.length === 0 ? "No expenses yet" : "Nothing found"}
          </Text>
          <Text style={styles.emptyText}>
            {app.expenses.length === 0
              ? "Tap Add Expense to record your first one."
              : "Try another filter or search."}
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pg.items.map((e, i) => {
            const pending = e.status === "pending_payment";
            const confirmed = e.status === "confirmed";
            const badge = pending
              ? "Tap to pay"
              : e.status === "cancelled"
                ? "Cancelled"
                : e.status === "expired"
                  ? "Expired"
                  : null;

            return (
              <Pressable
                key={e.id}
                disabled={!pending}
                accessibilityRole={pending ? "button" : undefined}
                onPress={() => setPayId(e.id)}
                style={[styles.row, i < pg.items.length - 1 && styles.rowDivider]}
              >
                <View style={[styles.rowIcon, !confirmed && styles.rowIconDim]}>
                  <Text style={styles.rowIconText}>
                    {getCategory(e.categoryId)?.icon ?? "•"}
                  </Text>
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowName}>{nameOf(e)}</Text>
                  <Text style={styles.rowDate}>
                    {formatDate(e.spentOn.slice(0, 10))}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text
                    style={[
                      styles.rowAmount,
                      confirmed ? styles.amountPaid : styles.amountMuted,
                    ]}
                  >
                    - {formatNumber(e.amount)} RWF
                  </Text>
                  {badge ? (
                    <Text
                      style={[
                        styles.badge,
                        pending ? styles.badgePending : styles.badgeMuted,
                      ]}
                    >
                      {badge}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
      <Pager {...pg} numbered />

      <PendingNote
        show={app.expenses.some((e) => e.status === "pending_payment")}
      />

      <PaymentModal
        visible={paying !== null}
        amount={paying?.amount ?? 0}
        forLabel={`Expense, ${paying ? nameOf(paying) : ""}`}
        dialString="*182#"
        verifying={verifying}
        onPaid={handlePaid}
        onCancel={() => setPayId(null)}
      />
    </Screen>
  );
}

function PendingNote({ show }: { show: boolean }) {
  const styles = useStyles();
  if (!show) return null;
  return (
    <Text style={styles.note}>
      Pending expenses are not counted in your budgets until they are paid.
    </Text>
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

  // Green summary panel
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
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
  heroMeta: {
    fontSize: fontSize.small,
    color: colors.onInkMuted,
  },

  warnText: {
    fontSize: fontSize.small,
    color: colors.warningText,
  },

  // Filter pills
  pills: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  pill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pillText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  pillTextActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },

  // List: one white rounded card with thin dividers
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
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
  rowIconDim: {
    opacity: 0.55,
  },
  rowIconText: {
    fontSize: fontSize.title,
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rowDate: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  rowRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowAmount: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    fontVariant: ["tabular-nums"],
  },
  amountPaid: {
    color: colors.danger,
  },
  amountMuted: {
    color: colors.textMuted,
  },
  badge: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    paddingVertical: 2,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  badgePending: {
    color: colors.warningText,
    backgroundColor: colors.warningSoft,
  },
  badgeMuted: {
    color: colors.textMuted,
    backgroundColor: colors.field,
  },

  note: {
    fontSize: fontSize.small,
    color: colors.textMuted,
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