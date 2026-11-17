import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "../components/Button";
import Screen from "../components/Screen";
import TextField from "../components/TextField";
import {
  fontSize,
  fontWeight,
  spacing,
} from "../constants/theme";
import { createStyles } from "../lib/ThemeContext";

type Errors = {
  name?: string;
  email?: string;
  password?: string;
  confirm?: string;
};

export default function SignUp({ go }: { go: (path: string) => void }) {
  const styles = useStyles();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  function validate(): Errors {
    const e: Errors = {};
    if (name.trim().length < 2) e.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) e.email = "Enter a valid email address";
    if (password.length < 8) e.password = "Use at least 8 characters";
    if (confirm !== password) e.confirm = "Passwords do not match";
    return e;
  }

  function handleSignUp() {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    // Next step: the OTP page. It signs the user in once the code is verified.
    go(`/verify?email=${encodeURIComponent(email.trim())}&via=signup`);
  }

  return (
    <Screen
      auth={{
        title: "Create Account",
        subtitle: "Start managing your money today",
        onBack: () => go("/login"),
      }}
    >
      <View style={styles.form}>
        <TextField
          icon="person-outline"
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          error={errors.name}
        />
        <TextField
          icon="mail-outline"
          placeholder="Email address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={errors.email}
        />
        <TextField
          icon="lock-closed-outline"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          error={errors.password}
        />
        <TextField
          icon="lock-closed-outline"
          placeholder="Confirm Password"
          value={confirm}
          onChangeText={setConfirm}
          secureTextEntry
          autoCapitalize="none"
          error={errors.confirm}
        />

        <Button
          label="Sign Up"
          onPress={handleSignUp}
          style={styles.button}
        />

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Sign in"
            hitSlop={10}
            onPress={() => go("/login")}
          >
            <Text style={styles.link}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  form: {
    gap: spacing.md,
  },
  button: {
    marginTop: spacing.sm,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  footerText: {
    fontSize: fontSize.small,
    color: colors.textMuted,
  },
  link: {
    fontSize: fontSize.small,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    textDecorationLine: "underline",
  },
}));
