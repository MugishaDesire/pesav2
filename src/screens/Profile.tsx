import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import Button from "../components/Button";
import Screen from "../components/Screen";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { useApp } from "../lib/AppContext";
import { formatRWF, monthName } from "../lib/format";
import { createStyles, useTheme } from "../lib/ThemeContext";

type IconName = ComponentProps<typeof Ionicons>["name"];

export default function Profile({ go }: { go: (path: string) => void }) {
  const styles = useStyles();
  const { colors, isDark, setMode } = useTheme();
  const app = useApp();
  const { plan } = app;
  const email = app.user?.email ?? "";
  const name = displayName(email);


  const [budgetAlerts, setBudgetAlerts] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [monthReminder, setMonthReminder] = useState(true);

  const [open, setOpen] = useState<"help" | "about" | null>(null);

  function handleLogout() {
    app.logout();
    go("/login");
  }

  return (
    <Screen circles>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={12}
          onPress={() => go("/")}
          style={styles.iconButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.title}>Profile</Text>
        <View style={styles.iconButton} />
      </View>

      {/* Account card */}
      <View style={styles.account}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name.slice(0, 2).toUpperCase()}</Text>
        </View>
        <View style={styles.accountText}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      {/* Appearance: light / dark */}
      <Text style={styles.section}>Appearance</Text>
      <View style={styles.list}>
        <SwitchRow
          icon={isDark ? "moon-outline" : "sunny-outline"}
          label="Dark mode"
          hint={isDark ? "Dark theme is on" : "Light theme is on"}
          value={isDark}
          onChange={(on) => setMode(on ? "dark" : "light")}
        />
      </View>

      {/* Notifications */}
      <Text style={styles.section}>Notifications</Text>
      <View style={styles.list}>
        <SwitchRow
          icon="notifications-outline"
          label="Budget alerts"
          hint="When a category reaches 80% and 100%"
          value={budgetAlerts}
          onChange={setBudgetAlerts}
          divider
        />
        <SwitchRow
          icon="checkmark-circle-outline"
          label="Payment confirmations"
          hint="When a payment is verified"
          value={paymentAlerts}
          onChange={setPaymentAlerts}
          divider
        />
        <SwitchRow
          icon="calendar-outline"
          label="Month-start reminder"
          hint="Remind me to pay my savings"
          value={monthReminder}
          onChange={setMonthReminder}
        />
      </View>

      {/* Monthly plan */}
      <Text style={styles.section}>Monthly plan</Text>
      <View style={styles.list}>
        <LinkRow
          icon="wallet-outline"
          label={
            plan
              ? `Edit ${monthName(plan.month)} plan`
              : "Start this month's plan"
          }
          value={plan ? `${formatRWF(plan.savingsAmount)} savings` : undefined}
          onPress={() => go("/setup")}
          divider
        />
        <LinkRow
          icon="pie-chart-outline"
          label="Budgets"
          onPress={() => go("/budgets")}
          divider
        />
        <LinkRow
          icon="document-text-outline"
          label="Monthly report"
          onPress={() => go("/reports")}
        />
      </View>

      {/* General */}
      <Text style={styles.section}>General</Text>
      <View style={styles.list}>
        <LinkRow
          icon="help-circle-outline"
          label="Help & Support"
          chevron={open === "help" ? "chevron-up" : "chevron-down"}
          onPress={() => setOpen(open === "help" ? null : "help")}
          divider={open !== "help"}
        />
        {open === "help" ? (
          <View style={[styles.panel, styles.rowDivider]}>
            <Text style={styles.panelText}>
              1. Set how much you have this month and how much to save.
            </Text>
            <Text style={styles.panelText}>
              2. Pay your savings. Budgets unlock after that.
            </Text>
            <Text style={styles.panelText}>
              3. Add expenses. An expense counts against its budget once the
              payment is confirmed.
            </Text>
          </View>
        ) : null}

        <LinkRow
          icon="information-circle-outline"
          label="About PESA"
          chevron={open === "about" ? "chevron-up" : "chevron-down"}
          onPress={() => setOpen(open === "about" ? null : "about")}
        />
        {open === "about" ? (
          <View style={[styles.panel, styles.rowTop]}>
            <Text style={styles.panelText}>
              Pesa means "money" in Swahili. Track, balance and grow: protect
              your savings first, budget what is left, and record an expense
              only once it has been paid.
            </Text>
          </View>
        ) : null}
      </View>

      <Button
        label="Log Out"
        variant="secondary"
        onPress={handleLogout}
        style={styles.logout}
      />
    </Screen>
  );
}

// ---------- Rows ----------

function IconTile({ icon }: { icon: IconName }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.rowIcon}>
      <Ionicons name={icon} size={22} color={colors.primary} />
    </View>
  );
}

function SwitchRow({
  icon,
  label,
  hint,
  value,
  onChange,
  divider,
}: {
  icon: IconName;
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
  divider?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={[styles.row, divider && styles.rowDivider]}>
      <IconTile icon={icon} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor={colors.white}
      />
    </View>
  );
}

function LinkRow({
  icon,
  label,
  value,
  onPress,
  divider,
  chevron = "chevron-forward",
}: {
  icon: IconName;
  label: string;
  value?: string;
  onPress: () => void;
  divider?: boolean;
  chevron?: IconName;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={[styles.row, divider && styles.rowDivider]}
    >
      <IconTile icon={icon} />
      <View style={styles.rowBody}>
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      <Ionicons name={chevron} size={18} color={colors.textMuted} />
    </Pressable>
  );
}

function displayName(email: string): string {
  const first = email.split("@")[0] || "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

const useStyles = createStyles((colors) => ({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
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

  // Account card
  account: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  accountText: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  email: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  section: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
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
  rowTop: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: {
    flex: 1,
    gap: 2,
  },
  rowLabel: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  rowHint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  rowValue: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },

  // Expanded help / about text
  panel: {
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  panelText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    lineHeight: 20,
  },

  logout: {
    marginTop: spacing.sm,
  },
}));
