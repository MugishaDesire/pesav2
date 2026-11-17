// src/components/ProgressBar.tsx
// Budget bar. Colour follows rule BR8: green < 80%, amber from 80%, red from 100%.
import { View } from "react-native";
import {
  radius,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import { budgetStatus } from "../lib/format";

type Props = {
  percent: number; // can be above 100 when a category is over budget
  height?: number; // default 10
  trackColor?: string; // the empty part. Default grey; pass a dark colour on dark panels
};

export default function ProgressBar({
  percent,
  height = 10,
  trackColor,
}: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fillColors = {
    ok: colors.success,
    warning: colors.warning,
    over: colors.danger,
  } as const;
  // The bar itself can never be wider than the track, but the colour still sees the real percent
  const width = Math.max(0, Math.min(percent, 100));
  const color = fillColors[budgetStatus(percent)];

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: width }}
      style={[
        styles.track,
        { height, backgroundColor: trackColor ?? colors.border },
      ]}
    >
      <View
        style={[styles.fill, { width: `${width}%`, backgroundColor: color }]}
      />
    </View>
  );
}

const useStyles = createStyles(() => ({
  track: {
    width: "100%",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radius.pill,
  },
}));
