
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'

export default function Dashboard() {
  const [customers, setCustomers] = useState([])
  const [message, setMessage] = useState('Loading customers...')

  useEffect(() => {
    async function loadCustomers() {
      const { data, error } = await supabase
        .from('customers')
        .select('*')

      if (error) {
        setMessage(`Unable to load customers: ${error.message}`)
      } else {
        setCustomers(data || [])
        setMessage('Connected to Supabase!')
      }
    }

    loadCustomers()
  }, [])

  return (
    <div>
      <h1>Dashboard</h1>
      <p>{message}</p>

      <div className="users-summary">
        <div className="users-summary-card">
          <span>Total Customers</span>
          <strong>{customers.length}</strong>
        </div>
      </div>

      <div className="users-table-card">
        <div className="users-table-heading">
          <h2>Customers</h2>
        </div>

        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {customers.map((customer) => (
                <tr key={customer.customer_id}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.first_name}</td>
                  <td>{customer.last_name}</td>
                  <td>{customer.status}</td>
                </tr>
              ))}

              {customers.length === 0 && (
                <tr>
                  <td colSpan="4">No customers to display.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
