
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Users() {
  const { user: currentUser } = useAuth()

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  // Edit Staff states
  const [editingUser, setEditingUser] = useState(null)
  const [editFullName, setEditFullName] = useState('')
  const [editRole, setEditRole] = useState('Cashier')

  // Load staff accounts
  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, username, full_name, role, is_active, created_at')
        .order('created_at', { ascending: false })

      if (error) {
        setError(error.message)
        setUsers([])
      } else {
        setUsers(data || [])
      }
    } catch (err) {
      setError(err.message || 'Unable to load staff accounts.')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // Activate or deactivate a staff account
  async function toggleAccountStatus(staff) {
    if (staff.user_id === currentUser?.user_id) {
      setError('You cannot deactivate your own account.')
      return
    }

    const newStatus = !staff.is_active
    const action = newStatus ? 'activate' : 'deactivate'

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${staff.username}'s account?`
    )

    if (!confirmed) return

    setUpdatingId(staff.user_id)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ is_active: newStatus })
        .eq('user_id', staff.user_id)
        .select('user_id')

      if (error) {
        setError(error.message)
      } else if (!data || data.length === 0) {
        setError('The account status was not changed. Check your permissions.')
      } else {
        setSuccess(
          `${staff.username}'s account has been ${
            newStatus ? 'activated' : 'deactivated'
          }.`
        )

        await loadUsers()
      }
    } catch (err) {
      setError(err.message || 'Unable to update account status.')
    } finally {
      setUpdatingId(null)
    }
  }

  // Open Edit Staff form
  function openEditForm(staff) {
    if (staff.user_id === currentUser?.user_id) {
      setError('You cannot edit your own Administrator account here.')
      return
    }

    setEditingUser(staff)
    setEditFullName(staff.full_name || '')
    setEditRole(staff.role)
    setError('')
    setSuccess('')
  }

  // Close Edit Staff form
  function closeEditForm() {
    setEditingUser(null)
    setEditFullName('')
    setEditRole('Cashier')
  }

  // Save staff information
  async function saveStaffChanges(event) {
    event.preventDefault()

    if (!editingUser) return

    if (editingUser.user_id === currentUser?.user_id) {
      setError('You cannot edit your own Administrator account.')
      return
    }

    if (!editFullName.trim()) {
      setError('Please enter the staff member’s full name.')
      return
    }

    if (!['Administrator', 'Cashier', 'Appraiser'].includes(editRole)) {
      setError('Please select a valid staff role.')
      return
    }

    setUpdatingId(editingUser.user_id)
    setError('')
    setSuccess('')

    try {
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: editFullName.trim(),
          role: editRole,
        })
        .eq('user_id', editingUser.user_id)
        .select('user_id')

      if (error) {
        setError(error.message)
      } else if (!data || data.length === 0) {
        setError('No changes were saved. Check your permissions.')
      } else {
        setSuccess(
          `${editingUser.username}'s information has been updated.`
        )

        closeEditForm()
        await loadUsers()
      }
    } catch (err) {
      setError(err.message || 'Unable to update staff information.')
    } finally {
      setUpdatingId(null)
    }
  }

  // Search staff accounts
  const filteredUsers = users.filter((staff) => {
    const term = search.toLowerCase()

    return (
      staff.username?.toLowerCase().includes(term) ||
      staff.full_name?.toLowerCase().includes(term) ||
      staff.role?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="users-page">

      {/* Page heading */}
      <div className="users-heading">
        <div>
          <h1>Staff Management</h1>
          <p>View and manage staff accounts and their access status.</p>
        </div>

        <button
          type="button"
          className="users-refresh"
          onClick={loadUsers}
          disabled={loading || updatingId !== null}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {/* Staff summary */}
      <div className="users-summary">
        <div className="users-summary-card">
          <span>Total Staff</span>
          <strong>{users.length}</strong>
        </div>

        <div className="users-summary-card">
          <span>Active Accounts</span>
          <strong>
            {users.filter((staff) => staff.is_active).length}
          </strong>
        </div>

        <div className="users-summary-card">
          <span>Inactive Accounts</span>
          <strong>
            {users.filter((staff) => !staff.is_active).length}
          </strong>
        </div>
      </div>

      {/* Edit Staff modal */}
      {editingUser && (
        <div className="users-modal-overlay">
          <div
            className="users-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-staff-title"
          >
            <h2 id="edit-staff-title">Edit Staff Information</h2>
            <p>Update the staff member's name and role.</p>

            <form onSubmit={saveStaffChanges}>
              <label htmlFor="edit-username">Username</label>

              <input
                id="edit-username"
                type="text"
                value={editingUser.username}
                disabled
              />

              <label htmlFor="edit-full-name">Full Name</label>

              <input
                id="edit-full-name"
                type="text"
                value={editFullName}
                onChange={(event) => setEditFullName(event.target.value)}
                required
              />

              <label htmlFor="edit-role">Staff Role</label>

              <select
                id="edit-role"
                value={editRole}
                onChange={(event) => setEditRole(event.target.value)}
              >
                <option value="Administrator">Administrator</option>
                <option value="Cashier">Cashier</option>
                <option value="Appraiser">Appraiser</option>
              </select>

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={closeEditForm}
                  disabled={updatingId !== null}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="users-save-button"
                  disabled={updatingId !== null}
                >
                  {updatingId === editingUser.user_id
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff table */}
      <div className="users-table-card">
        <div className="users-table-heading">
          <h2>Staff Accounts</h2>

          <input
            type="search"
            placeholder="Search staff..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Search staff"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="users-error" role="alert">
            <p>Unable to complete the operation.</p>
            <p>{error}</p>
          </div>
        )}

        {/* Success message */}
        {success && (
          <div className="users-success" role="status">
            {success}
          </div>
        )}

        {/* Loading and staff list */}
        {loading ? (
          <p className="users-message">Loading staff accounts...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="users-message">No staff accounts found.</p>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((staff) => {
                  const isOwnAccount =
                    staff.user_id === currentUser?.user_id

                  return (
                    <tr key={staff.user_id}>
                      <td>{staff.username}</td>

                      <td>{staff.full_name || '—'}</td>

                      <td>
                        <span className="users-role">
                          {staff.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            staff.is_active
                              ? 'users-status active'
                              : 'users-status inactive'
                          }
                        >
                          {staff.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <div className="users-actions">
                          {!isOwnAccount ? (
                            <>
                              <button
                                type="button"
                                className="users-edit-button"
                                onClick={() => openEditForm(staff)}
                                disabled={updatingId !== null}
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                className="users-refresh"
                                onClick={() => toggleAccountStatus(staff)}
                                disabled={updatingId !== null}
                              >
                                {updatingId === staff.user_id
                                  ? 'Updating...'
                                  : staff.is_active
                                    ? 'Deactivate'
                                    : 'Activate'}
                              </button>
                            </>
                          ) : (
                            <span>Current Account</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
