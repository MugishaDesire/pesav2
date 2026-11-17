import { createContext, ReactNode, useContext, useState } from "react";
import { monthKey } from "./format";
import { ThemeProvider } from "./ThemeContext";
import {
  Budget,
  Expense,
  leftToAllocate,
  mockBudgets,
  mockExpenses,
  mockPlan,
  MonthlyPlan,
  spentByCategory,
  totalBudgeted,
} from "./mockData";

// ---------- Errors (same names as the design document, section 9) ----------

export type ErrorCode =
  | "SAVINGS_REQUIRED"
  | "BUDGET_EXCEEDS_AVAILABLE"
  | "SAVINGS_EXCEEDS_AVAILABLE";

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  SAVINGS_REQUIRED:
    "Set and pay your savings first. Budgets unlock after that.",
  BUDGET_EXCEEDS_AVAILABLE:
    "Your budgets are more than what is left after savings.",
  SAVINGS_EXCEEDS_AVAILABLE:
    "Savings cannot be more than the amount you have this month.",
};

export function errorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}

// ---------- Shape of the shared memory ----------

type NewExpense = {
  categoryId: string;
  customName?: string;
  amount: number;
  spentOn: string;
};

type AppState = {
  // Data
  user: { email: string } | null;
  plan: MonthlyPlan | null; // null = no setup yet this month
  budgets: Budget[];
  expenses: Expense[];

  // Calculated from the data above
  spent: Record<string, number>; // confirmed spending per category
  left: number; // "left to allocate"

  // Account (fake for now)
  login: (email: string) => void;
  logout: () => void;

  // Monthly setup
  setPlan: (availableAmount: number, savingsAmount: number) => ErrorCode | null;
  markSavingsAwaiting: () => void;
  markSavingsPaid: () => void;
  saveBudgets: (budgets: Budget[]) => ErrorCode | null;

  // Expenses
  addPendingExpense: (input: NewExpense) => string; // returns the new expense id
  confirmExpense: (id: string) => void;
  cancelExpense: (id: string) => void;
  expireExpense: (id: string) => void;
  deleteExpense: (id: string) => void;

  // Development helper
  loadDemoData: () => void;
};

const AppContext = createContext<AppState | null>(null);

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `x${Date.now()}${idCounter}`;
}

// ---------- The provider ----------

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppState["user"]>(null);
  const [plan, setPlanState] = useState<MonthlyPlan | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const spent = spentByCategory(expenses); // only confirmed ones count (BR5)
  const left = plan ? leftToAllocate(plan, budgets) : 0;

  function login(email: string) {
    setUser({ email });
  }

  function logout() {
    setUser(null);
    setPlanState(null);
    setBudgets([]);
    setExpenses([]);
  }

  function setPlan(
    availableAmount: number,
    savingsAmount: number,
  ): ErrorCode | null {
    if (savingsAmount > availableAmount) return "SAVINGS_EXCEEDS_AVAILABLE";
    // Any change to savings must be paid again (BR2, BR9)
    setPlanState({
      month: monthKey(),
      availableAmount,
      savingsAmount,
      savingsStatus: "unpaid",
    });
    return null;
  }

  function setSavingsStatus(status: MonthlyPlan["savingsStatus"]) {
    setPlanState((p) => (p ? { ...p, savingsStatus: status } : p));
  }

  function saveBudgets(next: Budget[]): ErrorCode | null {
    if (!plan || plan.savingsStatus !== "paid") return "SAVINGS_REQUIRED"; // BR2
    if (totalBudgeted(next) > plan.availableAmount - plan.savingsAmount) {
      return "BUDGET_EXCEEDS_AVAILABLE"; // BR3
    }
    setBudgets(next.filter((b) => b.limitAmount > 0));
    return null;
  }

  function addPendingExpense(input: NewExpense): string {
    const id = newId();
    // Saved as pending: it does not count anywhere until the payment is verified (BR5)
    setExpenses((list) => [
      ...list,
      { id, ...input, status: "pending_payment" },
    ]);
    return id;
  }

  function setExpenseStatus(id: string, status: Expense["status"]) {
    setExpenses((list) =>
      list.map((e) => (e.id === id ? { ...e, status } : e)),
    );
  }

  function deleteExpense(id: string) {
    setExpenses((list) => list.filter((e) => e.id !== id));
  }

  function loadDemoData() {
    setUser((u) => u ?? { email: "demo@pesa.app" });
    setPlanState(mockPlan);
    setBudgets(mockBudgets);
    setExpenses(mockExpenses);
  }

  const value: AppState = {
    user,
    plan,
    budgets,
    expenses,
    spent,
    left,
    login,
    logout,
    setPlan,
    markSavingsAwaiting: () => setSavingsStatus("awaiting_payment"),
    markSavingsPaid: () => setSavingsStatus("paid"),
    saveBudgets,
    addPendingExpense,
    confirmExpense: (id) => setExpenseStatus(id, "confirmed"),
    cancelExpense: (id) => setExpenseStatus(id, "cancelled"),
    expireExpense: (id) => setExpenseStatus(id, "expired"),
    deleteExpense,
    loadDemoData,
  };

  // ThemeProvider sits inside AppProvider, so the whole app can read the light / dark theme
  return (
    <ThemeProvider>
      <AppContext.Provider value={value}>{children}</AppContext.Provider>
    </ThemeProvider>
  );
}

// ---------- The hook screens use ----------

export function useApp(): AppState {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used inside <AppProvider>");
  }
  return context;
}
