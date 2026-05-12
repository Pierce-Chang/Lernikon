/**
 * Theme catalogue.
 *
 * Each theme bundles a label, a recognisable PNG illustration (used both in
 * the theme picker UI and as a corner decoration on the PDF worksheets), and
 * a PDF accent colour. The assets live in `public/themes/*.png`.
 *
 * Free tier: only `weltraum` is selectable.
 * Family Pro: all themes unlocked. Paywall is enforced in:
 *   - `lib/themes/access.ts` (server-side guard)
 *   - the three theme-picker forms (show lock badge on gated entries)
 */

export type ThemeId = "weltraum" | "einhorn" | "pferde" | "autos";

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  /** Public path to the theme PNG (transparent background, ~600×600 square). */
  assetPath: string;
  /** Accent colour used on the PDF for theme-tinted UI moments. */
  accent: string;
  /** False = free tier; true = requires Family Pro. */
  pro: boolean;
}

export const THEMES: ReadonlyArray<Theme> = [
  {
    id: "weltraum",
    label: "Weltraum",
    emoji: "🚀",
    description: "Rakete, Sterne und Abenteuer im All",
    assetPath: "/themes/rakete_theme.png",
    accent: "#F4B942",
    pro: false,
  },
  {
    id: "einhorn",
    label: "Einhorn",
    emoji: "🦄",
    description: "Einhörner, Magie und Regenbogen",
    assetPath: "/themes/einhorn_theme.png",
    accent: "#F5A8C8",
    pro: true,
  },
  {
    id: "pferde",
    label: "Pferde",
    emoji: "🐴",
    description: "Pferde, Pony und Reiterhof",
    assetPath: "/themes/pferd_theme.png",
    accent: "#C19A6B",
    pro: true,
  },
  {
    id: "autos",
    label: "Autos",
    emoji: "🚗",
    description: "Sportwagen, Rennen und Motoren",
    assetPath: "/themes/auto_theme_rot.png",
    accent: "#E63946",
    pro: true,
  },
];

export const DEFAULT_THEME: ThemeId = "weltraum";

export const isThemeId = (value: string): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);

export const getTheme = (id: string): Theme => {
  const found = THEMES.find((theme) => theme.id === id);
  return found ?? THEMES[0];
};

export const isFreeTheme = (id: ThemeId): boolean => !getTheme(id).pro;
