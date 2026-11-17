import { useRouter } from "expo-router";
import Profile from "../screens/Profile";

export default function ProfileRoute() {
  const router = useRouter();
  return <Profile go={(path) => router.push(path as never)} />;
}
