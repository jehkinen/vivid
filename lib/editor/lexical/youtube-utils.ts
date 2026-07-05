export function extractYouTubeVideoId(urlOrId: string): string | null {
  const s = (urlOrId || '').trim()
  if (!s) return null
  if (/^[a-zA-Z0-9_-]{11}$/.test(s)) return s
  try {
    const u = new URL(s.startsWith('http') ? s : `https://${s}`)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      const m = u.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (m) return m[1]
      const vMatch = u.pathname.match(/^\/v\/([a-zA-Z0-9_-]{11})/)
      if (vMatch) return vMatch[1]
    }
  } catch {
    return null
  }
  return null
}
