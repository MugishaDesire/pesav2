import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Button from "../components/Button";
import Logo from "../components/Logo";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";

const STEPS = [
  "Set aside your savings and pay it first",
  "Budget what is left",
  "Add an expense once it is paid",
];

type Props = {
  onLogin: () => void;
  onDemo: () => void;
};

export default function Welcome({ onLogin, onDemo }: Props) {
  return (
    <SafeAreaView style={styles.screen}>
      {/* Big layered curves, as on the splash design. They never block taps */}
      <View pointerEvents="none" style={styles.shapeTopLeft} />
      <View pointerEvents="none" style={styles.shapeBottomRight} />
      <View pointerEvents="none" style={styles.shapeBottomLeft} />

      <View style={styles.body}>
        <View style={styles.brand}>
          <Logo size={92} body={colors.leaf} clasp={colors.primary} />
          <Text style={styles.wordmark}>PESA</Text>
          <Text style={styles.tagline}>Track • Balance • Grow</Text>
        </View>

        <Text style={styles.description}>
          Take control of your money and achieve your financial goals.
        </Text>

        {/* These really are a sequence, so numbers are honest here. One card per step */}
        <View style={styles.steps}>
          {STEPS.map((text, i) => (
            <View key={text} style={styles.stepCard}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Login" variant="secondary" onPress={onLogin} />
        {/* DEV ONLY: remove when the real login exists */}
        <Pressable onPress={onDemo} style={styles.devLink}>
          <Text style={styles.devText}>Dev: load demo data</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ink,
    overflow: "hidden", // clips the shapes at the screen edge
  },
  shapeTopLeft: {
    position: "absolute",
    top: -200,
    left: -180,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: colors.splashDark,
  },
  shapeBottomRight: {
    position: "absolute",
    bottom: -260,
    right: -200,
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: colors.splashLight,
  },
  shapeBottomLeft: {
    position: "absolute",
    bottom: -200,
    left: -140,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: colors.splashMid,
  },
  body: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  wordmark: {
    fontSize: 64,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    color: colors.white,
    marginTop: spacing.sm,
  },
  tagline: {
    fontSize: fontSize.body,
    color: colors.white,
  },
  description: {
    fontSize: fontSize.title,
    color: colors.white,
    textAlign: "center",
    alignSelf: "center",
    maxWidth: 300,
    lineHeight: 28,
  },
  steps: {
    gap: spacing.sm,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.gold,
  },
  stepText: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.onInk,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  devLink: {
    alignItems: "center",
    padding: spacing.sm,
  },
  devText: {
    fontSize: fontSize.small,
    color: colors.onInkMuted,
  },
});
