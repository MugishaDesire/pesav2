import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "../components/Button";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import {
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";
import { createStyles, useTheme } from "../lib/ThemeContext";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 45;

// ---------- Backend hook (mock for now) ----------
// Real version: POST /auth/password/forgot { email }
// The backend creates a one-time token that expires, and emails a link such as
//   https://your-app/reset-password?token=...   (or a deep link into the app)
async function requestPasswordReset(_email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 800));
}

export default function ForgotPassword({
  go,
}: {
  go: (path: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false); // errors show after the first try
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null); // set once the link was sent
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [error, setError] = useState<string | null>(null);

  let emailError: string | undefined;
  if (email.trim() === "") emailError = "Enter your email";
  else if (!EMAIL_PATTERN.test(email.trim()))
    emailError = "Enter a valid email, like you@example.com";

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  async function send(address: string) {
    setLoading(true);
    setError(null);
    try {
      await requestPasswordReset(address);
      setSentTo(address);
      setSecondsLeft(RESEND_SECONDS);
    } catch {
      setError("Could not send the link. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSend() {
    setSubmitted(true);
    if (emailError) return;
    send(email.trim().toLowerCase());
  }

  // ---------- After sending ----------
  if (sentTo) {
    return (
      <Screen
        auth={{
          title: "Check Your Email",
          subtitle: `If an account exists for ${sentTo}, we sent a link to reset your password.`,
          onBack: () => go("/login"),
        }}
      >
        <View style={styles.form}>
          <View style={styles.sentIcon}>
            <Ionicons name="mail-open-outline" size={34} color={colors.primary} />
          </View>

          <Text style={styles.helper}>
            Open the email and tap the link to choose a new password. The link
            works for a short time only. If you do not see it, check your spam
            folder.
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: secondsLeft > 0 || loading }}
            disabled={secondsLeft > 0 || loading}
            hitSlop={10}
            onPress={() => send(sentTo)}
            style={styles.center}
          >
            <Text
              style={[styles.link, secondsLeft > 0 && styles.linkWaiting]}
            >
              {secondsLeft > 0
                ? `Resend Link (${formatClock(secondsLeft)})`
                : "Resend Link"}
            </Text>
          </Pressable>

          <Button label="Back to Sign In" onPress={() => go("/login")} />

          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={() => {
              setSentTo(null);
              setSecondsLeft(0);
            }}
            style={styles.center}
          >
            <Text style={styles.plainLink}>Use a different email</Text>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ---------- Enter your email ----------
  return (
    <Screen
      auth={{
        title: "Forgot Password?",
        subtitle: "Enter your email address and we'll send you a reset link.",
        onBack: () => go("/login"),
      }}
    >
      <View style={styles.form}>
        <TextField
          icon="mail-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={submitted ? emailError : undefined}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          label="Send Reset Link"
          onPress={handleSend}
          loading={loading}
        />

        <Pressable
          accessibilityRole="link"
          accessibilityLabel="Back to sign in"
          hitSlop={10}
          disabled={loading}
          onPress={() => go("/login")}
          style={styles.center}
        >
          <Text style={styles.link}>Back to Sign In</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function formatClock(totalSeconds: number): string {
  const m = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const useStyles = createStyles((colors) => ({
  form: {
    gap: spacing.md,
  },
  center: {
    alignSelf: "center",
  },
  link: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  linkWaiting: {
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },
  plainLink: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textDecorationLine: "underline",
  },
  error: {
    fontSize: fontSize.small,
    color: colors.danger,
    textAlign: "center",
  },
  sentIcon: {
    alignSelf: "center",
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  helper: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
  },
}));
