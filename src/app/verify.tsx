// src/app/verify.tsx  (the OTP page)
// Opened like this:  go(`/verify?email=${encodeURIComponent(email)}&via=login`)
// Copy the same wiring your other routes use if it differs.
import { useLocalSearchParams, useRouter } from "expo-router";
import VerifyOtp from "../screens/VerifyOtp";

export default function VerifyRoute() {
  const router = useRouter();
  const { email, via } = useLocalSearchParams<{
    email?: string;
    via?: string;
  }>();
  return (
    <VerifyOtp
      email={typeof email === "string" ? email : ""}
      via={typeof via === "string" ? via : undefined}
      go={(path) => router.push(path as never)}
    />
  );
}
