import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Page navigation for paginated lists.
 *
 * @param {Object}   props
 * @param {number}   props.page        — current page (1-based)
 * @param {number}   props.totalPages
 * @param {Function} props.onChange    — called with the new page number
 */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav className="pagination" aria-label="Catalog pages">
      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((n) => (
        <button
          key={n}
          type="button"
          className={n === page ? 'page-btn page-btn--active' : 'page-btn'}
          onClick={() => onChange(n)}
          aria-current={n === page ? 'page' : undefined}
        >
          {n}
        </button>
      ))}

      <button
        type="button"
        className="page-btn"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </nav>
  )
}
