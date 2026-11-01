import { useState, useEffect, useRef } from 'react'

/**
 * Image that only starts downloading once it scrolls into view.
 *
 * Uses IntersectionObserver with a small margin so each image is requested
 * right before it becomes visible — scroll the catalog with DevTools →
 * Network → Img open to see images load one by one.
 *
 * Accepts the same props as <img>.
 */
export default function LazyImage({ src, alt, className = '', ...rest }) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      setInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin: '0px 0px 50px 0px', threshold: 0.01 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <img
      ref={ref}
      src={inView ? src : undefined}
      alt={alt}
      className={`lazy-img ${loaded ? 'lazy-img--loaded' : ''} ${className}`.trim()}
      onLoad={() => setLoaded(true)}
      decoding="async"
      {...rest}
    />
  )
}
