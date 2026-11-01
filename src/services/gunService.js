import { apiClient, IS_SUPABASE } from '../config/api'
import { cachedQuery, invalidateQueries } from '../utils/queryCache'

// ---------------------------------------------------------------------------
// Meta entries — the products table has no columns for a gallery or an
// archive flag, so both are stored as prefixed entries inside `specs`.
//   '__img:<url>'      → extra gallery image
//   '__archived:<iso>' → soft-deleted (archived) at the given time
// ---------------------------------------------------------------------------
const IMG_META = '__img:'
const ARCHIVED_META = '__archived:'

const isMeta = (s) =>
  typeof s === 'string' && (s.startsWith(IMG_META) || s.startsWith(ARCHIVED_META))

const buildSpecs = (specs, { images = [], imageUrl, archivedAt } = {}) => [
  ...specs.filter((s) => !isMeta(s)),
  ...images.filter((url) => url && url !== imageUrl).map((url) => `${IMG_META}${url}`),
  ...(archivedAt ? [`${ARCHIVED_META}${archivedAt}`] : []),
]

const specsFromData = (data) =>
  Array.isArray(data.ingredients)
    ? data.ingredients.map((i) => `${i.name}: ${i.quantity}`)
    : Array.isArray(data.specs)
    ? data.specs
    : undefined

// ---------------------------------------------------------------------------
// Normalizer — standardizes product shape whether received from Supabase
// (public.products) or from the university API (/api/v1/recipes).
// ---------------------------------------------------------------------------
export const normalizeProduct = (item) => {
  if (!item) return null

  // Resolve specifications from Supabase `specs` (text array) or API `ingredients`
  let specsList = []
  const rawSpecs = Array.isArray(item.specs) ? item.specs : null
  const extraImages = (rawSpecs || [])
    .filter((s) => typeof s === 'string' && s.startsWith(IMG_META))
    .map((s) => s.slice(IMG_META.length))
  const archivedEntry = (rawSpecs || []).find(
    (s) => typeof s === 'string' && s.startsWith(ARCHIVED_META),
  )
  if (rawSpecs) {
    specsList = rawSpecs.filter((s) => !isMeta(s)).map((s, idx) => {
      if (typeof s === 'string') {
        const colonIndex = s.indexOf(':')
        if (colonIndex > -1) {
          return {
            id: `spec-${idx}`,
            name: s.substring(0, colonIndex).trim(),
            quantity: s.substring(colonIndex + 1).trim(),
          }
        }
        return {
          id: `spec-${idx}`,
          name: 'Specification',
          quantity: s.trim(),
        }
      }
      return s
    })
  } else if (Array.isArray(item.ingredients)) {
    specsList = item.ingredients
  }

  // Resolve steps
  const stepsList =
    Array.isArray(item.steps) && item.steps.length > 0
      ? item.steps
      : ['Verify firearm is completely unloaded and point in safe direction.', 'Inspect receiver and mechanism for maintenance.']

  const mainImage = item.image_url || item.image || '/guns/pistol.svg'

  return {
    ...item,
    id: item.id,
    name: item.name || 'Hardware Piece',
    type: item.type || item.category || 'Hardware',
    category: item.type || item.category || 'Hardware',
    caliber: item.caliber || 'Standard',
    price: Number(item.price ?? item.cook_time ?? 0),
    description: item.description || '',
    image_url: item.image_url || item.image || '/guns/pistol.svg',
    image: item.image_url || item.image || '/guns/pistol.svg',
    images: [mainImage, ...extraImages.filter((url) => url !== mainImage)],
    archived_at: archivedEntry ? archivedEntry.slice(ARCHIVED_META.length) : null,
    ingredients: specsList,
    steps: stepsList,
  }
}

// ---------------------------------------------------------------------------
// GunService — wraps backend CRUD endpoints.
// Supports both Supabase PostgREST table (/rest/v1/products) and
// standard REST API (/api/v1/recipes).
// ---------------------------------------------------------------------------
class GunService {
  /**
   * Fetch a paginated, filterable list of products.
   */
  async getGuns(params = {}) {
    if (IS_SUPABASE) {
      const queryParts = ['select=*']

      if (params.search) {
        queryParts.push(`name=ilike.*${encodeURIComponent(params.search)}*`)
      }

      if (params.category && params.category !== 'All') {
        queryParts.push(`type=eq.${encodeURIComponent(params.category)}`)
      }

      if (params.sort_by) {
        const order = params.order === 'desc' ? 'desc' : 'asc'
        queryParts.push(`order=${encodeURIComponent(params.sort_by)}.${order}`)
      } else {
        queryParts.push('order=created_at.desc')
      }

      if (params.limit) {
        queryParts.push(`limit=${params.limit}`)
      }

      const queryString = queryParts.join('&')
      const data = await cachedQuery(`guns:list:${queryString}`, () =>
        apiClient.get(`/rest/v1/products?${queryString}`),
      )
      const all = Array.isArray(data) ? data.map(normalizeProduct) : []
      // Archived products are hidden unless explicitly requested.
      const list = params.archived
        ? all.filter((g) => g.archived_at)
        : params.includeArchived
        ? all
        : all.filter((g) => !g.archived_at)

      return {
        success: true,
        data: list,
        pagination: {
          total: list.length,
          page: params.page || 1,
          limit: params.limit || 50,
        },
      }
    }

    // Fallback: university REST API
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    )
    return apiClient.get('/api/v1/recipes', { params: clean })
  }

  /**
   * Fetch a single product by ID.
   */
  async getGunById(id) {
    if (IS_SUPABASE) {
      const data = await cachedQuery(`guns:item:${id}`, () =>
        apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`),
      )
      if (Array.isArray(data) && data.length > 0) {
        return { success: true, data: normalizeProduct(data[0]) }
      }
      throw new Error('Hardware item not found.')
    }
    return apiClient.get(`/api/v1/recipes/${id}`)
  }

  /**
   * Create a new product.
   */
  async createGun(data) {
    if (IS_SUPABASE) {
      const imageUrl = data.image_url || null
      const specsArray = buildSpecs(specsFromData(data) || [], {
        images: data.images || [],
        imageUrl,
      })

      const payload = {
        name: data.name,
        type: data.type || (data.category === 'minuman' ? 'Rifle' : 'Pistol'),
        caliber: data.caliber || '9mm',
        price: Number(data.price ?? data.cook_time ?? 0),
        description: data.description || '',
        specs: specsArray,
        image_url: imageUrl,
      }

      const res = await apiClient.post('/rest/v1/products', payload, {
        headers: { Prefer: 'return=representation' },
      })
      const created = Array.isArray(res) ? res[0] : res
      invalidateQueries('guns:')
      return { success: true, data: normalizeProduct(created) }
    }
    return apiClient.post('/api/v1/recipes', data)
  }

  /**
   * Update existing product.
   */
  async updateGun(id, data) {
    if (IS_SUPABASE) {
      let specsArray = specsFromData(data)
      const touchesMeta = data.images !== undefined || data.archived_at !== undefined
      if (specsArray !== undefined || touchesMeta) {
        // Rebuild specs, keeping whatever meta / specs the caller did not send.
        const raw = await apiClient.get(`/rest/v1/products?id=eq.${id}&select=*`)
        const current = normalizeProduct(Array.isArray(raw) ? raw[0] : raw) || {}
        const imageUrl = data.image_url ?? current.image_url
        specsArray = buildSpecs(specsArray ?? specsFromData(current) ?? [], {
          images: data.images ?? current.images ?? [],
          imageUrl,
          archivedAt:
            data.archived_at !== undefined ? data.archived_at : current.archived_at,
        })
      }

      const payload = {
        updated_at: new Date().toISOString(),
      }
      if (data.name !== undefined) payload.name = data.name
      if (data.type !== undefined) payload.type = data.type
      if (data.caliber !== undefined) payload.caliber = data.caliber
      if (data.price !== undefined || data.cook_time !== undefined) {
        payload.price = Number(data.price ?? data.cook_time ?? 0)
      }
      if (data.description !== undefined) payload.description = data.description
      if (specsArray !== undefined) payload.specs = specsArray
      if (data.image_url !== undefined) payload.image_url = data.image_url

      const res = await apiClient.patch(`/rest/v1/products?id=eq.${id}`, payload, {
        headers: { Prefer: 'return=representation' },
      })
      const updated = Array.isArray(res) ? res[0] : res
      invalidateQueries('guns:')
      return { success: true, data: normalizeProduct(updated) }
    }
    return apiClient.put(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Partial update (PATCH).
   */
  async patchGun(id, data) {
    if (IS_SUPABASE) {
      return this.updateGun(id, data)
    }
    return apiClient.patch(`/api/v1/recipes/${id}`, data)
  }

  /**
   * Soft delete — move a product to the archive (restorable).
   */
  async archiveGun(id) {
    return this.updateGun(id, { archived_at: new Date().toISOString() })
  }

  /**
   * Restore an archived product back into the catalog.
   */
  async restoreGun(id) {
    return this.updateGun(id, { archived_at: null })
  }

  /**
   * Permanently delete product.
   */
  async deleteGun(id) {
    if (IS_SUPABASE) {
      await apiClient.delete(`/rest/v1/products?id=eq.${id}`)
      invalidateQueries('guns:')
      return { success: true }
    }
    return apiClient.delete(`/api/v1/recipes/${id}`)
  }
}

export default new GunService()
