import { budgetStatus, percentUsed } from "./format";
import { Budget, getCategory, MonthlyPlan } from "./mockData";

export type ReportStatus = "ok" | "warning" | "over";

export type ReportRow = {
  id: string;
  name: string;
  icon: string;
  limit: number;
  used: number;
  percent: number;
  status: ReportStatus;
};

export type Report = {
  month: string; // "2026-11"
  available: number;
  savings: number;
  spendable: number; // available - savings
  budgeted: number;
  spent: number;
  left: number; // spendable - spent (negative = overspent)
  rows: ReportRow[]; // most used first
  unbudgeted: number; // spent in categories that have no budget
};

export function buildReport(
  plan: MonthlyPlan,
  budgets: Budget[],
  spentByCategory: Record<string, number>,
): Report {
  const spent = Object.values(spentByCategory).reduce((sum, n) => sum + n, 0);
  const spendable = plan.availableAmount - plan.savingsAmount;

  const rows: ReportRow[] = budgets
    .map((b) => {
      const cat = getCategory(b.categoryId);
      const used = spentByCategory[b.categoryId] ?? 0;
      const percent = percentUsed(used, b.limitAmount);
      return {
        id: b.categoryId,
        name: cat?.name ?? "Category",
        icon: cat?.icon ?? "•",
        limit: b.limitAmount,
        used,
        percent,
        status: budgetStatus(percent),
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const budgetedIds = new Set(budgets.map((b) => b.categoryId));
  const unbudgeted = Object.entries(spentByCategory)
    .filter(([id]) => !budgetedIds.has(id))
    .reduce((sum, [, n]) => sum + n, 0);

  return {
    month: plan.month,
    available: plan.availableAmount,
    savings: plan.savingsAmount,
    spendable,
    budgeted: budgets.reduce((sum, b) => sum + b.limitAmount, 0),
    spent,
    left: spendable - spent,
    rows,
    unbudgeted,
  };
}

export function statusLabel(status: ReportStatus): string {
  if (status === "over") return "Over budget";
  if (status === "warning") return "Almost at limit";
  return "On track";
}

function cell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The text of the downloaded file: a short summary, then one line per category. */
export function reportToCSV(report: Report, monthTitle: string): string {
  const lines: (string | number)[][] = [
    ["PESA Monthly Report", monthTitle],
    [],
    ["Available (RWF)", report.available],
    ["Savings (RWF)", report.savings],
    ["Spendable after savings (RWF)", report.spendable],
    ["Budgeted (RWF)", report.budgeted],
    ["Spent (RWF)", report.spent],
    [report.left < 0 ? "Overspent by (RWF)" : "Left to spend (RWF)", Math.abs(report.left)],
    [],
    ["Category", "Budget (RWF)", "Spent (RWF)", "Used (%)", "Status"],
    ...report.rows.map((r) => [
      r.name,
      r.limit,
      r.used,
      r.percent,
      statusLabel(r.status),
    ]),
  ];
  if (report.unbudgeted > 0) {
    lines.push(["No budget", "", report.unbudgeted, "", ""]);
  }
  return lines.map((l) => l.map(cell).join(",")).join("\r\n");
}
