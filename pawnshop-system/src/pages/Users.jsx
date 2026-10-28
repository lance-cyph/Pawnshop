
import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const loadUsers = useCallback(async () => {
    setLoading(true)
    setError('')

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

    setLoading(false)
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase()

    return (
      user.username?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term)
    )
  })

  return (
    <div className="users-page">
      <div className="users-heading">
        <div>
          <h1>Staff Management</h1>
          <p>View staff accounts and their access status.</p>
        </div>

        <button
          type="button"
          className="users-refresh"
          onClick={loadUsers}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      <div className="users-summary">
        <div className="users-summary-card">
          <span>Total Staff</span>
          <strong>{users.length}</strong>
        </div>

        <div className="users-summary-card">
          <span>Active Accounts</span>
          <strong>
            {users.filter((user) => user.is_active).length}
          </strong>
        </div>

        <div className="users-summary-card">
          <span>Inactive Accounts</span>
          <strong>
            {users.filter((user) => !user.is_active).length}
          </strong>
        </div>
      </div>

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

        {error && (
          <div className="users-error" role="alert">
            <p>Unable to load staff accounts.</p>
            <p>{error}</p>
            <p>
              Check your Supabase connection and the SELECT
              permissions for the users table.
            </p>
          </div>
        )}

        {loading ? (
          <p className="users-message">Loading staff accounts...</p>
        ) : !error && filteredUsers.length === 0 ? (
          <p className="users-message">No staff accounts found.</p>
        ) : !error ? (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Full Name</th>
                  <th>Role</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.user_id}>
                    <td>{user.username}</td>
                    <td>{user.full_name || '—'}</td>
                    <td>
                      <span className="users-role">
                        {user.role}
                      </span>
                    </td>
                    <td>
                      <span
                        className={
                          user.is_active
                            ? 'users-status active'
                            : 'users-status inactive'
                        }
                      >
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </div>
  )
}
