// src/app/budgets.tsx  (the route behind the Budgets button in the bottom nav)
// Copy the same wiring your src/app/index.tsx uses for Dashboard if it differs.
import { useRouter } from "expo-router";
import Budgets from "../screens/Budgets";

export default function BudgetsRoute() {
  const router = useRouter();
  return <Budgets go={(path) => router.push(path as never)} />;
}