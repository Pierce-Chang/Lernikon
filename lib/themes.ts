/**
 * Theme catalogue. MVP ships with a single theme ("weltraum");
 * the structure stays pluggable so Phase 2 can add Dinos, Einhörner, …
 */

export type ThemeId = "weltraum";

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
}

export const THEMES: ReadonlyArray<Theme> = [
  {
    id: "weltraum",
    label: "Weltraum",
    emoji: "🚀",
    description: "Planeten, Raketen, Sterne",
  },
];

export const DEFAULT_THEME: ThemeId = "weltraum";

export const isThemeId = (value: string): value is ThemeId =>
  THEMES.some((theme) => theme.id === value);

export const getTheme = (id: string): Theme => {
  const found = THEMES.find((theme) => theme.id === id);
  return found ?? THEMES[0];
};
