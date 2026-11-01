import { useState } from 'react'
import { ArrowLeft, Save, Shield, Camera, Check } from 'lucide-react'
import userService from '../services/userService'

/**
 * EditProfilePage — edit callsign, bio, and avatar on a dedicated page.
 */
export default function EditProfilePage({ onBack, onSaved }) {
  const [profile] = useState(() => userService.getUserProfile())
  const [username, setUsername] = useState(profile.username || 'Shooter')
  const [bio, setBio] = useState(profile.bio || '')
  const [avatar, setAvatar] = useState(profile.avatar || null)
  const [feedback, setFeedback] = useState('')

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFeedback('Avatar image must be under 2MB.')
      setTimeout(() => setFeedback(''), 3000)
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => setAvatar(event.target.result)
    reader.readAsDataURL(file)
  }

  const handleSaveProfile = (e) => {
    e.preventDefault()
    const result = userService.saveUserProfile({
      ...profile,
      username: username.trim() || 'Shooter',
      bio: bio.trim(),
      avatar,
    })
    if (result.success) {
      onSaved?.()
    } else {
      setFeedback('Failed to save profile.')
    }
  }

  return (
    <div className="profile-page">
      <button type="button" className="detail-back" onClick={onBack}>
        <ArrowLeft size={18} /> Back to Profile
      </button>

      <section className="masthead">
        <h1 className="display">Edit Profile</h1>
        <p className="lede">Update your callsign, avatar, and armorer notes.</p>
      </section>

      {feedback && (
        <div className="toast toast--error">
          <Check size={18} /> {feedback}
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="profile-form">
        <div className="avatar-wrap">
          {avatar ? (
            <img src={avatar} alt={username} className="avatar-img" />
          ) : (
            <div className="avatar-placeholder">
              <Shield size={36} stroke="var(--brass)" />
            </div>
          )}
          <label htmlFor="avatar-file-input" className="avatar-upload-btn" title="Upload avatar">
            <Camera size={14} />
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden-file-input"
            />
          </label>
        </div>

        <div className="form-group">
          <label htmlFor="prof-name" className="form-label">
            Callsign / Operator Alias
          </label>
          <input
            id="prof-name"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. Operator Delta, Master Gunsmith"
            className="form-input"
          />
        </div>

        <div className="form-group">
          <label htmlFor="prof-bio" className="form-label">
            Armory Notes / Station Bio
          </label>
          <textarea
            id="prof-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Qualifications, preferred calibers, unit assignment..."
            rows={3}
            className="form-textarea"
          />
        </div>

        <button type="submit" className="btn btn--primary">
          <Save size={16} /> Save Profile
        </button>
      </form>
    </div>
  )
}
