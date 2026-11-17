// src/lib/mockData.ts
// TEMPORARY: fake data so the screens can be built before the backend exists.
// The types below match the data model in the design document (section 8).
import { monthKey } from "./format";

// ---------- Types ----------

export type SavingsStatus = "unpaid" | "awaiting_payment" | "paid";
export type ExpenseStatus =
  | "pending_payment"
  | "confirmed"
  | "expired"
  | "cancelled";

export type Category = {
  id: string;
  name: string;
  icon: string; // an emoji, to keep the UI simple
  isDefault: boolean;
};

export type MonthlyPlan = {
  month: string; // "2026-11"
  availableAmount: number; // whole RWF
  savingsAmount: number; // whole RWF
  savingsStatus: SavingsStatus;
};

export type Budget = {
  categoryId: string;
  limitAmount: number; // whole RWF
};

export type Expense = {
  id: string;
  categoryId: string; // OTHER_ID when the user typed their own name
  customName?: string; // used only when categoryId is OTHER_ID
  amount: number; // whole RWF
  spentOn: string; // "2026-11-04"
  status: ExpenseStatus;
};

// ---------- Categories ----------

// "Other" is not stored as a normal category. Expenses use this id plus a custom name.
export const OTHER_ID = "other";

// PLACEHOLDER names. Replace them with the 8 categories from Pesa v1.
export const categories: Category[] = [
  { id: "food", name: "Food", icon: "🍲", isDefault: true },
  { id: "transport", name: "Transport", icon: "🚌", isDefault: true },
  { id: "rent", name: "Rent", icon: "🏠", isDefault: true },
  { id: "airtime", name: "Airtime & Data", icon: "📱", isDefault: true },
  { id: "health", name: "Health", icon: "💊", isDefault: true },
  { id: "education", name: "Education", icon: "📚", isDefault: true },
  { id: "entertainment", name: "Entertainment", icon: "🎬", isDefault: true },
  { id: "shopping", name: "Shopping", icon: "🛍️", isDefault: true },
];

// ---------- Fake data for the current month ----------

const month = monthKey();

export const mockPlan: MonthlyPlan = {
  month,
  availableAmount: 300000,
  savingsAmount: 50000,
  savingsStatus: "paid",
};

export const mockBudgets: Budget[] = [
  { categoryId: "food", limitAmount: 80000 },
  { categoryId: "transport", limitAmount: 30000 },
  { categoryId: "rent", limitAmount: 100000 },
  { categoryId: "airtime", limitAmount: 15000 },
  { categoryId: "health", limitAmount: 10000 },
];

export const mockExpenses: Expense[] = [
  {
    id: "e1",
    categoryId: "rent",
    amount: 100000,
    spentOn: `${month}-01`,
    status: "confirmed",
  },
  {
    id: "e2",
    categoryId: "food",
    amount: 3500,
    spentOn: `${month}-02`,
    status: "confirmed",
  },
  {
    id: "e3",
    categoryId: "food",
    amount: 12000,
    spentOn: `${month}-04`,
    status: "confirmed",
  },
  {
    id: "e4",
    categoryId: "transport",
    amount: 2000,
    spentOn: `${month}-05`,
    status: "confirmed",
  },
  {
    id: "e5",
    categoryId: "airtime",
    amount: 5000,
    spentOn: `${month}-06`,
    status: "confirmed",
  },
  {
    id: "e6",
    categoryId: OTHER_ID,
    customName: "Haircut",
    amount: 4000,
    spentOn: `${month}-07`,
    status: "confirmed",
  },
  // Not paid yet, so it must NOT be counted anywhere (rule BR5)
  {
    id: "e7",
    categoryId: "food",
    amount: 3000,
    spentOn: `${month}-09`,
    status: "pending_payment",
  },
];

// ---------- Helpers (the backend will do this later) ----------

/** Total spent per category. Only CONFIRMED expenses count (rule BR5). */
export function spentByCategory(expenses: Expense[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    if (e.status !== "confirmed") continue;
    totals[e.categoryId] = (totals[e.categoryId] ?? 0) + e.amount;
  }
  return totals;
}

/** Sum of all category budgets. */
export function totalBudgeted(budgets: Budget[]): number {
  return budgets.reduce((sum, b) => sum + b.limitAmount, 0);
}

/** "Left to allocate" = available - savings - budgets already set (rule BR3). */
export function leftToAllocate(plan: MonthlyPlan, budgets: Budget[]): number {
  return plan.availableAmount - plan.savingsAmount - totalBudgeted(budgets);
}

/** Finds a category by id. Returns undefined for OTHER_ID. */
export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

/** The text to show for an expense: "Food", or "Haircut" for an Other expense. */
export function expenseLabel(expense: Expense): string {
  if (expense.categoryId === OTHER_ID) return expense.customName || "Other";
  return getCategory(expense.categoryId)?.name ?? "Unknown";
}
