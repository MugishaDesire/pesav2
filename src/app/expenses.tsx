
import { useRouter } from "expo-router";
import Expenses from "../screens/Expenses";

export default function ExpensesRoute() {
  const router = useRouter();
  return <Expenses go={(path) => router.push(path as never)} />;
}
