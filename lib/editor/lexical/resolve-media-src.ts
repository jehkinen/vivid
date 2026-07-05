export function resolveMediaSrc(
  mediaId: string | undefined | null,
  src: string,
  urlMap: Record<string, string | undefined>
): string {
  if (mediaId && urlMap[mediaId]) return urlMap[mediaId]!
  return src
}
