import { useState } from 'react'
import {
  ArrowLeft,
  Star,
  Send,
  Loader,
  ShoppingCart,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import FavoriteButton from '../common/FavoriteButton'
import ShareButton from '../common/ShareButton'
import ImageGallery from './ImageGallery'
import { useReviews, useCreateReview } from '../../hooks/useReviews'
import { useCart } from '../../hooks/useCart'
import reviewService from '../../services/reviewService'
import { getUserIdentifier } from '../../services/userService'
import { readVotes, toggleVote } from '../../utils/reviewVotes'
import { formatPrice, averageRating } from '../../utils/helpers'

/**
 * Star picker used by both the new-review form and inline review editing.
 */
function StarPicker({ value, onChange, size = 22 }) {
  return (
    <div className="review-stars">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          className="star-btn"
          onClick={() => onChange(n)}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star
            size={size}
            fill={n <= value ? 'var(--brass)' : 'none'}
            stroke={n <= value ? 'var(--brass)' : 'var(--steel)'}
          />
        </button>
      ))}
    </div>
  )
}

/**
 * Full-screen product detail view.
 *
 * @param {Object}   props
 * @param {Object}   props.gun       — product data
 * @param {Function} props.onBack    — return to catalog
 * @param {Function} [props.onEdit]  — navigate to edit page
 * @param {Function} [props.onDelete]— trigger archive (soft delete) flow
 */
export default function GunDetail({ gun, onBack, onEdit, onDelete }) {
  const images = gun.images?.length ? gun.images : [gun.image_url || gun.image || '/guns/pistol.svg']
  const category = gun.type || gun.category || '—'
  const caliber = gun.caliber || gun.difficulty || ''
  const price = gun.price ?? gun.cook_time ?? 0
  const userId = getUserIdentifier()

  // Cart
  const { add: addToCart } = useCart()
  const [cartMsg, setCartMsg] = useState('')

  const handleAddToCart = () => {
    addToCart(gun)
    setCartMsg('Added to cart!')
    setTimeout(() => setCartMsg(''), 2000)
  }

  // Reviews
  const { reviews, loading: reviewsLoading, refetch: refetchReviews } = useReviews(gun.id)
  const { createReview, loading: submitting } = useCreateReview()
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [reviewError, setReviewError] = useState('')
  const [reviewSuccess, setReviewSuccess] = useState('')

  // Review editing / votes
  const [editingId, setEditingId] = useState(null)
  const [editRating, setEditRating] = useState(5)
  const [editComment, setEditComment] = useState('')
  const [savingReview, setSavingReview] = useState(false)
  const [votes, setVotes] = useState(readVotes)

  const avgRating = averageRating(reviews) || gun.average_rating || 0
  const reviewCount = reviews.length || gun.review_count || 0

  const handleSubmitReview = async (e) => {
    e.preventDefault()
    setReviewError('')
    setReviewSuccess('')

    if (rating < 1 || rating > 5) {
      setReviewError('Rating must be between 1 and 5.')
      return
    }

    const result = await createReview(gun.id, {
      user_identifier: userId,
      rating,
      comment: comment.trim(),
    })

    if (result) {
      setReviewSuccess('Review submitted!')
      setComment('')
      setRating(5)
      refetchReviews()
    } else {
      setReviewError('Could not submit review. The server may be unavailable.')
    }
  }

  const startEdit = (rev) => {
    setEditingId(rev.id)
    setEditRating(rev.rating)
    setEditComment(rev.comment || '')
  }

  const handleUpdateReview = async (reviewId) => {
    try {
      setSavingReview(true)
      setReviewError('')
      await reviewService.updateReview(reviewId, {
        rating: editRating,
        comment: editComment.trim(),
      })
      setEditingId(null)
      setReviewSuccess('Review updated!')
      refetchReviews()
    } catch (err) {
      setReviewError(err.message || 'Failed to update review.')
    } finally {
      setSavingReview(false)
    }
  }

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return
    try {
      setReviewError('')
      await reviewService.deleteReview(reviewId)
      setReviewSuccess('Review deleted.')
      refetchReviews()
    } catch (err) {
      setReviewError(err.message || 'Failed to delete review.')
    }
  }

  const handleVote = (reviewId, direction) => {
    setVotes({ ...toggleVote(reviewId, direction) })
  }

  return (
    <div className="detail">
      {/* Back button */}
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Catalog
      </button>

      {/* Hero */}
      <div className="detail-hero">
        <ImageGallery images={images} alt={gun.name} />
        <div className="detail-info">
          <h1 className="display">{gun.name}</h1>
          <p className="type">
            {category}
            {caliber ? ` · ${caliber}` : ''}
          </p>
          <p className="price detail-price">{formatPrice(price)}</p>

          {avgRating > 0 && (
            <p className="detail-rating">
              <Star size={16} fill="var(--brass)" stroke="var(--brass)" />
              {avgRating.toFixed(1)} ({reviewCount} review{reviewCount !== 1 ? 's' : ''})
            </p>
          )}

          <div className="detail-actions">
            <button type="button" className="btn btn--primary" onClick={handleAddToCart}>
              {cartMsg ? <Check size={16} /> : <ShoppingCart size={16} />}
              {cartMsg || 'Add to Cart'}
            </button>
            <FavoriteButton gunId={gun.id || gun.name} />
            <ShareButton gun={gun} />
            {onEdit && (
              <button type="button" className="btn btn--outline" onClick={() => onEdit(gun)}>
                Edit
              </button>
            )}
            {onDelete && (
              <button type="button" className="btn btn--danger" onClick={() => onDelete(gun)}>
                Archive
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="detail-section">
        <h2>Description</h2>
        <p>{gun.description || 'No description available.'}</p>
      </section>

      {/* Specifications (from ingredients / steps if present) */}
      {gun.ingredients && gun.ingredients.length > 0 && (
        <section className="detail-section">
          <h2>Specifications</h2>
          <ul className="detail-specs">
            {gun.ingredients.map((ing, i) => (
              <li key={ing.id || i}>
                <strong>{ing.name}</strong> — {ing.quantity}
              </li>
            ))}
          </ul>
        </section>
      )}

      {gun.steps && gun.steps.length > 0 && (
        <section className="detail-section">
          <h2>Assembly / Maintenance Steps</h2>
          <ol className="detail-steps">
            {gun.steps.map((step, i) => (
              <li key={step.id || i}>
                {step.instruction || step}
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* Reviews Section */}
      <section className="detail-section">
        <h2>Reviews</h2>

        {/* Submit review */}
        <form className="review-form" onSubmit={handleSubmitReview}>
          <StarPicker value={rating} onChange={setRating} />

          <textarea
            className="review-input"
            rows="3"
            placeholder="Write a short review (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={500}
          />

          <button
            type="submit"
            className="btn btn--primary"
            disabled={submitting || !gun.id}
          >
            {submitting ? (
              <><Loader size={16} className="spin" /> Submitting…</>
            ) : (
              <><Send size={16} /> Submit Review</>
            )}
          </button>

          {reviewError && <p className="form-error">{reviewError}</p>}
          {reviewSuccess && <p className="form-success">{reviewSuccess}</p>}
          {!gun.id && (
            <p className="form-hint">
              Reviews require a server-generated product ID. This product is local-only.
            </p>
          )}
        </form>

        {/* Existing reviews */}
        {reviewsLoading ? (
          <p className="detail-loading">Loading reviews…</p>
        ) : reviews.length > 0 ? (
          <ul className="review-list">
            {reviews.map((rev) => {
              const isMine = rev.user_id && String(rev.user_id) === String(userId)
              const myVote = votes[rev.id]
              return (
                <li key={rev.id} className="review-item">
                  <div className="review-head">
                    <span className="review-user">
                      {isMine ? 'You' : rev.user_identifier || 'Anonymous'}
                    </span>
                    {editingId !== rev.id && (
                      <span className="review-stars-display">
                        {Array.from({ length: 5 }, (_, i) => (
                          <Star
                            key={i}
                            size={14}
                            fill={i < rev.rating ? 'var(--brass)' : 'none'}
                            stroke={i < rev.rating ? 'var(--brass)' : 'var(--line)'}
                          />
                        ))}
                      </span>
                    )}
                  </div>

                  {editingId === rev.id ? (
                    <div className="review-edit">
                      <StarPicker value={editRating} onChange={setEditRating} size={18} />
                      <textarea
                        className="review-input"
                        rows="2"
                        value={editComment}
                        onChange={(e) => setEditComment(e.target.value)}
                        maxLength={500}
                      />
                      <div className="review-actions">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => handleUpdateReview(rev.id)}
                          disabled={savingReview}
                        >
                          <Check size={14} /> Save
                        </button>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X size={14} /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    rev.comment && <p className="review-comment">{rev.comment}</p>
                  )}

                  {editingId !== rev.id && (
                    <div className="review-actions">
                      <button
                        type="button"
                        className={myVote === 'up' ? 'vote-btn vote-btn--active' : 'vote-btn'}
                        onClick={() => handleVote(rev.id, 'up')}
                        aria-label="Thumbs up"
                        aria-pressed={myVote === 'up'}
                      >
                        <ThumbsUp size={14} /> {myVote === 'up' ? 1 : 0}
                      </button>
                      <button
                        type="button"
                        className={myVote === 'down' ? 'vote-btn vote-btn--active' : 'vote-btn'}
                        onClick={() => handleVote(rev.id, 'down')}
                        aria-label="Thumbs down"
                        aria-pressed={myVote === 'down'}
                      >
                        <ThumbsDown size={14} /> {myVote === 'down' ? 1 : 0}
                      </button>
                      {isMine && (
                        <>
                          <button
                            type="button"
                            className="vote-btn"
                            onClick={() => startEdit(rev)}
                          >
                            <Pencil size={14} /> Edit
                          </button>
                          <button
                            type="button"
                            className="vote-btn vote-btn--danger"
                            onClick={() => handleDeleteReview(rev.id)}
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="detail-empty">No reviews yet. Be the first!</p>
        )}
      </section>
    </div>
  )
}
