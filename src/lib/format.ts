// src/lib/format.ts
// Helpers for money, percentages and dates.
// Money is ALWAYS a whole number of RWF (no decimals). Format only when showing it.

// ---------- Money ----------

/** 3500 -> "3,500" */
export function formatNumber(amount: number): string {
  const whole = Math.round(amount);
  const sign = whole < 0 ? "-" : "";
  const digits = Math.abs(whole).toString();
  // Insert a comma before every group of 3 digits from the right
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 3500 -> "3,500 RWF" */
export function formatRWF(amount: number): string {
  return `${formatNumber(amount)} RWF`;
}

/**
 * Turns what the user typed into a whole number.
 * "3,500" -> 3500   "3 500" -> 3500   "abc" -> null   "" -> null
 * Anything that is not a digit is ignored, so decimals are never possible.
 */
export function parseAmount(input: string): number | null {
  const digitsOnly = input.replace(/\D/g, "");
  if (digitsOnly.length === 0) return null;
  // Cap at 12 digits so a mistyped number cannot overflow
  const value = Number(digitsOnly.slice(0, 12));
  return Number.isSafeInteger(value) ? value : null;
}

// ---------- Budget progress ----------

/** spent 41500 of limit 60000 -> 69 (percent, rounded). Not capped at 100. */
export function percentUsed(spent: number, limit: number): number {
  if (limit <= 0) return 0;
  return Math.round((spent / limit) * 100);
}

export type BudgetStatus = "ok" | "warning" | "over";

/** Rule BR8: warning from 80%, over from 100%. */
export function budgetStatus(percent: number): BudgetStatus {
  if (percent >= 100) return "over";
  if (percent >= 80) return "warning";
  return "ok";
}

// ---------- Dates ----------

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** Date -> "2026-11-10" using the phone's LOCAL date (not UTC). */
export function toISODate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Date -> "2026-11". This is the key a monthly plan is stored under. */
export function monthKey(date: Date = new Date()): string {
  return toISODate(date).slice(0, 7);
}

/** "2026-11" -> "November 2026" */
export function monthLabel(key: string = monthKey()): string {
  const [year, month] = key.split("-");
  const name = MONTH_NAMES[Number(month) - 1] ?? "";
  return `${name} ${year}`;
}

/** "2026-11" -> "November" (used in "Savings of X is locked for November") */
export function monthName(key: string = monthKey()): string {
  const month = Number(key.split("-")[1]);
  return MONTH_NAMES[month - 1] ?? "";
}

/** "2026-11-10" -> "10 Nov 2026" */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  const short = (MONTH_NAMES[Number(month) - 1] ?? "").slice(0, 3);
  return `${Number(day)} ${short} ${year}`;
}
