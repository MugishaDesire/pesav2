import { Pressable, ScrollView, Text } from "react-native";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { monthKey, monthLabel, monthName } from "../lib/format";
import { createStyles } from "../lib/ThemeContext";

// ["2026-11", "2026-10", ...] starting with the current month
export function lastMonths(count: number): string[] {
  const now = new Date();
  return Array.from({ length: count }, (_, i) =>
    monthKey(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
}

export default function MonthChips({
  months,
  selected,
  onSelect,
}: {
  months: string[];
  selected: string;
  onSelect: (key: string) => void;
}) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {months.map((key) => {
        const active = key === selected;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={monthLabel(key)}
            onPress={() => onSelect(key)}
            style={[styles.pill, active && styles.pillActive]}
          >
            <Text style={[styles.text, active && styles.textActive]}>
              {monthName(key).slice(0, 3)} {key.slice(0, 4)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const useStyles = createStyles((colors) => ({
  // flexGrow 0 + fixed height: never taller than one pill
  scroll: {
    flexGrow: 0,
    flexShrink: 0,
    height: 36,
  },
  row: {
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  pill: {
    height: 32,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  textActive: {
    color: colors.white,
    fontWeight: fontWeight.bold,
  },
}));
