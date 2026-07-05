const TTL_MS = 60_000

let cache: { ids: Set<string>; expiresAt: number } | null = null

export function invalidateUsedMediaIdsCache() {
  cache = null
}

export async function getCachedUsedMediaIds(
  load: () => Promise<string[]>
): Promise<Set<string>> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.ids
  }
  const ids = await load()
  cache = {
    ids: new Set(ids),
    expiresAt: Date.now() + TTL_MS,
  }
  return cache.ids
}
