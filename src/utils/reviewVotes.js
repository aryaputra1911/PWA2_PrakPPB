// ---------------------------------------------------------------------------
// reviewVotes.js — thumbs up / thumbs down on reviews, stored per browser.
//
// The reviews table has no vote columns, so votes are kept in localStorage
// as { [reviewId]: 'up' | 'down' }.
// ---------------------------------------------------------------------------

const VOTES_KEY = 'bore_barrel_review_votes'

export const readVotes = () => {
  try {
    const raw = localStorage.getItem(VOTES_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/**
 * Toggle a vote. Voting the same direction twice removes the vote.
 * @returns {Object} the updated votes map
 */
export const toggleVote = (reviewId, direction) => {
  const votes = readVotes()
  if (votes[reviewId] === direction) {
    delete votes[reviewId]
  } else {
    votes[reviewId] = direction
  }
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes))
  } catch {
    /* quota exceeded — silently fail */
  }
  return votes
}
