import { ShoppingCart, Minus, Plus, Trash2, MessageCircle, ArrowRight } from 'lucide-react'
import { useCart } from '../hooks/useCart'
import LazyImage from '../components/common/LazyImage'
import { WHATSAPP_NUMBER } from '../config/shop'
import { formatPrice } from '../utils/helpers'

/**
 * Build the WhatsApp order message for the current cart.
 */
const buildOrderMessage = (items, total) => {
  const lines = items.map(
    (item, i) => `${i + 1}. ${item.name} x${item.qty} — ${formatPrice(item.price * item.qty)}`,
  )
  return [
    'Hi aku mau pesan ....',
    '',
    ...lines,
    '',
    `Total: ${formatPrice(total)}`,
  ].join('\n')
}

/**
 * CartPage — review cart items and check out through WhatsApp.
 */
export default function CartPage({ onNavigateCatalog }) {
  const { items, count, total, setQty, remove, clear } = useCart()

  const handleCheckout = () => {
    const text = encodeURIComponent(buildOrderMessage(items, total))
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`
    window.open(url, '_blank', 'noopener')
  }

  return (
    <div className="cart-page">
      <section className="masthead">
        <h1 className="display">Procurement Cart</h1>
        <p className="lede">
          Review your order, then check out — the order is sent to us on WhatsApp.
        </p>
      </section>

      <section>
        <div className="list-head">
          <h2>Cart</h2>
          <div className="list-head-right">
            <span className="count">
              {count} item{count !== 1 ? 's' : ''}
            </span>
            {items.length > 0 && (
              <button type="button" className="btn btn--danger-ghost btn--sm" onClick={clear}>
                Clear
              </button>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="state-box">
            <ShoppingCart size={36} stroke="var(--steel)" />
            <h3>Your cart is empty</h3>
            {onNavigateCatalog && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={onNavigateCatalog}
                style={{ marginTop: '16px' }}
              >
                Browse Catalog <ArrowRight size={16} />
              </button>
            )}
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {items.map((item) => (
                <li key={item.id} className="cart-item">
                  <LazyImage className="cart-img" src={item.image_url} alt={item.name} />
                  <div className="cart-info">
                    <span className="name display">{item.name}</span>
                    <span className="type">
                      {item.type}
                      {item.caliber ? ` · ${item.caliber}` : ''}
                    </span>
                    <span className="price">{formatPrice(item.price)}</span>
                  </div>
                  <div className="cart-qty">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setQty(item.id, item.qty - 1)}
                      aria-label={`Decrease ${item.name}`}
                    >
                      <Minus size={14} />
                    </button>
                    <span className="cart-qty-val">{item.qty}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setQty(item.id, item.qty + 1)}
                      aria-label={`Increase ${item.name}`}
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => remove(item.id)}
                      aria-label={`Remove ${item.name}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="cart-summary">
              <div>
                <span className="stat-label">Total</span>
                <div className="price detail-price">{formatPrice(total)}</div>
              </div>
              <button type="button" className="btn btn--primary" onClick={handleCheckout}>
                <MessageCircle size={16} /> Checkout via WhatsApp
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
