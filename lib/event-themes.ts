/**
 * Canonical event theme definitions for admin create/edit and participant display.
 */

export interface EventTheme {
  id: number
  name: string
  color: string
  accent: string
  textColor?: string
  border?: string
  gradientFrom: string
}

export interface ThemeDisplayStyle {
  bg: string
  border: string
  text: string
  gradient: string
}

export const THEME_WHITE_ID = 11
export const THEME_BLACK_ID = 9

/** Themes saved to the database via the admin event wizard. */
export const EVENT_THEMES: EventTheme[] = [
  { id: 1, name: 'HCDC', color: 'bg-gradient-to-br from-red-700 to-blue-900', accent: '#b91c1c', textColor: 'text-blue-900', border: 'border-blue-900', gradientFrom: 'from-red-700' },
  { id: 2, name: 'CCJE', color: 'bg-red-700', accent: '#b91c1c', textColor: 'text-red-700', border: 'border-red-700', gradientFrom: 'from-red-700' },
  { id: 3, name: 'CET', color: 'bg-orange-500', accent: '#f97316', textColor: 'text-orange-500', border: 'border-orange-500', gradientFrom: 'from-orange-500' },
  { id: 4, name: 'CHATME', color: 'bg-gray-500', accent: '#6b7280', textColor: 'text-gray-500', border: 'border-gray-500', gradientFrom: 'from-gray-500' },
  { id: 5, name: 'HUSOCOM', color: 'bg-fuchsia-700', accent: '#a21caf', textColor: 'text-fuchsia-700', border: 'border-fuchsia-700', gradientFrom: 'from-fuchsia-700' },
  { id: 6, name: 'COME', color: 'bg-sky-500', accent: '#0ea5e9', textColor: 'text-sky-500', border: 'border-sky-500', gradientFrom: 'from-sky-500' },
  { id: 7, name: 'SBME', color: 'bg-yellow-500', accent: '#eab308', textColor: 'text-yellow-600', border: 'border-yellow-500', gradientFrom: 'from-yellow-500' },
  { id: 8, name: 'STE', color: 'bg-blue-600', accent: '#2563eb', textColor: 'text-blue-600', border: 'border-blue-600', gradientFrom: 'from-blue-600' },
  { id: 9, name: 'Black', color: 'bg-black', accent: '#000000', textColor: 'text-white', border: 'border-black', gradientFrom: 'from-black' },
  { id: 11, name: 'White', color: 'bg-white', accent: '#ffffff', textColor: 'text-slate-900', border: 'border-slate-200', gradientFrom: 'from-slate-100' },
]

/** Maps legacy theme names stored in older events to canonical names. */
export const THEME_LEGACY_ALIASES: Record<string, string> = {
  'Professional Blue': 'HCDC',
  'Modern Red': 'CCJE',
  'Vibrant Orange': 'CET',
  'Elegant Gold': 'SBME',
  'Nature Green': 'STE',
  'Sleek Dark': 'Black',
  'Dark Red': 'Black',
  'Dark Blue': 'Black',
  'Tech Purple': 'HUSOCOM',
  'Vibrant Red': 'CCJE',
  'Forest Green': 'STE',
  'Ocean Teal': 'COME',
  'Sunset Orange': 'CET',
  'Midnight Navy': 'Black',
  'Rose Pink': 'HUSOCOM',
  'Gold Yellow': 'SBME',
  Indigo: 'STE',
}

export const CATEGORY_COLORS: Record<string, ThemeDisplayStyle> = {
  STE: { bg: 'bg-blue-600', text: 'text-blue-100', border: 'border-blue-400', gradient: 'from-blue-600 to-blue-900' },
  CET: { bg: 'bg-orange-600', text: 'text-orange-100', border: 'border-orange-400', gradient: 'from-orange-600 to-orange-900' },
  SBME: { bg: 'bg-yellow-500', text: 'text-yellow-50', border: 'border-yellow-400', gradient: 'from-yellow-500 to-yellow-800' },
  CHATME: { bg: 'bg-zinc-600', text: 'text-zinc-100', border: 'border-zinc-400', gradient: 'from-zinc-600 to-zinc-900' },
  HUSOCOM: { bg: 'bg-[#831843]', text: 'text-pink-100', border: 'border-pink-500', gradient: 'from-[#831843] to-[#500724]' },
  COME: { bg: 'bg-sky-600', text: 'text-sky-100', border: 'border-sky-400', gradient: 'from-sky-600 to-sky-900' },
  CCJE: { bg: 'bg-red-600', text: 'text-red-100', border: 'border-red-400', gradient: 'from-red-600 to-red-900' },
  HCDC: { bg: 'bg-gradient-to-r from-blue-700 to-red-600', text: 'text-white', border: 'border-blue-600', gradient: 'from-blue-900 via-blue-800 to-red-900' },
  Black: { bg: 'bg-black', text: 'text-white', border: 'border-zinc-700', gradient: 'from-zinc-900 to-black' },
  White: { bg: 'bg-white', text: 'text-slate-900', border: 'border-slate-200', gradient: 'from-slate-100 to-white' },
}

const THEME_DISPLAY_OVERRIDES: Record<string, ThemeDisplayStyle> = {
  HCDC: CATEGORY_COLORS.HCDC,
  CCJE: CATEGORY_COLORS.CCJE,
  CET: CATEGORY_COLORS.CET,
  CHATME: CATEGORY_COLORS.CHATME,
  HUSOCOM: CATEGORY_COLORS.HUSOCOM,
  COME: CATEGORY_COLORS.COME,
  SBME: CATEGORY_COLORS.SBME,
  STE: CATEGORY_COLORS.STE,
  Black: CATEGORY_COLORS.Black,
  White: CATEGORY_COLORS.White,
}

export function normalizeThemeName(name?: string | null): string {
  if (!name) return 'HCDC'
  const trimmed = name.trim()
  return THEME_LEGACY_ALIASES[trimmed] || trimmed
}

export function getEventThemeById(id?: number): EventTheme {
  if (!id) return EVENT_THEMES[0]
  return EVENT_THEMES.find((t) => t.id === id) || EVENT_THEMES[0]
}

export function getEventThemeByName(name?: string | null): EventTheme {
  const normalized = normalizeThemeName(name)
  return EVENT_THEMES.find((t) => t.name.toLowerCase() === normalized.toLowerCase()) || EVENT_THEMES[0]
}

export function getThemeDisplayStyle(themeName?: string | null): ThemeDisplayStyle {
  const normalized = normalizeThemeName(themeName)
  if (THEME_DISPLAY_OVERRIDES[normalized]) {
    return THEME_DISPLAY_OVERRIDES[normalized]
  }
  const theme = getEventThemeByName(normalized)
  return {
    bg: theme.color,
    text: theme.textColor || 'text-foreground',
    border: theme.border || 'border-border',
    gradient: theme.gradientFrom,
  }
}

export function getThemeColorClass(themeName?: string | null): string {
  return getThemeDisplayStyle(themeName).bg
}

export function isDarkCardTheme(themeId: number): boolean {
  return themeId === THEME_BLACK_ID
}

export function isLightCardTheme(themeId: number): boolean {
  return themeId === THEME_WHITE_ID
}
