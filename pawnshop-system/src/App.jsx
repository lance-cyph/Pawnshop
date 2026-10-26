import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [customers, setCustomers] = useState([])
  const [message, setMessage] = useState('Loading...')

  useEffect(() => {
    async function loadCustomers() {
      const { data, error } = await supabase.from('customers').select('*')
      if (error) {
        setMessage('Error: ' + error.message)
      } else {
        setCustomers(data)
        setMessage('Connected to Supabase!')
      }
    }
    loadCustomers()
  }, [])

  return (
    <div>
      <h1>{message}</h1>
      {customers.map((c) => (
        <p key={c.customer_id}>
          {c.customer_id}. {c.first_name} {c.last_name} ({c.status})
        </p>
      ))}
    </div>
  )
}

export default App