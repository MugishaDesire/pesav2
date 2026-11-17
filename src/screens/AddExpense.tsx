import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import PaymentModal from "../components/PaymentModal";
import ProgressBar from "../components/ProgressBar";
import Pager, { usePaged } from "../components/Pager";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { useApp } from "../lib/AppContext";
import { Category, findCategories, isOtherCategory } from "../lib/categories";
import {
  formatNumber,
  formatRWF,
  monthKey,
  percentUsed,
  toISODate,
} from "../lib/format";

type Done = {
  name: string;
  amount: number;
  spentAfter: number;
  limit: number; // 0 = this category has no budget
};

export default function AddExpense({ go }: { go: (path: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const app = useApp();
  const { plan } = app;

  // The list, with an "Other" tile at the end if the data has none
  const base = findCategories();
  const categories: Category[] = base.some(isOtherCategory)
    ? base
    : [...base, { id: "other", name: "Other", icon: "•" }];

  const pg = usePaged(categories, 3); // 3 category tiles per page
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [customName, setCustomName] = useState("");
  const [amount, setAmount] = useState(""); // plain digits
  const [date, setDate] = useState(toISODate());
  const [errors, setErrors] = useState<{
    category?: string;
    name?: string;
    amount?: string;
    date?: string;
  }>({});

  const [warnOpen, setWarnOpen] = useState(false); // BR8 pre-check
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  const selected = categories.find((c) => c.id === categoryId) ?? null;
  const isOther = selected ? isOtherCategory(selected) : false;
  const value = Number(amount || 0);

  // Budget picture of the chosen category
  const limit =
    app.budgets.find((b) => b.categoryId === categoryId)?.limitAmount ?? 0;
  const spent = categoryId ? (app.spent[categoryId] ?? 0) : 0;
  const wouldBe = spent + value;
  const overBy = limit > 0 && value > 0 ? wouldBe - limit : 0;

  const displayName =
    isOther && customName.trim()
      ? customName.trim()
      : (selected?.name ?? "Expense");

  // ---------- Locked until savings are paid ----------
  if (!plan || plan.savingsStatus !== "paid") {
    return (
      <Screen circles>
        <TopBar title="Add Expense" onBack={() => go("/expenses")} />
        <View style={styles.notice}>
          <View style={styles.noticeIcon}>
            <Ionicons
              name="lock-closed-outline"
              size={30}
              color={colors.primary}
            />
          </View>
          <Text style={styles.noticeTitle}>Pay your savings first</Text>
          <Text style={styles.noticeText}>
            Expenses unlock after this month's savings are paid.
          </Text>
          <Button
            label="Go to Home"
            onPress={() => go("/")}
            style={styles.noticeButton}
          />
        </View>
      </Screen>
    );
  }

  // ---------- Confirmation (Flow B step 7) ----------
  if (done) {
    const percent = percentUsed(done.spentAfter, done.limit);
    return (
      <Screen
        circles
        footer={
          <View style={styles.footer}>
            <Button label="Done" onPress={() => go("/expenses")} />
            <Button label="Add another" variant="ghost" onPress={resetForm} />
          </View>
        }
      >
        <TopBar title="Add Expense" />
        <View style={styles.success}>
          <View pointerEvents="none" style={styles.shapeBig} />
          <View pointerEvents="none" style={styles.shapeSmall} />
          <View style={styles.successIcon}>
            <Ionicons name="checkmark" size={32} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Expense added</Text>
          <Text style={styles.successAmount}>
            {formatNumber(done.amount)}
            <Text style={styles.successUnit}> RWF</Text>
          </Text>
          <Text style={styles.successMeta}>{done.name}</Text>

          {done.limit > 0 ? (
            <View style={styles.successBudget}>
              <ProgressBar
                percent={percent}
                height={8}
                trackColor={colors.inkSoft}
              />
              <Text style={styles.successMeta}>
                {done.name}: {formatNumber(done.spentAfter)} /{" "}
                {formatNumber(done.limit)} RWF used
              </Text>
            </View>
          ) : (
            <Text style={styles.successMeta}>
              No budget is set for this category.
            </Text>
          )}
        </View>
      </Screen>
    );
  }

  // ---------- Actions ----------
  function resetForm() {
    setDone(null);
    setCategoryId(null);
    setCustomName("");
    setAmount("");
    setDate(toISODate());
    setErrors({});
    setWarnOpen(false);
    setPendingId(null);
  }

  function validate() {
    const e: typeof errors = {};
    if (!selected) e.category = "Choose a category";
    if (isOther && customName.trim().length < 2) {
      e.name = "Type what this expense was for";
    }
    if (value <= 0) e.amount = "Enter an amount";

    const validShape = /^\d{4}-\d{2}-\d{2}$/.test(date);
    const real = validShape && toISODate(new Date(`${date}T00:00:00`)) === date;
    if (!real) {
      e.date = "Use the format YYYY-MM-DD";
    } else if (date > toISODate()) {
      e.date = "The date cannot be in the future";
    } else if (!date.startsWith(monthKey())) {
      e.date = "Use a date in the current month";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // Continue: check, warn if it would break the budget (BR8), else go to payment
  function handleContinue() {
    if (!validate()) return;
    if (overBy > 0) {
      setWarnOpen(true);
      return;
    }
    startPayment();
  }

  function startPayment() {
    if (!categoryId) return;
    setWarnOpen(false);
    // Saved as pending: it does not count anywhere until the payment is confirmed (BR5)
    const id = app.addPendingExpense({
      categoryId,
      customName: isOther ? customName.trim() : undefined,
      amount: value,
      spentOn: date,
    });
    setPendingId(id);
  }

  function handlePaid() {
    if (!pendingId) return;
    const id = pendingId;
    setVerifying(true);
    // Mock check for now. The real one verifies the MoMo SMS with the backend.
    setTimeout(() => {
      app.confirmExpense(id); // now it counts, so the category budget goes down
      setVerifying(false);
      setPendingId(null);
      setDone({
        name: displayName,
        amount: value,
        spentAfter: wouldBe,
        limit,
      });
    }, 1500);
  }

  function handleCancelPayment() {
    if (pendingId) app.cancelExpense(pendingId); // nothing is recorded
    setPendingId(null);
  }

  return (
    <Screen
      circles
      footer={
        <Button
          label="Continue to payment"
          onPress={handleContinue}
          disabled={warnOpen}
        />
      }
    >
      <TopBar title="Add Expense" onBack={() => go("/expenses")} />

      {/* 1. Category tiles, like the Categories screen in the design */}
      <Text style={styles.label}>Category</Text>
      <View style={styles.grid}>
        {pg.items.map((c) => {
          const active = c.id === categoryId;
          return (
            <Pressable
              key={c.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={c.name}
              onPress={() => {
                setCategoryId(c.id);
                setWarnOpen(false);
                setErrors((e) => ({ ...e, category: undefined }));
              }}
              style={[styles.tile, active && styles.tileActive]}
            >
              <View style={[styles.tileIcon, active && styles.tileIconActive]}>
                <Text style={styles.tileIconText}>{c.icon}</Text>
              </View>
              <Text
                numberOfLines={2}
                style={[styles.tileName, active && styles.tileNameActive]}
              >
                {c.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Pager {...pg} />
      {errors.category ? (
        <Text style={styles.error}>{errors.category}</Text>
      ) : null}

      {isOther ? (
        <TextField
          label="Expense name"
          placeholder="e.g. Haircut"
          value={customName}
          onChangeText={setCustomName}
          autoCapitalize="sentences"
          error={errors.name}
        />
      ) : null}

      {/* 2. Amount and date */}
      <TextField
        label="Amount"
        money
        placeholder="0"
        value={amount}
        onChangeText={(t) => {
          setAmount(t);
          setWarnOpen(false);
        }}
        error={errors.amount}
      />
      <TextField
        label="Date"
        icon="calendar-outline"
        placeholder="YYYY-MM-DD"
        value={date}
        onChangeText={setDate}
        autoCapitalize="none"
        keyboardType="numbers-and-punctuation"
        error={errors.date}
        hint="Today by default"
      />

      {/* What this category has left, live as the amount changes */}
      {selected ? (
        limit > 0 ? (
          <View style={styles.budgetCard}>
            <View style={styles.budgetTop}>
              <Text style={styles.budgetName}>{selected.name} budget</Text>
              <Text style={styles.budgetLeft}>
                {formatRWF(Math.max(0, limit - spent))} left
              </Text>
            </View>
            <ProgressBar percent={percentUsed(wouldBe, limit)} height={8} />
            <Text style={styles.budgetMeta}>
              {formatRWF(spent)} spent of {formatRWF(limit)}
              {value > 0 ? `, ${formatRWF(wouldBe)} with this expense` : ""}
            </Text>
          </View>
        ) : (
          <Card>
            <Text style={styles.budgetMeta}>
              No budget set for {selected.name}. The expense is still recorded.
            </Text>
          </Card>
        )
      ) : null}

      {/* BR8: warn before payment if the budget would be exceeded */}
      {warnOpen ? (
        <Card tone="warning">
          <Text style={styles.warnTitle}>Over budget</Text>
          <Text style={styles.warnText}>
            This expense puts {selected?.name} over its budget by{" "}
            {formatRWF(overBy)}. Do you want to continue?
          </Text>
          <View style={styles.warnButtons}>
            <Button
              label="Continue"
              onPress={startPayment}
              style={styles.warnButton}
            />
            <Button
              label="Cancel"
              variant="secondary"
              onPress={() => setWarnOpen(false)}
              style={styles.warnButton}
            />
          </View>
        </Card>
      ) : null}

      <PaymentModal
        visible={pendingId !== null}
        amount={value}
        forLabel={`Expense, ${displayName}`}
        dialString="*182#"
        verifying={verifying}
        onPaid={handlePaid}
        onCancel={handleCancelPayment}
      />
    </Screen>
  );
}

function TopBar({ title, onBack }: { title: string; onBack?: () => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={onBack}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
      ) : (
        <View style={styles.back} />
      )}
      <Text style={styles.title}>{title}</Text>
      <View style={styles.back} />
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  error: {
    fontSize: fontSize.small,
    color: colors.danger,
  },

  // Category tiles: 3 per row
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  tile: {
    width: "31.5%",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: "transparent",
    backgroundColor: colors.surface,
  },
  tileActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  tileIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  tileIconActive: {
    backgroundColor: colors.surface,
  },
  tileIconText: {
    fontSize: 24,
  },
  tileName: {
    fontSize: fontSize.small,
    color: colors.text,
    textAlign: "center",
  },
  tileNameActive: {
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
  },

  // Budget card
  budgetCard: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  budgetTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  budgetLeft: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  budgetMeta: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  // Over-budget warning
  warnTitle: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.warningText,
  },
  warnText: {
    fontSize: fontSize.small,
    color: colors.warningText,
  },
  warnButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  warnButton: {
    flex: 1,
    minHeight: 46,
  },

  // Locked notice
  notice: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  noticeIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  noticeTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  noticeText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  noticeButton: {
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },

  // Success panel
  success: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    backgroundColor: colors.ink,
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
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.leaf,
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
  },
  successAmount: {
    fontSize: fontSize.display,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
    fontVariant: ["tabular-nums"],
  },
  successUnit: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.medium,
    color: colors.onInkMuted,
  },
  successMeta: {
    fontSize: fontSize.small,
    color: colors.onInkMuted,
    textAlign: "center",
  },
  successBudget: {
    alignSelf: "stretch",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  footer: {
    gap: spacing.xs,
  },
}));
