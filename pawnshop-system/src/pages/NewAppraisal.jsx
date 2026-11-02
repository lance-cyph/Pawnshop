
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function NewAppraisal() {
 const { user } = useAuth()
  const navigate = useNavigate()

  const [categories, setCategories] = useState([])
  const [categoryId, setCategoryId] = useState('')
  const [description, setDescription] = useState('')
  const [appraisedValue, setAppraisedValue] = useState('')
  const [image, setImage] = useState(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    async function loadCategories() {
      const { data, error } = await supabase
        .from('item_categories')
        .select('category_id, item_type, standard_monthly_rate')
        .order('item_type')

      if (error) {
        setError(error.message)
      } else {
        setCategories(data || [])
      }
    }

    loadCategories()
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!user?.user_id) {
        setError('Your account information is not loaded. Please log in again.')
        return
    }

    if (!image) {
      setError('Please select an item photo.')
      return
    }

    if (!categoryId || !description.trim() || !appraisedValue) {
      setError('Please complete all required fields.')
      return
    }

    const value = Number(appraisedValue)

    if (!Number.isFinite(value) || value <= 0) {
      setError('Enter a valid appraised value greater than zero.')
      return
    }

    if (image.size > 5 * 1024 * 1024) {
      setError('Image must not exceed 5 MB.')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']

    if (!allowedTypes.includes(image.type)) {
      setError('Only JPG, PNG, and WebP images are allowed.')
      return
    }

    setLoading(true)

    try {
      const fileExt = image.name.split('.').pop().toLowerCase()
      const filePath = `${user.user_id}/${crypto.randomUUID()}.${fileExt}`

      // Upload item photo
      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, image, {
          contentType: image.type,
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Save appraisal record
      const { error: insertError } = await supabase
        .from('pawned_items')
        .insert({
          category_id: Number(categoryId),
          appraiser_id: user.user_id,
          description: description.trim(),
          appraised_value: value,
          item_image_url: filePath,
        })

      if (insertError) {
        // Remove uploaded photo if database insertion fails
        await supabase.storage
          .from('item-images')
          .remove([filePath])

        throw insertError
      }

      setSuccess('Appraisal saved successfully!')

      setTimeout(() => {
        navigate('/appraisals')
      }, 1200)

    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: 11,
    border: '1px solid #d1d5db',
    borderRadius: 6,
    boxSizing: 'border-box',
    marginTop: 6,
  }

  return (
    <div style={{ maxWidth: 700 }}>
      <h1>New Appraisal</h1>
      <p style={{ color: '#6b7280' }}>
        Enter the details of the item being appraised.
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#ffffff',
          padding: 24,
          borderRadius: 10,
          border: '1px solid #e5e7eb',
        }}
      >
        <label>Item Category *</label>
        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          style={inputStyle}
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option
              key={category.category_id}
              value={category.category_id}
            >
              {category.item_type} ({category.standard_monthly_rate}% monthly)
            </option>
          ))}
        </select>

        <label style={{ display: 'block', marginTop: 18 }}>
          Item Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the item, brand, model, condition, etc."
          rows={4}
          style={inputStyle}
          required
        />

        <label style={{ display: 'block', marginTop: 18 }}>
          Appraised Value (₱) *
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={appraisedValue}
          onChange={(e) => setAppraisedValue(e.target.value)}
          placeholder="Enter appraised value"
          style={inputStyle}
          required
        />

        <label style={{ display: 'block', marginTop: 18 }}>
          Item Photo *
        </label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setImage(e.target.files?.[0] || null)}
          style={{ ...inputStyle, border: 'none', paddingLeft: 0 }}
          required
        />

        {image && (
          <p style={{ color: '#6b7280', fontSize: 13 }}>
            Selected: {image.name}
          </p>
        )}

        {error && (
          <p style={{ color: '#dc2626' }}>{error}</p>
        )}

        {success && (
          <p style={{ color: '#16a34a' }}>{success}</p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#6e5bd0',
              color: '#ffffff',
              border: 'none',
              padding: '11px 20px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            {loading ? 'Saving...' : 'Save Appraisal'}
          </button>

          <button
            type="button"
            onClick={() => navigate('/appraisals')}
            style={{
              padding: '11px 20px',
              borderRadius: 6,
              border: '1px solid #d1d5db',
              background: '#ffffff',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
