import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Button from "../components/Button";
import Card from "../components/Card";
import CategoryChip from "../components/CategoryChip";
import PaymentModal from "../components/PaymentModal";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import { colors, fontSize, fontWeight, spacing } from "../constants/theme";
import { errorMessage, useApp } from "../lib/AppContext";
import { formatRWF, monthName, parseAmount } from "../lib/format";

// PLACEHOLDER. The real code will come from the backend (GET /config/payment).
const DIAL_STRING = "*182*1*1#";

const SAVE_PERCENTS = [10, 20, 30];

/** 10% of 300000 -> 30000, rounded to the nearest 100 RWF */
function percentAmount(available: number, percent: number): number {
  return Math.round((available * percent) / 10000) * 100;
}

export default function Setup() {
  const app = useApp();
  const router = useRouter();

  // If the user already has a plan this month, start from its numbers
  const [available, setAvailable] = useState(
    app.plan ? String(app.plan.availableAmount) : "",
  );
  const [savings, setSavings] = useState(
    app.plan ? String(app.plan.savingsAmount) : "",
  );
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [stage, setStage] = useState<"form" | "paid">("form");

  const availableNumber = parseAmount(available);
  const savingsNumber = parseAmount(savings);

  // ---------- Validation ----------

  let availableError: string | undefined;
  if (!availableNumber) availableError = "Enter the amount you have this month";

  let savingsError: string | undefined;
  if (!savingsNumber) savingsError = "Enter how much you want to save";
  else if (availableNumber && savingsNumber > availableNumber) {
    savingsError = "Savings cannot be more than the amount you have";
  }

  const canShowSpendable =
    availableNumber !== null &&
    savingsNumber !== null &&
    savingsNumber <= availableNumber;

  // ---------- Actions ----------

  function handleNext() {
    setSubmitted(true);
    setFormError(null);
    if (
      availableError ||
      savingsError ||
      availableNumber === null ||
      savingsNumber === null
    ) {
      return;
    }

    const error = app.setPlan(availableNumber, savingsNumber); // saves the plan as unpaid
    if (error) {
      setFormError(errorMessage(error));
      return;
    }
    app.markSavingsAwaiting();
    setPayOpen(true);
  }

  function handlePaid() {
    setVerifying(true);
    // Fake check: the real app sends the MoMo SMS or transaction ID to the backend here
    setTimeout(() => {
      app.markSavingsPaid();
      setVerifying(false);
      setPayOpen(false);
      setStage("paid");
    }, 1500);
  }

  function handleCancelPayment() {
    setPayOpen(false);
    // Calling setPlan again with the same numbers puts savings back to "unpaid"
    if (app.plan) app.setPlan(app.plan.availableAmount, app.plan.savingsAmount);
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
  }

  // ---------- Step 7: savings confirmed ----------

  if (stage === "paid" && app.plan) {
    const spendable = app.plan.availableAmount - app.plan.savingsAmount;
    return (
      <Screen
        footer={
          <View style={styles.footerStack}>
            {/* The Budgets screen is built in the next file */}
            <Button
              label="Set budgets"
              onPress={() => router.replace("/budgets" as never)}
            />
            <Button
              label="Back to home"
              variant="ghost"
              onPress={() => router.replace("/")}
            />
          </View>
        }
      >
        <View style={styles.heading}>
          <Text style={styles.title}>Savings locked</Text>
        </View>

        <Card tone="highlight">
          <Text style={styles.cardText}>
            Savings of {formatRWF(app.plan.savingsAmount)} is locked for{" "}
            {monthName(app.plan.month)}.
          </Text>
        </Card>

        <Card>
          <Text style={styles.subtitle}>You can budget and spend</Text>
          <Text style={styles.amount}>{formatRWF(spendable)}</Text>
        </Card>
      </Screen>
    );
  }

  // ---------- Steps 3 to 5: the form ----------

  return (
    <Screen
      footer={
        <Button
          label="Next: pay savings"
          onPress={handleNext}
          disabled={payOpen}
        />
      }
    >
      <Pressable onPress={handleBack} hitSlop={12}>
        <Text style={styles.link}>Back</Text>
      </Pressable>

      <View style={styles.heading}>
        <Text style={styles.title}>Plan {monthName()}</Text>
        <Text style={styles.subtitle}>
          Savings come first. You pay them before setting budgets.
        </Text>
      </View>

      {app.plan?.savingsStatus === "paid" ? (
        <Card tone="warning">
          <Text style={styles.warningText}>
            Savings are already paid for this month. If you change them, you
            will pay again.
          </Text>
        </Card>
      ) : null}

      <TextField
        label="Amount you have this month"
        value={available}
        onChangeText={setAvailable}
        placeholder="0"
        money
        error={submitted ? availableError : undefined}
      />

      <TextField
        label="Savings"
        value={savings}
        onChangeText={setSavings}
        placeholder="0"
        money
        error={submitted ? savingsError : undefined}
        hint={
          canShowSpendable
            ? `After savings you can spend ${formatRWF(availableNumber - savingsNumber)}`
            : undefined
        }
      />

      {availableNumber ? (
        <View style={styles.chipRow}>
          {SAVE_PERCENTS.map((p) => {
            const amount = percentAmount(availableNumber, p);
            return (
              <CategoryChip
                key={p}
                label={`Save ${p}%`}
                selected={savingsNumber === amount}
                onPress={() => setSavings(String(amount))}
              />
            );
          })}
        </View>
      ) : null}

      {formError ? (
        <Card tone="danger">
          <Text style={styles.cardText}>{formError}</Text>
        </Card>
      ) : null}

      <PaymentModal
        visible={payOpen}
        amount={savingsNumber ?? 0}
        forLabel={`${monthName()} savings`}
        dialString={DIAL_STRING}
        verifying={verifying}
        onPaid={handlePaid}
        onCancel={handleCancelPayment}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: {
    gap: spacing.xs,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
  },
  link: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cardText: {
    fontSize: fontSize.body,
    color: colors.text,
  },
  warningText: {
    fontSize: fontSize.small,
    color: colors.warningText,
  },
  amount: {
    fontSize: fontSize.amount,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  footerStack: {
    gap: spacing.sm,
  },
});
