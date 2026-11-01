import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import LazyImage from '../common/LazyImage'
import { addToCart } from '../../utils/cartStorage'
import { formatPrice, truncate } from '../../utils/helpers'

/**
 * Product card used in the catalog grid.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onSelect  — called with the gun when clicked
 * @param {Function} [props.onEdit]  — called when Edit is clicked (admin)
 * @param {Function} [props.onDelete]— called when Archive is clicked (admin)
 */
export default function GunCard({ gun, onSelect, onEdit, onDelete }) {
  const [added, setAdded] = useState(false)
  const imgSrc = gun.image_url || gun.image || '/guns/pistol.svg'
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0

  return (
    <li className="card">
      <button
        type="button"
        className="card-btn"
        onClick={() => onSelect(gun)}
        aria-label={`View ${gun.name}`}
      >
        <LazyImage
          className="card-img"
          src={imgSrc}
          alt={gun.name}
          width="240"
          height="180"
        />

        <span className="name display">{gun.name}</span>

        <span className="type">
          {category}
          {caliber ? ` · ${caliber}` : ''}
        </span>

        {gun.description && (
          <span className="card-desc">{truncate(gun.description, 72)}</span>
        )}

        <span className="price">{formatPrice(price)}</span>
      </button>

      {/* Floating actions row */}
      <div className="card-actions">
        <FavoriteButton gunId={gun.id || gun.name} />

        <button
          type="button"
          className="card-act-btn"
          onClick={(e) => {
            e.stopPropagation()
            addToCart(gun)
            setAdded(true)
            setTimeout(() => setAdded(false), 1500)
          }}
          aria-label={`Add ${gun.name} to cart`}
          title="Add to cart"
        >
          {added ? <Check size={16} /> : <ShoppingCart size={16} />}
        </button>

        {onEdit && (
          <button
            type="button"
            className="card-act-btn"
            onClick={(e) => { e.stopPropagation(); onEdit(gun) }}
            aria-label={`Edit ${gun.name}`}
            title="Edit"
          >
            ✏️
          </button>
        )}

        {onDelete && (
          <button
            type="button"
            className="card-act-btn card-act-btn--danger"
            onClick={(e) => { e.stopPropagation(); onDelete(gun) }}
            aria-label={`Archive ${gun.name}`}
            title="Archive"
          >
            🗑️
          </button>
        )}
      </div>
    </li>
  )
}
