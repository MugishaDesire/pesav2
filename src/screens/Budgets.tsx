import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import { Text, View } from "react-native";
import BottomNav from "../components/BottomNav";
import Button from "../components/Button";
import Card from "../components/Card";
import ProgressBar from "../components/ProgressBar";
import Pager, { usePaged } from "../components/Pager";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { errorMessage, useApp } from "../lib/AppContext";
import {
  formatNumber,
  formatRWF,
  monthLabel,
  monthName,
  percentUsed,
} from "../lib/format";
import * as mockData from "../lib/mockData";
import type { Budget } from "../lib/mockData";

type Category = { id: string; name: string; icon: string };

// The 8 default categories. They are read from mockData, so this screen follows
// whatever list the rest of the app uses.
function findCategories(): Category[] {
  for (const value of Object.values(mockData as Record<string, unknown>)) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (v) =>
          v && typeof v === "object" && "id" in v && "name" in v && "icon" in v,
      )
    ) {
      return value as Category[];
    }
  }
  return [];
}

export default function Budgets({ go }: { go: (path: string) => void }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const app = useApp();
  const { plan } = app;

  const categories = findCategories();
  const pg = usePaged(categories, 3);

  // What the user typed, as plain digits per category ("60000"). Starts from the saved budgets.
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      app.budgets.map((b) => [b.categoryId, String(b.limitAmount)]),
    ),
  );
  // With no budgets yet, show the "Set Your Budget" start card first
  const [started, setStarted] = useState(app.budgets.length > 0);
  const [saveError, setSaveError] = useState<string | null>(null);

  const nav = <BottomNav active="budgets" go={go} />;

  // ---------- No plan yet this month ----------
  if (!plan) {
    return (
      <Screen circles footer={nav}>
        <Header subtitle={monthLabel()} />
        <Notice
          icon="calendar-outline"
          title="Plan your month first"
          text="Enter how much you have and how much to save. Budgets come after that."
          buttonLabel="Start monthly setup"
          onPress={() => go("/setup")}
        />
      </Screen>
    );
  }

  const cap = plan.availableAmount - plan.savingsAmount; // BR3
  const savingsPaid = plan.savingsStatus === "paid";

  // ---------- Savings not paid: budgets are locked (BR2) ----------
  if (!savingsPaid) {
    return (
      <Screen circles footer={nav}>
        <Header subtitle={monthLabel(plan.month)} />
        <Notice
          icon="lock-closed-outline"
          title="Budgets are locked"
          text={`Pay your ${formatRWF(plan.savingsAmount)} savings for ${monthName(plan.month)} first. Budgets unlock after that.`}
          buttonLabel="Go to Home to pay savings"
          onPress={() => go("/")}
        />
      </Screen>
    );
  }

  // ---------- Start card (no budgets yet) ----------
  if (!started) {
    return (
      <Screen circles footer={nav}>
        <Header subtitle={monthLabel(plan.month)} />
        <View style={styles.startCard}>
          <Target />
          <Text style={styles.startTitle}>Set Your Budget</Text>
          <Text style={styles.startText}>
            Plan your spending and stay on track.
          </Text>
          <Text style={styles.startMeta}>
            You can plan up to {formatRWF(cap)} this month.
          </Text>
          <Button
            label="Create Budget"
            onPress={() => setStarted(true)}
            style={styles.startButton}
          />
        </View>
      </Screen>
    );
  }

  // ---------- The budget form ----------
  const amountFor = (id: string) => Number(values[id] || 0);
  const total = categories.reduce((sum, c) => sum + amountFor(c.id), 0);
  const left = cap - total;
  const over = left < 0;
  const hasAny = total > 0;

  function setValue(id: string, text: string) {
    setValues((v) => ({ ...v, [id]: text }));
    setSaveError(null);
  }

  function handleSave() {
    if (over) {
      setSaveError(errorMessage("BUDGET_EXCEEDS_AVAILABLE"));
      return;
    }
    const next = categories
      .map((c) => ({ categoryId: c.id, limitAmount: amountFor(c.id) }))
      .filter((b) => b.limitAmount > 0) as Budget[];

    const error = app.saveBudgets(next);
    if (error) {
      setSaveError(errorMessage(error));
      return;
    }
    go("/"); // after saving, land on the Dashboard to see the budgets
  }

  const footer = (
    <View style={styles.footer}>
      <Button
        label="Save Budgets"
        onPress={handleSave}
        disabled={over || !hasAny}
      />
      {nav}
    </View>
  );

  return (
    <Screen circles footer={footer}>
      <Header subtitle={monthLabel(plan.month)} />

      {/* Live line: how much is still free to give to categories */}
      <View style={styles.hero}>
        <View pointerEvents="none" style={styles.shapeBig} />
        <View pointerEvents="none" style={styles.shapeSmall} />
        <Text style={styles.heroLabel}>
          {over ? "Over the limit by" : "Left to allocate"}
        </Text>
        <Text style={[styles.heroAmount, over && styles.heroAmountOver]}>
          {formatNumber(Math.abs(left))}
          <Text style={styles.heroUnit}> RWF</Text>
        </Text>
        <ProgressBar
          percent={percentUsed(total, cap)}
          height={8}
          trackColor={colors.inkSoft}
        />
        <Text style={styles.heroMeta}>
          {formatRWF(total)} budgeted of {formatRWF(cap)}
        </Text>
        <View style={styles.chip}>
          <Ionicons name="lock-closed" size={14} color={colors.gold} />
          <Text style={styles.chipText}>
            {formatRWF(plan.savingsAmount)} savings locked
          </Text>
        </View>
      </View>

      {over ? (
        <Card tone="danger">
          <Text style={styles.errorText}>
            {errorMessage("BUDGET_EXCEEDS_AVAILABLE")}
          </Text>
        </Card>
      ) : null}
      {saveError && !over ? (
        <Card tone="danger">
          <Text style={styles.errorText}>{saveError}</Text>
        </Card>
      ) : null}

      <Text style={styles.sectionTitle}>Expense Categories</Text>

      <View style={styles.list}>
        {pg.items.map((c, i) => {
          const spent = app.spent[c.id] ?? 0;
          const limit = amountFor(c.id);
          return (
            <View
              key={c.id}
              style={[styles.row, i < pg.items.length - 1 && styles.rowDivider]}
            >
              <View style={styles.rowIcon}>
                <Text style={styles.rowIconText}>{c.icon}</Text>
              </View>
              <View style={styles.rowBody}>
                <Text style={styles.rowName}>{c.name}</Text>
                <TextField
                  money
                  value={values[c.id] ?? ""}
                  onChangeText={(t) => setValue(c.id, t)}
                  placeholder="0"
                />
                {spent > 0 ? (
                  <Text
                    style={[
                      styles.rowHint,
                      limit > 0 && limit < spent && styles.rowHintWarn,
                    ]}
                  >
                    {limit > 0 && limit < spent
                      ? `Already spent ${formatRWF(spent)}, more than this budget`
                      : `Spent so far: ${formatRWF(spent)}`}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
      <Pager {...pg} />
    </Screen>
  );
}

// ---------- Small pieces ----------

function Header({ subtitle }: { subtitle: string }) {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Budgets</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

// Locked / no-plan message
function Notice({
  icon,
  title,
  text,
  buttonLabel,
  onPress,
}: {
  icon: ComponentProps<typeof Ionicons>["name"];
  title: string;
  text: string;
  buttonLabel: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.notice}>
      <View style={styles.noticeIcon}>
        <Ionicons name={icon} size={30} color={colors.primary} />
      </View>
      <Text style={styles.startTitle}>{title}</Text>
      <Text style={styles.startText}>{text}</Text>
      <Button
        label={buttonLabel}
        onPress={onPress}
        style={styles.startButton}
      />
    </View>
  );
}

// The green target on the start card (drawn with circles, no image file)
function Target() {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.target}>
      <View style={styles.targetOuter}>
        <View style={styles.targetMid}>
          <View style={styles.targetInner} />
        </View>
      </View>
      <View style={styles.targetArrow}>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </View>
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

  // Start card and notices (like the Budgets screen in the design picture)
  startCard: {
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
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
  startTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  startText: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
  },
  startMeta: {
    fontSize: fontSize.small,
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
  startButton: {
    alignSelf: "stretch",
    marginTop: spacing.sm,
  },

  // Target drawing
  target: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  targetOuter: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.success,
    alignItems: "center",
    justifyContent: "center",
  },
  targetMid: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  targetInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.success,
  },
  targetArrow: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },

  // Green hero panel
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
  heroAmountOver: {
    color: "#FFB4B4", // soft red that stays readable on dark green
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

  errorText: {
    fontSize: fontSize.small,
    color: colors.danger,
  },

  sectionTitle: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },

  // Category list: one white rounded card with thin dividers
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
  rowName: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  rowHint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  rowHintWarn: {
    color: colors.warningText,
    fontWeight: fontWeight.medium,
  },

  // Save button on top of the nav
  footer: {
    gap: spacing.sm,
  },
}));
