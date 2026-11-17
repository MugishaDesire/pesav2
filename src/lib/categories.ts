// src/lib/categories.ts
// One place to get the category list, so every screen shows the same categories.
import * as mockData from "./mockData";

export type Category = { id: string; name: string; icon: string };

// Reads the first array in mockData whose items have id, name and icon.
// When the real categories come from the backend, replace the body of this function.
export function findCategories(): Category[] {
  for (const value of Object.values(mockData as Record<string, unknown>)) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        (v) =>
          v &&
          typeof v === "object" &&
          "id" in v &&
          "name" in v &&
          "icon" in v,
      )
    ) {
      return value as Category[];
    }
  }
  return [];
}

// "Other" is the category that lets the user type their own expense name
export function isOtherCategory(c: Category): boolean {
  return /^other/i.test(c.id) || /^other/i.test(c.name);
}
