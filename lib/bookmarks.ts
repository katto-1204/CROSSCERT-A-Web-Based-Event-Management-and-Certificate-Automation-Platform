import { api, apiCall } from '@/lib/api-config'

const BOOKMARK_CACHE_KEY = 'bookmarkedEvents'

function normalizeId(id: string | number): string {
  return String(id)
}

function bookmarksBaseUrl(): string {
  const url = api.bookmarks()
  return url.endsWith('/') ? url.slice(0, -1) : url
}

/** Read cached bookmark IDs (offline / optimistic UI). */
export function getCachedBookmarkIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(BOOKMARK_CACHE_KEY)
    if (!raw) return new Set()
    const arr = JSON.parse(raw) as (string | number)[]
    return new Set(arr.map(normalizeId))
  } catch {
    return new Set()
  }
}

function cacheBookmarkIds(ids: Iterable<string | number>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(BOOKMARK_CACHE_KEY, JSON.stringify(Array.from(ids).map(normalizeId)))
}

/** Fetch bookmark IDs from the server and refresh local cache. */
export async function fetchBookmarkIds(): Promise<Set<string>> {
  try {
    const res = await apiCall.get(`${bookmarksBaseUrl()}/ids/`)
    if (!res.ok) return getCachedBookmarkIds()

    const data = await res.json()
    const ids = (data.event_ids || []).map(normalizeId)
    const set = new Set<string>(ids)
    cacheBookmarkIds(set)
    return set
  } catch {
    return getCachedBookmarkIds()
  }
}

/** Toggle bookmark on the server; returns new bookmarked state. */
export async function toggleBookmark(eventId: string | number): Promise<boolean> {
  const id = normalizeId(eventId)
  const res = await apiCall.post(`${bookmarksBaseUrl()}/toggle/`, { event_id: Number(id) })

  if (!res.ok) {
    throw new Error('Could not update bookmark')
  }

  const data = await res.json()
  const cached = getCachedBookmarkIds()
  if (data.bookmarked) {
    cached.add(id)
  } else {
    cached.delete(id)
  }
  cacheBookmarkIds(cached)
  return Boolean(data.bookmarked)
}

/** One-time migration: push local bookmarks to server when user signs in. */
export async function migrateLocalBookmarksToServer(): Promise<void> {
  const local = getCachedBookmarkIds()
  if (local.size === 0) return

  try {
    const server = await fetchBookmarkIds()
    for (const id of local) {
      if (!server.has(id)) {
        await apiCall.post(`${bookmarksBaseUrl()}/toggle/`, { event_id: Number(id) })
      }
    }
    await fetchBookmarkIds()
  } catch {
    // Keep local cache if migration fails
  }
}
