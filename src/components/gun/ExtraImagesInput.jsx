import { useState } from 'react'
import { ImagePlus, X, Loader } from 'lucide-react'
import uploadService from '../../services/uploadService'

const PRESETS = ['/guns/pistol.svg', '/guns/rifle.svg', '/guns/shotgun.svg']

/**
 * Manage additional gallery images for a product.
 *
 * @param {Object}   props
 * @param {string[]} props.images    — extra image URLs (main image excluded)
 * @param {Function} props.onChange  — called with the new URL list
 */
export default function ExtraImagesInput({ images, onChange }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    if (files.length === 0) return
    try {
      setUploading(true)
      setError('')
      const urls = []
      for (const file of files) {
        const res = await uploadService.uploadImage(file)
        if (res?.data?.url) urls.push(res.data.url)
      }
      onChange([...images, ...urls])
    } catch (err) {
      setError(err.message || 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <fieldset className="form-fieldset">
      <div className="fieldset-header">
        <legend className="form-label">Gallery Images ({images.length})</legend>
      </div>

      {images.length > 0 && (
        <div className="gallery-edit">
          {images.map((src, i) => (
            <div key={`${src}-${i}`} className="gallery-edit-item">
              <img src={src} alt={`Gallery ${i + 1}`} />
              <button
                type="button"
                className="gallery-edit-remove"
                onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                aria-label={`Remove image ${i + 1}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="gallery-edit-actions">
        <label className="btn btn--outline btn--sm">
          {uploading ? <Loader size={14} className="spin" /> : <ImagePlus size={14} />}
          {uploading ? 'Uploading…' : 'Add images'}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            onChange={handleFiles}
            className="hidden-file-input"
            disabled={uploading}
          />
        </label>
        {PRESETS.map((src) => (
          <button
            key={src}
            type="button"
            className="pill"
            onClick={() => onChange([...images, src])}
          >
            + {src.split('/').pop().replace('.svg', '')}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
    </fieldset>
  )
}
