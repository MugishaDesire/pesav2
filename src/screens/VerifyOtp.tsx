import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Button from "../components/Button";
import Screen from "../components/Screen";
import { fontSize, fontWeight, radius, spacing } from "../constants/theme";
import { createStyles } from "../lib/ThemeContext";
import { useApp } from "../lib/AppContext";

const TEST_MODE = true;
const CODE_LENGTH = 6;
const RESEND_SECONDS = 45;

// ---------- Backend hooks (mock for now) ----------

async function verifyCodeWithBackend(
  _email: string,
  code: string,
): Promise<boolean> {
  await new Promise((r) => setTimeout(r, 600));
  return TEST_MODE ? code.length === CODE_LENGTH : false;
}

async function requestCodeFromBackend(_email: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 400));
}

// ---------- Screen ----------

type Props = {
  email: string;
  via?: string; // "login" | "google" | "signup" (for later use, e.g. different wording)
  go: (path: string) => void;
};

export default function VerifyOtp({ email, go }: Props) {
  const styles = useStyles();
  const app = useApp();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [focused, setFocused] = useState(true);
  const inputRef = useRef<TextInput>(null);

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondsLeft]);

  const shownEmail = email || "your email";

  async function handleVerify() {
    if (code.length < CODE_LENGTH) {
      setError(`Enter the ${CODE_LENGTH}-digit code`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const ok = await verifyCodeWithBackend(email, code);
      if (!ok) {
        setError("That code is not correct. Try again.");
        setLoading(false);
        return;
      }
      // Verified: sign in. The Dashboard opens at "/"
      app.login(email || "user@pesa.app");
      setLoading(false);
      go("/");
    } catch {
      setError("Could not verify the code. Check your connection.");
      setLoading(false);
    }
  }

  async function handleResend() {
    if (secondsLeft > 0) return;
    setError(null);
    setCode("");
    setNotice("A new code was sent.");
    setSecondsLeft(RESEND_SECONDS);
    try {
      await requestCodeFromBackend(email);
    } catch {
      setNotice(null);
      setError("Could not send a new code. Try again.");
    }
    inputRef.current?.focus();
  }

  return (
    <Screen
      auth={{
        title: "Verify Your Email",
        subtitle: `Enter the ${CODE_LENGTH}-digit code sent to ${shownEmail}`,
        onBack: () => go("/login"),
      }}
    >
      <View style={styles.form}>
        {/* The 6 boxes. One invisible input sits on top and receives the typing. */}
        <View style={styles.boxesWrap}>
          <View style={styles.boxes} pointerEvents="none">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const digit = code[i] ?? "";
              const isActive =
                focused && i === Math.min(code.length, CODE_LENGTH - 1);
              return (
                <View
                  key={i}
                  style={[
                    styles.box,
                    isActive && styles.boxActive,
                    !!error && styles.boxError,
                  ]}
                >
                  <Text style={styles.digit}>{digit}</Text>
                </View>
              );
            })}
          </View>

          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) => {
              setCode(t.replace(/\D/g, "").slice(0, CODE_LENGTH));
              setError(null);
              setNotice(null);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            accessibilityLabel={`${CODE_LENGTH}-digit verification code`}
            caretHidden
            style={styles.hiddenInput}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {notice && !error ? <Text style={styles.notice}>{notice}</Text> : null}

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: secondsLeft > 0 }}
          disabled={secondsLeft > 0}
          hitSlop={10}
          onPress={handleResend}
          style={styles.resend}
        >
          <Text
            style={[styles.resendText, secondsLeft > 0 && styles.resendWaiting]}
          >
            {secondsLeft > 0
              ? `Resend Code (${formatClock(secondsLeft)})`
              : "Resend Code"}
          </Text>
        </Pressable>

        <Button
          label="Verify"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length < CODE_LENGTH}
          style={styles.button}
        />

        {TEST_MODE ? (
          <Text style={styles.testNote}>
            Test mode: any {CODE_LENGTH} digits will work.
          </Text>
        ) : null}
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

  boxesWrap: {
    position: "relative",
  },
  boxes: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  box: {
    flex: 1,
    height: 56,
    maxWidth: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.field,
    alignItems: "center",
    justifyContent: "center",
  },
  boxActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  boxError: {
    borderColor: colors.danger,
  },
  digit: {
    fontSize: fontSize.title,
    fontWeight: fontWeight.bold,
    color: colors.text,
  },
  // Covers the boxes, so tapping a box focuses the real input
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.02,
    color: "transparent",
    fontSize: 16,
  },

  error: {
    fontSize: fontSize.small,
    color: colors.danger,
    textAlign: "center",
  },
  notice: {
    fontSize: fontSize.small,
    color: colors.primary,
    textAlign: "center",
  },

  resend: {
    alignSelf: "center",
  },
  resendText: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  resendWaiting: {
    color: colors.primaryDark,
    fontWeight: fontWeight.medium,
  },

  button: {
    marginTop: spacing.xs,
  },
  testNote: {
    fontSize: fontSize.small,
    color: colors.textMuted,
    textAlign: "center",
  },
}));
