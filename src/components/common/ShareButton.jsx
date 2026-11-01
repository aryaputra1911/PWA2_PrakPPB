import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import { shareGun } from '../../utils/shareLink'

/**
 * Share a product through its unique link (?gun=<id>).
 * Uses the native share sheet when available, otherwise copies the link.
 */
export default function ShareButton({ gun }) {
  const [status, setStatus] = useState('')

  const handleShare = async () => {
    try {
      const result = await shareGun(gun)
      if (result === 'copied') setStatus('Link copied!')
      else if (result === 'shared') setStatus('Shared!')
    } catch {
      setStatus('Could not share link.')
    }
    setTimeout(() => setStatus(''), 2500)
  }

  return (
    <button
      type="button"
      className="btn btn--outline"
      onClick={handleShare}
      disabled={!gun.id || String(gun.id).startsWith('local-')}
      title="Share link to this piece"
    >
      {status ? <Check size={16} /> : <Share2 size={16} />}
      {status || 'Share'}
    </button>
  )
}
