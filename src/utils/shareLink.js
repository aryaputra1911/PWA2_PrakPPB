// ---------------------------------------------------------------------------
// shareLink.js — unique, shareable URLs for a single product.
//
// A product link looks like  https://<domain>/?gun=<id>
// App reads the `gun` query param on load and opens that product directly.
// ---------------------------------------------------------------------------

const PARAM = 'gun'

export const buildGunLink = (id) => {
  const url = new URL(window.location.origin + window.location.pathname)
  url.searchParams.set(PARAM, id)
  return url.toString()
}

export const readGunIdFromUrl = () =>
  new URLSearchParams(window.location.search).get(PARAM)

/**
 * Reflect the open product in the address bar (or clear it).
 */
export const syncGunIdToUrl = (id) => {
  const url = new URL(window.location.href)
  if (id) url.searchParams.set(PARAM, id)
  else url.searchParams.delete(PARAM)
  window.history.replaceState(null, '', url)
}

/**
 * Share a product with the Web Share API, falling back to the clipboard.
 * @returns {Promise<'shared'|'copied'|'cancelled'>}
 */
export const shareGun = async (gun) => {
  const url = buildGunLink(gun.id)
  if (navigator.share) {
    try {
      await navigator.share({
        title: gun.name,
        text: `Check out ${gun.name} at Bore & Barrel`,
        url,
      })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled'
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
