import { useState, useEffect } from 'react'
import {
  readCart,
  addToCart,
  setCartQty,
  removeFromCart,
  clearCart,
  CART_CHANGE_EVENT,
} from '../utils/cartStorage'

// ---------------------------------------------------------------------------
// useCart — reactive view of the localStorage cart.
//
// Returns { items, count, total, add, setQty, remove, clear }.
// ---------------------------------------------------------------------------

export function useCart() {
  const [items, setItems] = useState(readCart)

  useEffect(() => {
    const sync = () => setItems(readCart())
    window.addEventListener(CART_CHANGE_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(CART_CHANGE_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const count = items.reduce((acc, i) => acc + i.qty, 0)
  const total = items.reduce((acc, i) => acc + i.qty * i.price, 0)

  return {
    items,
    count,
    total,
    add: addToCart,
    setQty: setCartQty,
    remove: removeFromCart,
    clear: clearCart,
  }
}
