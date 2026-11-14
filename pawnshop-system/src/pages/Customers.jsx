import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Customers() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  // Register modal state
  const [showRegister, setShowRegister] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [idFile, setIdFile] = useState(null)

  // Edit / View modal state
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editContact, setEditContact] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editIdUrl, setEditIdUrl] = useState('')
  const [editIdFile, setEditIdFile] = useState(null)

  useEffect(() => {
    loadCustomers()
  }, [])

  async function loadCustomers() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('customers')
      .select('*')
      .order('customer_id', { ascending: true })

    if (fetchError) {
      setError(fetchError.message)
    } else {
      setCustomers(data || [])
    }

    setLoading(false)
  }

  async function uploadIdImage(file) {
    const ext = file.name.split('.').pop()
    const fileName = `customer-ids/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('item-images')
      .upload(fileName, file)

    if (uploadError) {
      throw new Error(`ID Upload failed: ${uploadError.message}`)
    }

    const { data } = supabase.storage
      .from('item-images')
      .getPublicUrl(fileName)

    return data.publicUrl
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!idFile) {
      setError('Please upload a valid government ID image.')
      return
    }

    setSaving(true)

    try {
      const publicUrl = await uploadIdImage(idFile)

      const { error: insertError } = await supabase.from('customers').insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        contact_number: contactNumber.trim(),
        email: email.trim() || null,
        address: address.trim(),
        id_image_url: publicUrl,
        is_active: true,
      })

      if (insertError) throw new Error(insertError.message)

      setSuccess('Customer profile registered successfully.')
      setShowRegister(false)
      setFirstName('')
      setLastName('')
      setContactNumber('')
      setEmail('')
      setAddress('')
      setIdFile(null)
      await loadCustomers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function openEditModal(customer) {
    setSelectedCustomer(customer)
    setEditFirstName(customer.first_name || '')
    setEditLastName(customer.last_name || '')
    setEditContact(customer.contact_number || '')
    setEditEmail(customer.email || '')
    setEditAddress(customer.address || '')
    setEditIdUrl(customer.id_image_url || '')
    setEditIdFile(null)
    setError('')
    setSuccess('')
  }

  async function handleUpdateCustomer(e) {
    e.preventDefault()
    if (!selectedCustomer) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      let idImageUrl = editIdUrl
      if (editIdFile) {
        idImageUrl = await uploadIdImage(editIdFile)
      }

      const { error: updateError } = await supabase
        .from('customers')
        .update({
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          contact_number: editContact.trim(),
          email: editEmail.trim() || null,
          address: editAddress.trim(),
          id_image_url: idImageUrl,
        })
        .eq('customer_id', selectedCustomer.customer_id)

      if (updateError) throw new Error(updateError.message)

      setSuccess('Customer profile updated.')
      setSelectedCustomer(null)
      await loadCustomers()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(customer) {
    setError('')
    setSuccess('')

    const { error: statusError } = await supabase
      .from('customers')
      .update({ is_active: !customer.is_active })
      .eq('customer_id', customer.customer_id)

    if (statusError) {
      setError(statusError.message)
      return
    }

    setSuccess(
      `Customer ${customer.first_name} ${customer.last_name} is now ${
        !customer.is_active ? 'Active' : 'Inactive'
      }.`
    )
    await loadCustomers()
  }

  const filteredCustomers = customers.filter((c) => {
    const query = search.toLowerCase()
    const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
    return (
      fullName.includes(query) ||
      (c.contact_number || '').toLowerCase().includes(query) ||
      (c.customer_id || '').toLowerCase().includes(query)
    )
  })

  const activeCount = customers.filter((c) => c.is_active).length

  return (
    <div className="users-page">
      <div className="users-heading">
        <div>
          <h1>Customers</h1>
          <p>Register, view, update, and manage customer profiles.</p>
        </div>

        <button
          type="button"
          className="users-refresh"
          onClick={() => {
            setError('')
            setSuccess('')
            setShowRegister(true)
          }}
        >
          + Register Customer
        </button>
      </div>

      {error && <div className="users-error">{error}</div>}
      {success && <div className="users-success">{success}</div>}

      <div className="users-summary">
        <div className="users-summary-card">
          <span>Total Customers</span>
          <strong>{loading ? '...' : customers.length}</strong>
        </div>

        <div className="users-summary-card">
          <span>Active Profiles</span>
          <strong>{loading ? '...' : activeCount}</strong>
        </div>

        <div className="users-summary-card">
          <span>Inactive Profiles</span>
          <strong>{loading ? '...' : customers.length - activeCount}</strong>
        </div>
      </div>

      <div className="users-table-card">
        <div className="users-table-heading">
          <h2>Customer Records</h2>
          <input
            type="text"
            placeholder="Search by name, ID, or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="users-message">Loading customers...</p>
        ) : filteredCustomers.length === 0 ? (
          <p className="users-message">No customer records found.</p>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Customer ID</th>
                  <th>Full Name</th>
                  <th>Contact Number</th>
                  <th>Address</th>
                  <th>Valid ID</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredCustomers.map((customer) => (
                  <tr key={customer.customer_id}>
                  <td>
                      <strong>
                        {customer.customer_id.startsWith('22222222')
                          ? `CUST-${customer.customer_id.slice(-4).toUpperCase()}`
                          : `CUST-${customer.customer_id.slice(0, 6).toUpperCase()}`}
                      </strong>
                    </td>
                    <td>
                      {customer.first_name} {customer.last_name}
                    </td>
                    <td>{customer.contact_number}</td>
                    <td>{customer.address}</td>
                    <td>
                      {customer.id_image_url ? (
                        <a
                          href={customer.id_image_url}
                          target="_blank"
                          rel="noreferrer"
                          className="users-role"
                          style={{ textDecoration: 'none' }}
                        >
                          View ID
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          customer.is_active
                            ? 'users-status active'
                            : 'users-status inactive'
                        }
                      >
                        {customer.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="users-actions">
                        <button
                          type="button"
                          className="users-edit-button"
                          onClick={() => openEditModal(customer)}
                        >
                          View / Edit
                        </button>
                        <button
                          type="button"
                          className="users-save-button"
                          onClick={() => handleToggleStatus(customer)}
                        >
                          {customer.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <h2>Register New Customer</h2>
            <p>Enter complete personal, contact, and valid ID information.</p>

            <form onSubmit={handleRegister}>
              <label>First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />

              <label>Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />

              <label>Contact Number</label>
              <input
                type="text"
                required
                placeholder="e.g. 09171234567"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
              />

              <label>Email (Optional)</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label>Address</label>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />

              <label>Valid ID Image</label>
              <input
                type="file"
                accept="image/*"
                required
                onChange={(e) => setIdFile(e.target.files?.[0] || null)}
              />

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={() => setShowRegister(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="users-save-button"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View / Edit Modal */}
      {selectedCustomer && (
        <div className="users-modal-overlay">
          <div className="users-modal">
            <h2>Customer Profile</h2>
            <p>
              Unique Customer ID:{' '}
              <strong>{selectedCustomer.customer_id}</strong>
            </p>

            <form onSubmit={handleUpdateCustomer}>
              <label>First Name</label>
              <input
                type="text"
                required
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />

              <label>Last Name</label>
              <input
                type="text"
                required
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />

              <label>Contact Number</label>
              <input
                type="text"
                required
                value={editContact}
                onChange={(e) => setEditContact(e.target.value)}
              />

              <label>Email</label>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />

              <label>Address</label>
              <input
                type="text"
                required
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
              />

              <label>Replace Valid ID Image (Optional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setEditIdFile(e.target.files?.[0] || null)}
              />

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={() => setSelectedCustomer(null)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="users-save-button"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}