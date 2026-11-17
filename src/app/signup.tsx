
import { useRouter } from "expo-router";
import SignUp from "../screens/SignUp";

export default function SignUpRoute() {
  const router = useRouter();
  return <SignUp go={(path) => router.push(path as never)} />;
}
