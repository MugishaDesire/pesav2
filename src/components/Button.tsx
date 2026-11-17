// src/components/Button.tsx
// One button used everywhere in Pesa.
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  Text,
  ViewStyle,
} from "react-native";
import {
  fontSize,
  fontWeight,
  Palette,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";

type Variant = "primary" | "secondary" | "danger" | "ghost";

type Props = {
  label: string;
  onPress: () => void;
  variant?: Variant; // default: primary
  disabled?: boolean;
  loading?: boolean; // shows a spinner and blocks taps
  style?: StyleProp<ViewStyle>; // lets a screen add margins
};

// Colours for each variant: normal, pressed, text, border (they follow light / dark mode)
function getVariants(colors: Palette) {
  return {
    primary: {
      bg: colors.primary,
      bgPressed: colors.primaryPressed,
      text: colors.white,
      border: colors.primary,
    },
    secondary: {
      bg: colors.surface,
      bgPressed: colors.primarySoft,
      text: colors.primary,
      border: colors.primary,
    },
    danger: {
      bg: colors.danger,
      bgPressed: "#B53838",
      text: colors.white,
      border: colors.danger,
    },
    ghost: {
      bg: "transparent",
      bgPressed: colors.border,
      text: colors.textMuted,
      border: "transparent",
    },
  } as const;
}

export default function Button({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const v = getVariants(colors)[variant];
  const blocked = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: blocked }}
      onPress={onPress}
      disabled={blocked}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? v.bgPressed : v.bg,
          borderColor: v.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.text} />
      ) : (
        <Text style={[styles.label, { color: v.text }]}>{label}</Text>
      )}
    </Pressable>
  );
}

const useStyles = createStyles(() => ({
  base: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.bold,
  },
}));
