// ---------------------------------------------------------------------------
// queryCache.js — tiny query cache for API reads.
//
// Each entry is kept in memory and mirrored to localStorage so cached data
// survives reloads and can be shown while offline.
//
//   cachedQuery(key, fetcher, { ttl })  → fresh cache hit or network fetch
//   peekQuery(key)                      → cached data (any age) or undefined
//   invalidateQueries(prefix)           → drop entries whose key starts with prefix
// ---------------------------------------------------------------------------

const STORAGE_PREFIX = 'bore_barrel_qc_'
const DEFAULT_TTL = 60 * 1000 // 1 minute

const memory = new Map()
const inflight = new Map()

const readEntry = (key) => {
  if (memory.has(key)) return memory.get(key)
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return undefined
    const entry = JSON.parse(raw)
    memory.set(key, entry)
    return entry
  } catch {
    return undefined
  }
}

const writeEntry = (key, data) => {
  const entry = { data, at: Date.now() }
  memory.set(key, entry)
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota exceeded — keep in memory only */
  }
}

/**
 * Return cached data when it is younger than `ttl`, otherwise fetch it.
 * Concurrent calls for the same key share one request. When the network
 * fails, stale cached data is returned instead of throwing.
 */
export const cachedQuery = async (key, fetcher, { ttl = DEFAULT_TTL } = {}) => {
  const entry = readEntry(key)
  if (entry && Date.now() - entry.at < ttl) return entry.data

  if (inflight.has(key)) return inflight.get(key)

  const request = (async () => {
    try {
      const data = await fetcher()
      writeEntry(key, data)
      return data
    } catch (err) {
      if (entry) return entry.data
      throw err
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, request)
  return request
}

/**
 * Read cached data without fetching (regardless of age).
 */
export const peekQuery = (key) => readEntry(key)?.data

/**
 * Remove every cache entry whose key starts with `prefix`.
 */
export const invalidateQueries = (prefix = '') => {
  for (const key of [...memory.keys()]) {
    if (key.startsWith(prefix)) memory.delete(key)
  }
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(STORAGE_PREFIX + prefix))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    /* storage unavailable */
  }
}
