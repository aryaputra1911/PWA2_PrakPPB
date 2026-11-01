import { useState } from 'react'

/**
 * Product image gallery — main image plus a clickable thumbnail strip.
 *
 * @param {Object}   props
 * @param {string[]} props.images
 * @param {string}   props.alt
 */
export default function ImageGallery({ images, alt }) {
  const [active, setActive] = useState(0)
  const current = images[active] || images[0]

  return (
    <div className="gallery">
      <img className="detail-img" src={current} alt={alt} loading="lazy" />
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              className={i === active ? 'gallery-thumb gallery-thumb--active' : 'gallery-thumb'}
              onClick={() => setActive(i)}
              aria-label={`Show image ${i + 1}`}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
