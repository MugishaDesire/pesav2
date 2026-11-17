// src/screens/Dashboard.tsx  (shown when someone is logged in)
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import Card from "../components/Card";
import Logo from "../components/Logo";
import MonthChips, { lastMonths } from "../components/MonthChips";
import PaymentModal from "../components/PaymentModal";
import ProgressBar from "../components/ProgressBar";
import Pager, { usePaged } from "../components/Pager";
import Screen from "../components/Screen";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { useApp } from "../lib/AppContext";
import {
  budgetStatus,
  formatNumber,
  formatRWF,
  monthKey,
  monthLabel,
  monthName,
  percentUsed,
} from "../lib/format";
import { getCategory } from "../lib/mockData";

export default function Dashboard({ go }: { go: (path: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const app = useApp();
  const name = displayName(app.user?.email ?? "");

  // Month picker: the last 6 months, newest first. Starts on the current month.
  const thisMonth = monthKey();
  const months = lastMonths(6);
  const [selected, setSelected] = useState(thisMonth);

  // Most used first, so the category that needs attention is at the top
  const rows = [...app.budgets]
    .map((b) => ({ budget: b, used: app.spent[b.categoryId] ?? 0 }))
    .sort(
      (a, b) =>
        percentUsed(b.used, b.budget.limitAmount) -
        percentUsed(a.used, a.budget.limitAmount),
    );

  const pg = usePaged(rows, 3); // 3 categories per page

  // Savings payment pop-up
  const [payOpen, setPayOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Mock check for now: pretend to verify the payment, then unlock the budgets
  function handlePaid() {
    setVerifying(true);
    setTimeout(() => {
      app.markSavingsPaid();
      setVerifying(false);
      setPayOpen(false);
    }, 1500);
  }

  // The app keeps one plan (the current month's). Any other month has no plan.
  const plan = app.plan && app.plan.month === selected ? app.plan : null;

  // Another month with no plan: say so
  if (!plan && selected !== thisMonth) {
    return (
      <Screen circles footer={<BottomNav active="home" go={go} />}>
        <TopBar name={name} subtitle={monthLabel(selected)} go={go} />
        <MonthChips
          months={months}
          selected={selected}
          onSelect={setSelected}
        />
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
            Nothing was set up for {monthLabel(selected)}.
          </Text>
        </View>
      </Screen>
    );
  }

  // No plan yet this month: invite the user to start the setup
  if (!plan) {
    return (
      <Screen circles footer={<BottomNav active="home" go={go} />}>
        <TopBar name={name} subtitle={monthLabel()} go={go} />
        <MonthChips
          months={months}
          selected={selected}
          onSelect={setSelected}
        />
        <View style={styles.hero}>
          <HeroShapes />
          <Text style={styles.heroLabel}>This month</Text>
          <Text style={styles.heroTitle}>Plan your month</Text>
          <Text style={styles.heroMeta}>
            Enter how much you have and how much to save. Savings come first.
          </Text>
          <Button
            label="Start monthly setup"
            variant="secondary"
            onPress={() => go("/setup")}
            style={styles.heroButton}
          />
        </View>
      </Screen>
    );
  }

  const savingsPaid = plan.savingsStatus === "paid";
  const spendable = plan.availableAmount - plan.savingsAmount;
  const totalSpent = Object.values(app.spent).reduce((sum, n) => sum + n, 0);
  const left = spendable - totalSpent;
  const overspent = left < 0;
  const pendingCount = app.expenses.filter(
    (e) => e.status === "pending_payment",
  ).length;

  return (
    <Screen circles footer={<BottomNav active="home" go={go} />}>
      <TopBar name={name} subtitle={monthLabel(plan.month)} go={go} />
      <MonthChips months={months} selected={selected} onSelect={setSelected} />

      {/* The one memorable thing: how much can I still spend? */}
      <View style={styles.hero}>
        <HeroShapes />
        <Text style={styles.heroLabel}>
          {overspent ? "Overspent by" : "Left to spend"}
        </Text>
        <Text style={styles.heroAmount}>
          {formatNumber(Math.abs(left))}
          <Text style={styles.heroUnit}> RWF</Text>
        </Text>

        <ProgressBar
          percent={percentUsed(totalSpent, spendable)}
          height={8}
          trackColor={colors.inkSoft}
        />
        <Text style={styles.heroMeta}>
          {formatRWF(totalSpent)} spent of {formatRWF(spendable)}
        </Text>

        {savingsPaid ? (
          <View style={styles.chip}>
            <Ionicons name="lock-closed" size={14} color={colors.gold} />
            <Text style={styles.chipText}>
              {formatRWF(plan.savingsAmount)} savings locked for{" "}
              {monthName(plan.month)}
            </Text>
          </View>
        ) : (
          <Pressable style={styles.chip} onPress={() => setPayOpen(true)}>
            <Text style={styles.chipText}>
              Pay {formatRWF(plan.savingsAmount)} savings to unlock budgets
            </Text>
          </Pressable>
        )}
      </View>

      {pendingCount > 0 ? (
        <Card tone="warning">
          <Text style={styles.pendingText}>
            {pendingCount} expense{pendingCount > 1 ? "s" : ""} waiting for
            payment. Not counted yet.
          </Text>
        </Card>
      ) : null}

      {/* Budgets */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Budgets</Text>
        {savingsPaid && app.budgets.length > 0 ? (
          <Pressable onPress={() => go("/budgets")} hitSlop={12}>
            <Text style={styles.link}>Edit</Text>
          </Pressable>
        ) : null}
      </View>

      {!savingsPaid ? (
        <Card tone="warning">
          <Text style={styles.pendingText}>
            Budgets are locked until your savings are paid.
          </Text>
        </Card>
      ) : app.budgets.length === 0 ? (
        <Card>
          <Text style={styles.bodyText}>No budgets yet for this month.</Text>
          <Button label="Set budgets" onPress={() => go("/budgets")} />
        </Card>
      ) : (
        <>
          <View style={styles.list}>
            {pg.items.map(({ budget, used }, i) => (
              <BudgetRow
                key={budget.categoryId}
                icon={getCategory(budget.categoryId)?.icon ?? "•"}
                name={getCategory(budget.categoryId)?.name ?? "Category"}
                used={used}
                limit={budget.limitAmount}
                last={i === pg.items.length - 1}
              />
            ))}
          </View>
          <Pager {...pg} />
          {app.left > 0 ? (
            <Text style={styles.footnote}>
              {formatRWF(app.left)} not yet assigned to a category
            </Text>
          ) : null}
        </>
      )}

      {/* Pops up over the Dashboard when the user taps "Pay ... savings" */}
      <PaymentModal
        visible={payOpen}
        amount={plan.savingsAmount}
        forLabel={`${monthName(plan.month)} savings`}
        dialString="*182#"
        verifying={verifying}
        onPaid={handlePaid}
        onCancel={() => setPayOpen(false)}
      />
    </Screen>
  );
}

// ---------- Small pieces ----------

function displayName(email: string): string {
  const first = email.split("@")[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

// Soft layered circles in the corner of the green panel (like the splash screen)
function HeroShapes() {
  const styles = useStyles();
  return (
    <>
      <View pointerEvents="none" style={styles.shapeBig} />
      <View pointerEvents="none" style={styles.shapeSmall} />
    </>
  );
}

function TopBar({
  name,
  subtitle,
  go,
}: {
  name: string;
  subtitle: string;
  go: (path: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        {/* Wallet logo + PESA */}
        <View style={styles.brand}>
          <Logo size={36} body={colors.success} clasp={colors.primaryDark} />
          <Text style={styles.wordmark}>PESA</Text>
        </View>

        {/* Profile: the avatar sits where the bell was */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
          onPress={() => go("/profile")}
          style={styles.avatar}
        >
          <Text style={styles.avatarText}>
            {name.slice(0, 2).toUpperCase()}
          </Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.greeting}>Hi, {name} 👋</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function BudgetRow({
  icon,
  name,
  used,
  limit,
  last,
}: {
  icon: string;
  name: string;
  used: number;
  limit: number;
  last: boolean;
}) {
  const styles = useStyles();
  const percent = percentUsed(used, limit);
  const status = budgetStatus(percent);

  // Status in words, so it is clear without seeing the colours
  let statusText: string | null = null;
  if (status === "over") {
    statusText =
      used > limit ? `Over by ${formatRWF(used - limit)}` : "Limit reached";
  } else if (status === "warning") {
    statusText = "Almost at limit";
  }

  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <View style={styles.rowIcon}>
        <Text style={styles.rowIconText}>{icon}</Text>
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={styles.rowName}>{name}</Text>
          <Text
            style={[
              styles.rowPercent,
              status === "over"
                ? styles.statusOver
                : status === "warning"
                  ? styles.statusWarn
                  : styles.statusOk,
            ]}
          >
            {Math.round(percent)}%
          </Text>
        </View>
        <ProgressBar percent={percent} height={6} />
        <View style={styles.rowTop}>
          <Text style={styles.subtitle}>
            {formatRWF(used)} of {formatRWF(limit)}
          </Text>
          {statusText ? (
            <Text
              style={[
                styles.rowStatus,
                status === "over" ? styles.statusOver : styles.statusWarn,
              ]}
            >
              {statusText}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  // Top bar: avatar + greeting on the left, bell on the right
  topBar: {
    gap: spacing.md,
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    color: colors.text,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  greeting: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  link: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },

  // "No plan this month"
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

  // Green hero panel
  hero: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.sm,
    overflow: "hidden", // clips the decorative circles
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
  heroTitle: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
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
  heroButton: {
    marginTop: spacing.sm,
  },
  chip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  chipText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.gold,
  },

  pendingText: {
    fontSize: fontSize.small,
    color: colors.warningText,
  },
  bodyText: {
    fontSize: fontSize.body,
    color: colors.text,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  footnote: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  // Budget list: one white rounded card with thin dividers, like the Transactions list
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
  rowStatus: {
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
}));
