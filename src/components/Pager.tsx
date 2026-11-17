import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";

export function usePaged<T>(all: T[], pageSize: number) {
  const [page, setPage] = useState(1);
  const size = Math.max(1, pageSize);
  const pageCount = Math.max(1, Math.ceil(all.length / size));

  // A filter or a smaller list can leave us past the last page
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  const current = Math.min(page, pageCount);
  const items = all.slice((current - 1) * size, current * size);
  return {
    items,
    page: current,
    pageCount,
    setPage,
    startIndex: (current - 1) * size,
  };
}

type Props = {
  page: number;
  pageCount: number;
  setPage: (n: number) => void;
  numbered?: boolean;
};

export default function Pager({ page, pageCount, setPage, numbered }: Props) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (pageCount <= 1) return null;

  const hasPrev = page > 1;
  const hasNext = page < pageCount;

  // Show at most 5 page numbers around the current page
  let from = Math.max(1, page - 2);
  const to = Math.min(pageCount, from + 4);
  from = Math.max(1, to - 4);
  const numbers: number[] = [];
  for (let n = from; n <= to; n++) numbers.push(n);

  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Previous page"
        accessibilityState={{ disabled: !hasPrev }}
        disabled={!hasPrev}
        onPress={() => setPage(page - 1)}
        style={[styles.btn, !hasPrev && styles.btnOff]}
      >
        <Ionicons name="chevron-back" size={16} color={colors.primary} />
        <Text style={styles.btnText}>Previous</Text>
      </Pressable>

      {numbered ? (
        <View style={styles.numbers}>
          {numbers.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Page ${n}`}
              accessibilityState={{ selected: n === page }}
              onPress={() => setPage(n)}
              style={[styles.num, n === page && styles.numActive]}
            >
              <Text
                style={[styles.numText, n === page && styles.numTextActive]}
              >
                {n}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={styles.status}>
          {page} / {pageCount}
        </Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Next page"
        accessibilityState={{ disabled: !hasNext }}
        disabled={!hasNext}
        onPress={() => setPage(page + 1)}
        style={[styles.btn, !hasNext && styles.btnOff]}
      >
        <Text style={styles.btnText}>Next</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.primary} />
      </Pressable>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  btnOff: { opacity: 0.4 },
  btnText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  status: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  numbers: { flexDirection: "row", gap: 6 },
  num: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  numActive: { backgroundColor: colors.primary },
  numText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.medium,
    color: colors.textMuted,
  },
  numTextActive: { color: colors.white, fontWeight: fontWeight.bold },
}));
