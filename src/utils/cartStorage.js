// ---------------------------------------------------------------------------
// cartStorage.js — shopping cart persisted in localStorage.
//
// Items are stored as { id, name, price, image_url, type, caliber, qty }.
// Every change dispatches a `cart:change` event so all mounted useCart()
// hooks (header badge, cart page, detail page) stay in sync.
// ---------------------------------------------------------------------------

const CART_KEY = 'bore_barrel_cart'
const CHANGE_EVENT = 'cart:change'

export const readCart = () => {
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const writeCart = (items) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
  } catch {
    /* quota exceeded — silently fail */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return items
}

export const addToCart = (gun, qty = 1) => {
  const items = readCart()
  const idx = items.findIndex((i) => String(i.id) === String(gun.id))
  if (idx === -1) {
    items.push({
      id: gun.id,
      name: gun.name,
      price: Number(gun.price ?? gun.cook_time ?? 0),
      image_url: gun.image_url || gun.image || '/guns/pistol.svg',
      type: gun.type || gun.category || '',
      caliber: gun.caliber || '',
      qty,
    })
  } else {
    items[idx] = { ...items[idx], qty: items[idx].qty + qty }
  }
  return writeCart(items)
}

export const setCartQty = (id, qty) => {
  const items = readCart()
    .map((i) => (String(i.id) === String(id) ? { ...i, qty } : i))
    .filter((i) => i.qty > 0)
  return writeCart(items)
}

export const removeFromCart = (id) =>
  writeCart(readCart().filter((i) => String(i.id) !== String(id)))

export const clearCart = () => writeCart([])

export const CART_CHANGE_EVENT = CHANGE_EVENT
