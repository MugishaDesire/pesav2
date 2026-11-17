import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Button from "../components/Button";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import {
  colors,
  fontSize,
  fontWeight,
  radius,
  spacing,
} from "../constants/theme";

type Busy = null | "email" | "google";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Brand colours of the three logos (not part of the Pesa theme)
const GOOGLE_BLUE = "#4285F4";
const MS_RED = "#F25022";
const MS_GREEN = "#7FBA00";
const MS_BLUE = "#00A4EF";
const MS_YELLOW = "#FFB900";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true); // saved on the device once the backend exists
  const [submitted, setSubmitted] = useState(false); // errors only show after the first try
  const [busy, setBusy] = useState<Busy>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // The screens we navigate to may not exist yet, so we cast the path for now
  const go = (path: string) => router.push(path as never);

  // ---------- Validation ----------

  let emailError: string | undefined;
  if (email.trim() === "") emailError = "Enter your email";
  else if (!EMAIL_PATTERN.test(email.trim()))
    emailError = "Enter a valid email, like you@example.com";

  const passwordError = password === "" ? "Enter your password" : undefined;

  // ---------- Actions ----------

  // Every sign-in (email or Google) goes through the OTP page first.
  // The OTP page signs the user in once the code is verified.
  function startOtp(address: string, via: "login" | "google") {
    setBusy(null);
    go(`/verify?email=${encodeURIComponent(address)}&via=${via}`);
  }

  function handleSignIn() {
    setSubmitted(true);
    setNotice(null);
    if (emailError || passwordError) return;

    setBusy("email");
    // Fake delay: the real app checks the password and asks the backend to send the code here
    setTimeout(() => startOtp(email.trim().toLowerCase(), "login"), 800);
  }

  function handleGoogle() {
    setNotice(null);
    setBusy("google");
    // Fake: the real Google sign-in comes with the backend, which then sends the code
    setTimeout(() => startOtp("guest@gmail.com", "google"), 800);
  }

  function handleOtherProvider() {
    setNotice(
      "Apple and Microsoft sign-in are not available yet. Use your email or Google.",
    );
  }

  const socialBlocked = busy !== null;

  return (
    <Screen
      auth={{ title: "Welcome Back 👋", subtitle: "Sign in to continue" }}
    >
      <TextField
        icon="mail-outline"
        placeholder="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={submitted ? emailError : undefined}
      />

      <TextField
        icon="lock-closed-outline"
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
        error={submitted ? passwordError : undefined}
      />

      <View style={styles.optionsRow}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: remember }}
          onPress={() => setRemember(!remember)}
          hitSlop={8}
          style={styles.checkRow}
        >
          <View style={[styles.checkBox, remember && styles.checkBoxOn]}>
            {remember ? (
              <Ionicons name="checkmark" size={14} color={colors.white} />
            ) : null}
          </View>
          <Text style={styles.checkLabel}>Remember me</Text>
        </Pressable>

        <Pressable
          onPress={() => go("/forgot-password")}
          hitSlop={8}
          disabled={busy !== null}
        >
          <Text style={styles.forgot}>Forgot password?</Text>
        </Pressable>
      </View>

      <Button
        label="Sign In"
        onPress={handleSignIn}
        loading={busy === "email"}
        disabled={busy === "google"}
      />

      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>or continue with</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.socialRow}>
        <SocialButton
          label="Continue with Google"
          onPress={handleGoogle}
          disabled={socialBlocked}
        >
          {busy === "google" ? (
            <ActivityIndicator color={GOOGLE_BLUE} />
          ) : (
            <Ionicons name="logo-google" size={22} color={GOOGLE_BLUE} />
          )}
        </SocialButton>

        <SocialButton
          label="Continue with Apple"
          onPress={handleOtherProvider}
          disabled={socialBlocked}
        >
          <Ionicons name="logo-apple" size={24} color={colors.text} />
        </SocialButton>

        <SocialButton
          label="Continue with Microsoft"
          onPress={handleOtherProvider}
          disabled={socialBlocked}
        >
          <View style={styles.msGrid}>
            <View style={[styles.msSquare, { backgroundColor: MS_RED }]} />
            <View style={[styles.msSquare, { backgroundColor: MS_GREEN }]} />
            <View style={[styles.msSquare, { backgroundColor: MS_BLUE }]} />
            <View style={[styles.msSquare, { backgroundColor: MS_YELLOW }]} />
          </View>
        </SocialButton>
      </View>

      {notice ? <Text style={styles.notice}>{notice}</Text> : null}

      <View style={styles.bottomRow}>
        <Text style={styles.bottomText}>Don't have an account?</Text>
        <Pressable
          onPress={() => router.replace("/signup" as never)}
          hitSlop={8}
          disabled={busy !== null}
        >
          <Text style={styles.signUp}>Sign Up</Text>
        </Pressable>
      </View>
    </Screen>
  );
}

function SocialButton({
  label,
  onPress,
  disabled,
  children,
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.socialButton,
        pressed && styles.socialPressed,
        disabled && styles.socialDisabled,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  checkBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  checkBoxOn: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkLabel: {
    fontSize: fontSize.small,
    color: colors.text,
  },
  forgot: {
    fontSize: fontSize.small,
    color: colors.primary,
    textDecorationLine: "underline",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.md,
  },
  socialButton: {
    width: 68,
    height: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  socialPressed: {
    backgroundColor: colors.primarySoft,
  },
  socialDisabled: {
    opacity: 0.5,
  },
  msGrid: {
    width: 18,
    height: 18,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  msSquare: {
    width: 8,
    height: 8,
  },
  notice: {
    fontSize: fontSize.small,
    color: colors.warningText,
    textAlign: "center",
  },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  bottomText: {
    fontSize: fontSize.small,
    color: colors.text,
  },
  signUp: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textDecorationLine: "underline",
  },
});
