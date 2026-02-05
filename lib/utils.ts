import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  const month = date.toLocaleString('en-US', { month: 'short' })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day} ${year}`
}

export function formatDateRelative(dateString: string): string {
  const d = new Date(dateString)
  const now = Date.now()
  const then = d.getTime()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const other = new Date(d)
  other.setHours(0, 0, 0, 0)
  const diffDays = Math.floor((today.getTime() - other.getTime()) / (24 * 60 * 60 * 1000))
  if (diffDays === 0) {
    const diffMs = now - then
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`
  }
  return formatDate(dateString)
}

export function formatTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch',
  ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  і: 'i', ї: 'yi', є: 'ye', ґ: 'g',
  А: 'a', Б: 'b', В: 'v', Г: 'g', Д: 'd', Е: 'e', Ё: 'e', Ж: 'zh', З: 'z',
  И: 'i', Й: 'j', К: 'k', Л: 'l', М: 'm', Н: 'n', О: 'o', П: 'p', Р: 'r',
  С: 's', Т: 't', У: 'u', Ф: 'f', Х: 'h', Ц: 'ts', Ч: 'ch', Ш: 'sh', Щ: 'sch',
  Ъ: '', Ы: 'y', Ь: '', Э: 'e', Ю: 'yu', Я: 'ya',
  І: 'i', Ї: 'yi', Є: 'ye', Ґ: 'g',
}

function transliterateCyrillic(s: string): string {
  return s
    .split('')
    .map((c) => CYRILLIC_TO_LATIN[c] ?? c)
    .join('')
}

export function countWords(text: string | null | undefined): number {
  if (!text || typeof text !== 'string') return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

const WORDS_PER_MINUTE = 200

export function readingTimeMinutes(wordCount: number | null | undefined): number {
  if (wordCount == null || wordCount <= 0) return 1
  return Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
}

export function formatPostDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return ''
  const d = new Date(dateString)
  const day = d.getDate()
  const months = ['ЯНВ.', 'ФЕВ.', 'МАР.', 'АПР.', 'МАЙ', 'ИЮН.', 'ИЮЛ.', 'АВГ.', 'СЕН.', 'ОКТ.', 'НОЯ.', 'ДЕК.']
  const month = months[d.getMonth()]
  const year = d.getFullYear()
  return `${day} ${month} ${year} Г.`
}

export function slugify(s: string): string {
  const t = transliterateCyrillic(s)
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
  return t || 'tag'
}

export function sanitizeFilenameForS3(filename: string): { basename: string; ext: string } {
  const i = filename.lastIndexOf('.')
  const ext = i >= 0 ? filename.slice(i + 1).toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin' : 'bin'
  const base = i >= 0 ? filename.slice(0, i) : filename
  const basename = base
    .replace(/[^a-zA-Z0-9_-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'file'
  return { basename, ext }
}
