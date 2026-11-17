// src/components/Screen.tsx
// Base wrapper for every screen: safe areas, scrolling, keyboard, optional pinned footer.
// With the `auth` option it becomes the white sign-in page: mint circles, logo, title.
// With the `circles` option a normal screen gets the same soft mint circles (used on Home).
import { Ionicons } from "@expo/vector-icons";
import { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  fontSize,
  fontWeight,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";
import Logo from "./Logo";

export type AuthHeader = {
  title: string;
  subtitle: string;
  onBack?: () => void; // shows the back arrow when given
};

type Props = {
  children: ReactNode;
  scroll?: boolean; // default true. Use false for short screens that never scroll
  footer?: ReactNode; // pinned at the bottom, e.g. a Next or Save button
  auth?: AuthHeader; // turns this screen into a sign-in page
  circles?: boolean; // soft mint circles at the top and bottom, on a white page
};

export default function Screen({
  children,
  scroll = true,
  footer,
  auth,
  circles = false,
}: Props) {
  const styles = useStyles();
  const decorated = !!auth || circles; // white page with circles

  const body = (
    <>
      {auth ? <AuthTop auth={auth} /> : null}
      {children}
    </>
  );

  return (
    <SafeAreaView style={[styles.safe, decorated && styles.safeWhite]}>
      {decorated ? (
        <>
          {/* Decorative circles. They never block taps */}
          <View pointerEvents="none" style={styles.circleSoft} />
          <View pointerEvents="none" style={styles.circleMint} />
          <View pointerEvents="none" style={styles.circleBottomRight} />
          <View pointerEvents="none" style={styles.circleBottomLeft} />
        </>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              styles.column,
              auth && styles.contentAuth,
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {body}
          </ScrollView>
        ) : (
          <View
            style={[
              styles.flex,
              styles.content,
              styles.column,
              auth && styles.contentAuth,
            ]}
          >
            {body}
          </View>
        )}

        {footer ? (
          <View style={[styles.footer, circles && styles.footerClear]}>
            <View style={styles.column}>{footer}</View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// Back arrow, wallet mark, PESA, title and subtitle
function AuthTop({ auth }: { auth: AuthHeader }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <>
      {auth.onBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={auth.onBack}
          hitSlop={12}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      ) : null}

      <View style={[styles.brand, !auth.onBack && styles.brandNoBack]}>
        <Logo size={60} body={colors.success} clasp={colors.primaryDark} />
        <Text style={styles.wordmark}>PESA</Text>
      </View>

      <View style={styles.heading}>
        <Text style={styles.title}>{auth.title}</Text>
        <Text style={styles.subtitle}>{auth.subtitle}</Text>
      </View>
    </>
  );
}

const useStyles = createStyles((colors) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    overflow: "hidden", // clips the circles at the screen edge
  },
  safeWhite: {
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  // Keeps cards a good size on wide screens (web, tablets): centred, never wider than 560
  column: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
  },
  contentAuth: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Footer on a circles screen: see-through, so the circles show behind the nav
  footerClear: {
    backgroundColor: "transparent",
    borderTopColor: colors.mint,
  },

  // Soft circles (sign-in pages and Home)
  circleSoft: {
    position: "absolute",
    top: -150,
    right: -120,
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: colors.mintSoft,
  },
  circleMint: {
    position: "absolute",
    top: -90,
    right: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: colors.mint,
    opacity: 0.7,
  },
  circleBottomRight: {
    position: "absolute",
    bottom: -140,
    right: -90,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: colors.mintFaint,
  },
  circleBottomLeft: {
    position: "absolute",
    bottom: -110,
    left: -70,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.mintFaint,
  },

  // Sign-in page header
  back: {
    alignSelf: "flex-start",
  },
  brand: {
    alignItems: "center",
    gap: spacing.sm,
  },
  brandNoBack: {
    marginTop: spacing.lg,
  },
  wordmark: {
    fontSize: 30,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    color: colors.text,
  },
  heading: {
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: colors.text,
    textAlign: "center",
  },
  subtitle: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: "center",
    maxWidth: 300,
  },
}));
