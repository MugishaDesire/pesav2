// src/app/reports.tsx  (the route behind the Reports button in the bottom nav)
// Copy the same wiring your other routes use if it differs.
import { useRouter } from "expo-router";
import Reports from "../screens/Reports";

export default function ReportsRoute() {
  const router = useRouter();
  return <Reports go={(path) => router.push(path as never)} />;
}
