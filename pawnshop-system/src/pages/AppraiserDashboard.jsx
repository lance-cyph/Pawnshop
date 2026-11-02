import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'


function peso(n) {
  return '₱' + Number(n).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function AppraiserDashboard() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadItems() {
      if (!user?.user_id) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('pawned_items')
        .select('item_id, description, appraised_value, item_status, created_at, item_image_url, item_categories(item_type)')
        .eq('appraiser_id', user.user_id)
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
      } else {
        const itemsWithImages = await Promise.all(
          (data || []).map(async (item) => {
            const { data: imageData, error: imageError } = await supabase.storage
              .from('item-images')
              .createSignedUrl(item.item_image_url, 3600)

            return {
              ...item,
              imageUrl: imageError ? null : imageData.signedUrl,
            }
          })
        )

        setItems(itemsWithImages)
      }

      setLoading(false)
    }

    loadItems()
  }, [user?.user_id])

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const todayItems = items.filter((i) => new Date(i.created_at) >= startOfToday)
  const todayValue = todayItems.reduce((sum, i) => sum + Number(i.appraised_value), 0)
  const recent = items.slice(0, 10)

  const card = { background: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8, padding: 16, flex: '1 1 200px' }
  const cell = { padding: 10, borderBottom: '1px solid #e5e7eb', textAlign: 'left' }

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Welcome, {user.full_name}</h1>
      <p style={{ marginTop: 0, color: '#4b5563' }}>Appraiser dashboard</p>

      <Link
        to="/new-appraisal"
        style={{ display: 'inline-block', margin: '8px 0 20px', padding: '10px 18px', background: '#1d4ed8', color: '#ffffff', borderRadius: 6, textDecoration: 'none' }}
      >
        New appraisal
      </Link>

      {error && <p style={{ color: '#b91c1c' }}>Could not load items: {error}</p>}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <div style={card}>
          <div style={{ color: '#4b5563', fontSize: 14 }}>Items appraised today</div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{todayItems.length}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#4b5563', fontSize: 14 }}>Value appraised today</div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{peso(todayValue)}</div>
        </div>
        <div style={card}>
          <div style={{ color: '#4b5563', fontSize: 14 }}>All items you appraised</div>
          <div style={{ fontSize: 28, fontWeight: 'bold' }}>{items.length}</div>
        </div>
      </div>

      <h2>My recent appraisals</h2>

      {loading ? (
        <p>Loading...</p>
      ) : recent.length === 0 ? (
        <p>No appraisals yet. Click New appraisal to add your first item.</p>
      ) : (
        <table style={{ background: '#ffffff', borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={cell}>Photo</th>
              <th style={cell}>Item</th>
              <th style={cell}>Type</th>
              <th style={cell}>Appraised value</th>
              <th style={cell}>Status</th>
              <th style={cell}>Date</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((i) => (
              <tr key={i.item_id}>
                <td style={cell}>
                  {i.imageUrl ? (
                    <img
                      src={i.imageUrl}
                      alt={i.description}
                      style={{
                        width: 65,
                        height: 65,
                        objectFit: 'cover',
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    'No image'
                  )}
                </td>
                <td style={cell}>{i.description}</td>
                <td style={cell}>{i.item_categories?.item_type}</td>
                <td style={cell}>{peso(i.appraised_value)}</td>
                <td style={cell}>{i.item_status}</td>
                <td style={cell}>{new Date(i.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}