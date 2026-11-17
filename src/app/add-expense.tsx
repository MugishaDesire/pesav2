
import { useRouter } from "expo-router";
import AddExpense from "../screens/AddExpense";

export default function AddExpenseRoute() {
  const router = useRouter();
  return <AddExpense go={(path) => router.push(path as never)} />;
}