import { useRouter } from "expo-router";
import Reports from "../screens/Reports";

export default function ReportsRoute() {
  const router = useRouter();
  return <Reports go={(path) => router.push(path as never)} />;
}
