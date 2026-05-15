/**
 * Helpers used exclusively on the Dashboard page.
 * Kept separate from grade.ts to avoid pulling in dashboard-only data
 * into every module that needs formatGrade.
 */

/**
 * Returns a time-of-day greeting addressed to the parent (no name) since
 * the Dashboard is a parent-workflow surface, not a kid-facing screen.
 * The active child appears as context in the sub-line, not as the addressee.
 */
export const greetingForHour = (hour: number): string => {
  if (hour >= 5 && hour < 12) return "Guten Morgen.";
  if (hour >= 12 && hour < 18) return "Hallo.";
  return "Guten Abend.";
};

const THEME_LABELS: Record<string, string> = {
  weltraum: "Weltraum",
  einhorn: "Einhorn",
  pferde: "Pferde",
  autos: "Autos",
};

/**
 * German genitive form of a first name. Names ending in s/x/z/ß take a
 * trailing apostrophe (Lukas'), everything else takes a trailing s (Linas).
 */
export const childGenitive = (name: string): string => {
  if (/[sxzß]$/i.test(name)) return `${name}'`;
  return `${name}s`;
};

/**
 * Builds the metadata sub-line shown below the greeting.
 * Format: "Für {childName}, {grade} · {theme} · {quota}".
 */
export const dashboardSubLine = (
  childName: string,
  gradeShort: string,
  themeId: string,
  quotaLine: string | null,
): string => {
  const parts = [`Für ${childName}, ${gradeShort}`, THEME_LABELS[themeId] ?? themeId];
  if (quotaLine) parts.push(quotaLine);
  return parts.join(" · ");
};
