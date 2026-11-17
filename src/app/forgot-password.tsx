import { useRouter } from "expo-router";
import ForgotPassword from "../screens/ForgotPassword";

export default function ForgotPasswordRoute() {
  const router = useRouter();
  return <ForgotPassword go={(path) => router.push(path as never)} />;
}
