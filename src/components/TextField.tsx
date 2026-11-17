// src/components/TextField.tsx
// One input used everywhere: optional label, optional icon, hint, error, money mode, password eye.
// Leave the label out and it becomes the placeholder-only input used on the sign-in pages.
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps, useState } from "react";
import {
  KeyboardTypeOptions,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { formatNumber, parseAmount } from "../lib/format";

type IconName = ComponentProps<typeof Ionicons>["name"];

type Props = {
  label?: string; // shown above the box. Leave out for placeholder-only inputs
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  icon?: IconName; // shown at the left, e.g. "mail-outline"
  error?: string; // shown in red under the box
  hint?: string; // shown in grey under the box (hidden while there is an error)
  money?: boolean; // whole RWF only: digits, shown with commas, "RWF" on the right
  keyboardType?: KeyboardTypeOptions;
  secureTextEntry?: boolean; // password: adds an eye button
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  maxLength?: number;
};

export default function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  error,
  hint,
  money = false,
  keyboardType,
  secureTextEntry = false,
  autoCapitalize,
  maxLength,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [focused, setFocused] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);

  // In money mode the screen keeps raw digits ("3500"), the box shows "3,500"
  const shown = money ? (value ? formatNumber(Number(value)) : "") : value;

  function handleChange(text: string) {
    if (money) {
      const amount = parseAmount(text);
      onChangeText(amount === null ? "" : String(amount));
    } else {
      onChangeText(text);
    }
  }

  const borderColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.border;
  const iconColor = error
    ? colors.danger
    : focused
      ? colors.primary
      : colors.textMuted;

  return (
    <View style={styles.wrapper}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <View style={[styles.box, { borderColor }]}>
        {icon ? <Ionicons name={icon} size={20} color={iconColor} /> : null}

        <TextInput
          style={styles.input}
          value={shown}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label ?? placeholder}
          keyboardType={money ? "number-pad" : keyboardType}
          secureTextEntry={secureTextEntry && !passwordVisible}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          maxLength={maxLength}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {money ? <Text style={styles.suffix}>RWF</Text> : null}

        {secureTextEntry ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              passwordVisible ? "Hide password" : "Show password"
            }
            hitSlop={8}
            onPress={() => setPasswordVisible(!passwordVisible)}
          >
            <Ionicons
              name={passwordVisible ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  wrapper: {
    gap: spacing.xs,
  },
  label: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  box: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderWidth: 1,
    backgroundColor: colors.field,
  },
  input: {
    flex: 1,
    fontSize: fontSize.body,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  suffix: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  hint: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  error: {
    fontSize: fontSize.small,
    color: colors.danger,
  },
}));
