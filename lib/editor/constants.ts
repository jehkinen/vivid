export const HIGHLIGHT_COLORS = [
  '#fef3c7',
  '#d1fae5',
  '#dbeafe',
  '#fce7f3',
  '#e9d5ff',
  '#fef9c3',
  '#fed7aa',
  '#fecaca',
  '#bfdbfe',
  '#a5f3fc',
] as const

export function getContrastTextColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance < 0.5 ? '#ffffff' : '#1f2937'
}
