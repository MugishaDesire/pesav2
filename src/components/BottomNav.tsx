// src/components/BottomNav.tsx
// Bottom tab bar: Home, Expenses, Budgets, Settings.
import { Ionicons } from "@expo/vector-icons";
import { ComponentProps } from "react";
import { Pressable, Text, View } from "react-native";
import {
  fontSize,
  fontWeight,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";

type IconName = ComponentProps<typeof Ionicons>["name"];
export type TabKey = "home" | "expenses" | "budgets" | "reports";

type Props = {
  active: TabKey;
  go: (path: string) => void;
};

// Change a path here if your route file has a different name.
// Each path is the file inside src/app: index.tsx -> "/", expenses.tsx -> "/expenses", ...
const TABS: { key: TabKey; label: string; path: string; icon: IconName; iconActive: IconName }[] = [
  { key: "home", label: "Home", path: "/", icon: "home-outline", iconActive: "home" },
  { key: "expenses", label: "Expenses", path: "/expenses", icon: "receipt-outline", iconActive: "receipt" },
  { key: "budgets", label: "Budgets", path: "/budgets", icon: "pie-chart-outline", iconActive: "pie-chart" },
  { key: "reports", label: "Reports", path: "/reports", icon: "document-text-outline", iconActive: "document-text" },
];

export default function BottomNav({ active, go }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      {TABS.map((t) => {
        const isActive = t.key === active;
        const color = isActive ? colors.primary : colors.textMuted;

        return (
          <Pressable
            key={t.key}
            accessibilityRole="button"
            accessibilityLabel={t.label}
            accessibilityState={{ selected: isActive }}
            // Already on this page: do nothing
            onPress={() => {
              if (!isActive) go(t.path);
            }}
            style={styles.item}
          >
            <Ionicons
              name={isActive ? t.iconActive : t.icon}
              size={22}
              color={color}
            />
            <Text
              style={[
                styles.label,
                { color },
                isActive && { fontWeight: fontWeight.bold },
              ]}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles(() => ({
  bar: {
    flexDirection: "row",
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 2,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: fontSize.tiny,
    fontWeight: fontWeight.medium,
  },
}));
