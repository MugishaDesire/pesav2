// src/components/PaymentModal.tsx
// The shared payment pop-up (design document, section 3.3).
// Used for BOTH savings and expense payments.
// Looks like a green bottom sheet that slides up over the page behind it.
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
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
import { formatRWF } from "../lib/format";
import Button from "./Button";
import Card from "./Card";

type Props = {
  visible: boolean;
  amount: number; // whole RWF
  forLabel: string; // e.g. "Expense, Food" or "November savings"
  dialString: string; // e.g. "*182#". The real one will come from the backend later
  minutes?: number; // how long the payment stays open. Default 10 (rule BR5)
  verifying?: boolean; // true while the app checks the payment: shows a spinner on "I've paid"
  onPaid: () => void; // user tapped "I've paid"
  onCancel: () => void; // user tapped Cancel (or Try again after expiry)
};

function formatCountdown(totalSeconds: number): string {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function PaymentModal({
  visible,
  amount,
  forLabel,
  dialString,
  minutes = 10,
  verifying = false,
  onPaid,
  onCancel,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [secondsLeft, setSecondsLeft] = useState(minutes * 60);
  const [notice, setNotice] = useState<string | null>(null);

  // Restart the countdown every time the popup opens
  useEffect(() => {
    if (!visible) return;
    setSecondsLeft(minutes * 60);
    setNotice(null);
    const id = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [visible, minutes]);

  const expired = secondsLeft === 0;

  async function handlePayNow() {
    // Only Android can open the dialer with a code. "#" must be sent as %23.
    if (Platform.OS !== "android") {
      setNotice(
        `This device cannot open the dialer. Please dial ${dialString} yourself.`,
      );
      return;
    }
    try {
      await Linking.openURL(`tel:${encodeURIComponent(dialString)}`);
    } catch {
      setNotice(
        `Could not open the dialer. Please dial ${dialString} yourself.`,
      );
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          <Text style={styles.title}>Confirm payment</Text>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Amount: green panel like the Home card */}
            <View style={styles.amountCard}>
              <View pointerEvents="none" style={styles.shapeBig} />
              <View pointerEvents="none" style={styles.shapeSmall} />
              <Text style={styles.amountLabel}>Amount</Text>
              <Text style={styles.amount}>{formatRWF(amount)}</Text>
              <View style={styles.forChip}>
                <Text style={styles.forLabel}>{forLabel}</Text>
              </View>
            </View>

            {/* Steps */}
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>How to pay</Text>
                <Text style={styles.stepText}>
                  Dial this code and follow the MTN MoMo prompts
                </Text>
                <Card tone="highlight" style={styles.codeCard}>
                  <Text selectable style={styles.code}>
                    {dialString}
                  </Text>
                </Card>
              </View>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <View style={styles.stepBody}>
                <Text style={styles.stepTitle}>Then</Text>
                <Text style={styles.stepText}>Tap "I've paid"</Text>
              </View>
            </View>

            {expired ? (
              <Card tone="danger">
                <Text style={styles.stepText}>
                  Payment expired. Nothing was recorded.
                </Text>
              </Card>
            ) : (
              <View style={styles.timer}>
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.primaryDark}
                />
                <Text style={styles.timerText}>
                  Expires in {formatCountdown(secondsLeft)}
                </Text>
              </View>
            )}

            {notice ? (
              <Card tone="warning">
                <Text style={styles.stepText}>{notice}</Text>
              </Card>
            ) : null}
          </ScrollView>

          <View style={styles.buttons}>
            {expired ? (
              <Button label="Try again" onPress={onCancel} />
            ) : (
              <>
                <Button
                  label="Pay now"
                  variant="secondary"
                  onPress={handlePayNow}
                  disabled={verifying}
                />
                <Button
                  label="I've paid"
                  onPress={onPaid}
                  loading={verifying}
                />
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={onCancel}
                  disabled={verifying}
                />
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createStyles((colors) => ({
  // Dark green tint over the page behind, sheet sits at the bottom
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
    gap: spacing.md,
    maxWidth: 560,
    width: "100%",
    maxHeight: "92%",
    alignSelf: "center",
  },
  grabber: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border,
  },
  title: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    gap: spacing.md,
  },

  // Amount panel
  amountCard: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: "hidden",
  },
  shapeBig: {
    position: "absolute",
    top: -80,
    right: -60,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.splashMid,
  },
  shapeSmall: {
    position: "absolute",
    bottom: -70,
    left: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.splashLight,
    opacity: 0.5,
  },
  amountLabel: {
    fontSize: fontSize.small,
    color: colors.onInkMuted,
  },
  amount: {
    fontSize: fontSize.amount,
    fontWeight: fontWeight.bold,
    color: colors.onInk,
    fontVariant: ["tabular-nums"],
  },
  forChip: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.leaf,
  },
  forLabel: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.leaf,
  },

  // Steps
  step: {
    flexDirection: "row",
    gap: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  stepBody: {
    flex: 1,
    gap: spacing.xs,
  },
  stepTitle: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  stepText: {
    fontSize: fontSize.body,
    color: colors.text,
  },
  codeCard: {
    alignItems: "center",
    borderRadius: radius.lg,
  },
  code: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
  },

  // Countdown pill
  timer: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  timerText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primaryDark,
  },

  buttons: {
    gap: spacing.sm,
  },
}));
