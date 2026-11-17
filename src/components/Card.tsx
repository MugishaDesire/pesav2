import { ReactNode } from "react";
import { StyleProp, View, ViewStyle } from "react-native";
import { Palette, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";

export type CardTone = "default" | "highlight" | "warning" | "danger";

type Props = {
  children: ReactNode;
  tone?: CardTone; // default: 'default'
  style?: StyleProp<ViewStyle>; // lets a screen add margins
};

// Background and border colour for each tone (they follow light / dark mode)
function getTones(colors: Palette) {
  return {
    default: { bg: colors.surface, border: colors.border },
    highlight: { bg: colors.primarySoft, border: colors.primary },
    warning: { bg: colors.warningSoft, border: colors.warning },
    danger: { bg: colors.dangerSoft, border: colors.danger },
  } as const;
}

export default function Card({ children, tone = "default", style }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const t = getTones(colors)[tone];

  return (
    <View
      style={[
        styles.base,
        { backgroundColor: t.bg, borderColor: t.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const useStyles = createStyles(() => ({
  base: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
}));
