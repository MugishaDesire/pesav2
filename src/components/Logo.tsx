// src/components/Logo.tsx
// The Pesa wallet mark, drawn with plain shapes so it needs no image file.
import { View } from "react-native";
import { useTheme } from "../lib/ThemeContext";

type Props = {
  size?: number; // width in pixels. Default 64
  body?: string; // wallet colour
  clasp?: string; // clasp colour
};

export default function Logo({
  size = 64,
  body,
  clasp,
}: Props) {
  const { colors } = useTheme();
  const bodyColor = body ?? colors.primary;
  const claspColor = clasp ?? colors.primaryDark;
  const w = size;
  const h = size * 0.85;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Pesa logo"
      style={{ width: w, height: h }}
    >
      {/* Flap peeking out behind the wallet */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: w * 0.1,
          width: w * 0.72,
          height: h * 0.5,
          borderRadius: w * 0.14,
          backgroundColor: bodyColor,
          opacity: 0.55,
        }}
      />

      {/* Wallet body */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          width: w,
          height: h * 0.78,
          borderRadius: w * 0.2,
          backgroundColor: bodyColor,
        }}
      />

      {/* Clasp with its button */}
      <View
        style={{
          position: "absolute",
          right: -w * 0.03,
          bottom: h * 0.16,
          width: w * 0.44,
          height: h * 0.34,
          borderTopLeftRadius: w * 0.17,
          borderBottomLeftRadius: w * 0.17,
          borderTopRightRadius: w * 0.06,
          borderBottomRightRadius: w * 0.06,
          backgroundColor: claspColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <View
          style={{
            width: w * 0.12,
            height: w * 0.12,
            borderRadius: w * 0.06,
            backgroundColor: colors.white,
          }}
        />
      </View>
    </View>
  );
}
