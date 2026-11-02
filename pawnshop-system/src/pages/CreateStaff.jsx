
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function CreateStaff() {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
    role: 'Cashier',
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  function handleChange(event) {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  async function handleSubmit(event) {
    event.preventDefault()

    setMessage('')
    setError('')

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('create-staff-account', {
          body: {
            username: form.username,
            full_name: form.full_name,
            password: form.password,
            role: form.role,
          },
        })

      if (functionError) {
        throw new Error(
          data?.error || functionError.message ||
          'Unable to create staff account.'
        )
      }

      if (data?.error) {
        throw new Error(data.error)
      }

      setMessage(
        `Account created successfully for ${data.full_name}.`
      )

      setForm({
        username: '',
        full_name: '',
        password: '',
        confirmPassword: '',
        role: 'Cashier',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <h1>Create Staff Account</h1>
          <p>
            Create a login account for a cashier or appraiser.
          </p>
        </div>
      </div>

      <div className="staff-form-card">
        <form onSubmit={handleSubmit}>
          <div className="staff-form-field">
            <label htmlFor="full_name">Full Name</label>
            <input
              id="full_name"
              name="full_name"
              type="text"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Enter staff full name"
              minLength={2}
              maxLength={100}
              required
            />
          </div>

          <div className="staff-form-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              value={form.username}
              onChange={handleChange}
              placeholder="e.g. cashier01"
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9._-]+"
              autoComplete="username"
              required
            />
            <small>
              Use 3–30 letters, numbers, dots, underscores, or hyphens.
            </small>
          </div>

          <div className="staff-form-field">
            <label htmlFor="role">Staff Role</label>
            <select
              id="role"
              name="role"
              value={form.role}
              onChange={handleChange}
              required
            >
              <option value="Cashier">Cashier</option>
              <option value="Appraiser">Appraiser</option>
            </select>
          </div>

          <div className="staff-form-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
            <small>Must be at least 8 characters.</small>
          </div>

          <div className="staff-form-field">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              minLength={8}
              maxLength={72}
              autoComplete="new-password"
              required
            />
          </div>

          {error && (
            <p className="staff-form-error" role="alert">
              {error}
            </p>
          )}

          {message && (
            <p className="staff-form-success" role="status">
              {message}
            </p>
          )}

          <div className="staff-form-actions">
            <Link to="/users" className="staff-cancel-button">
              Cancel
            </Link>

            <button type="submit" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
