import { useState } from 'react'
import {
  Shield,
  Copy,
  Check,
  Heart,
  FileText,
  Play,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import userService from '../services/userService'
import { useFavorites } from '../hooks/useFavorites'
import {
  getAllDraftIds,
  loadDraft,
  deleteDraft,
  getDraftTimestamp,
  formatDraftTime,
} from '../utils/draftStorage'
import About from './About.jsx'
import Contact from './Contact.jsx'

/**
 * Read every saved product draft with its display name and timestamp.
 */
const readDrafts = () =>
  getAllDraftIds().map((id) => {
    const draft = loadDraft(id) || {}
    return {
      id,
      name: draft.formData?.name?.trim() || 'Untitled hardware',
      type: draft.formData?.type || '',
      isNew: id === 'create',
      savedAt: getDraftTimestamp(id),
    }
  })

/**
 * ProfilePage — operator identity, saved drafts, plus About and Contact.
 * Profile editing lives on its own page (EditProfilePage).
 */
export default function ProfilePage({ onReplaySplash, onEditProfile, onOpenDraft }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [copied, setCopied] = useState(false)
  const [drafts, setDrafts] = useState(readDrafts)

  const { favorites } = useFavorites()

  const handleCopyId = () => {
    if (profile.userId) {
      navigator.clipboard.writeText(profile.userId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDeleteDraft = (id) => {
    deleteDraft(id)
    setDrafts(readDrafts())
  }

  return (
    <div className="profile-page">
      <section className="masthead" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="display">Operator Profile</h1>
          <p className="lede">
            Operator credentials, saved drafts, and shop information.
          </p>
        </div>
        {onReplaySplash && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onReplaySplash}
            title="Replay introductory splash animation"
          >
            <Play size={14} /> Replay Intro
          </button>
        )}
      </section>

      {/* Operator Card */}
      <div className="profile-card">
        <div className="profile-card-top">
          <div className="avatar-wrap">
            {profile.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                <Shield size={36} stroke="var(--brass)" />
              </div>
            )}
          </div>

          <div className="profile-identity">
            <h2 className="display">{profile.username || 'Shooter'}</h2>
            {profile.bio && <p className="lede">{profile.bio}</p>}
            <div className="profile-id-row">
              <span className="mono-badge">{profile.userId}</span>
              <button
                type="button"
                className="icon-btn"
                onClick={handleCopyId}
                title="Copy User ID to clipboard"
              >
                {copied ? <Check size={14} color="var(--brass)" /> : <Copy size={14} />}
              </button>
            </div>
            {onEditProfile && (
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={onEditProfile}
                style={{ marginTop: '10px' }}
              >
                <Pencil size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="profile-stats">
          <div className="stat-item">
            <Heart size={20} className="stat-icon" stroke="var(--brass)" />
            <div className="stat-val">{favorites.length}</div>
            <div className="stat-label">Procurement Favorites</div>
          </div>
          <div className="stat-item">
            <FileText size={20} className="stat-icon" stroke="var(--steel)" />
            <div className="stat-val">{drafts.length}</div>
            <div className="stat-label">Saved Offline Drafts</div>
          </div>
        </div>
      </div>

      {/* Drafts */}
      <section className="profile-section">
        <h3 className="section-title">Drafts</h3>
        {drafts.length === 0 ? (
          <p className="detail-empty">No drafts saved. Drafts are auto-saved while you fill the Add / Edit form.</p>
        ) : (
          <ul className="draft-list">
            {drafts.map((d) => (
              <li key={d.id} className="draft-item">
                <div className="draft-info">
                  <span className="name display">{d.name}</span>
                  <span className="type">
                    {d.isNew ? 'New hardware' : `Edit #${d.id}`}
                    {d.type ? ` · ${d.type}` : ''}
                    {d.savedAt ? ` · ${formatDraftTime(d.savedAt)}` : ''}
                  </span>
                </div>
                <div className="draft-actions">
                  {onOpenDraft && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      onClick={() => onOpenDraft(d.id)}
                    >
                      Continue <ArrowRight size={14} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => handleDeleteDraft(d.id)}
                    aria-label={`Delete draft ${d.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* About & Contact (moved here from the top navigation) */}
      <section className="profile-section">
        <h3 className="section-title">About</h3>
        <About />
      </section>

      <section className="profile-section">
        <h3 className="section-title">Contact</h3>
        <Contact />
      </section>
    </div>
  )
}
