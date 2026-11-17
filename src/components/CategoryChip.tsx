import { Pressable, Text } from "react-native";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles } from "../lib/ThemeContext";

type Props = {
  label: string;
  icon?: string; // an emoji
  selected: boolean;
  onPress: () => void;
};

export default function CategoryChip({
  label,
  icon,
  selected,
  onPress,
}: Props) {
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected && styles.selected,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>
        {icon ? `${icon} ${label}` : label}
      </Text>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  base: {
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    backgroundColor: colors.border,
  },
  label: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: colors.text,
  },
  labelSelected: {
    color: colors.primary,
    fontWeight: fontWeight.bold,
  },
}));
