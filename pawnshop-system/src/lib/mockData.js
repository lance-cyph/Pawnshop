// SAMPLE DATA so every screen has something to show.
// Field names are snake_case so they can map straight onto Supabase columns.
// When the database is ready, replace the seed arrays in context/DataContext.jsx
// with Supabase queries.

export const seedCustomers = [
  { customer_id: 'CUST-001', first_name: 'Juan', last_name: 'Dela Cruz', contact_number: '0917-123-4567', email: 'juan.delacruz@email.com', address: '123 Rizal St., Brgy. San Jose, Quezon City', status: 'Active', id_photo: null },
  { customer_id: 'CUST-002', first_name: 'Maria', last_name: 'Santos', contact_number: '0918-234-5678', email: 'maria.santos@email.com', address: '45 Mabini Ave., Makati City', status: 'Active', id_photo: null },
  { customer_id: 'CUST-003', first_name: 'Antonio', last_name: 'Reyes', contact_number: '0920-345-6789', email: 'antonio.reyes@email.com', address: '8 Luna St., Pasig City', status: 'Active', id_photo: null },
  { customer_id: 'CUST-004', first_name: 'Elena', last_name: 'Gomez', contact_number: '0922-456-7890', email: 'elena.gomez@email.com', address: '77 Bonifacio Rd., Mandaluyong City', status: 'Inactive', id_photo: null },
  { customer_id: 'CUST-005', first_name: 'Roberto', last_name: 'Lim', contact_number: '0935-567-8901', email: 'roberto.lim@email.com', address: '19 Aguinaldo St., Taguig City', status: 'Active', id_photo: null },
]

export const seedAppraisals = [
  { appraisal_id: 'APR-001', item_name: '18K Gold Necklace (8.5g)', item_type: 'Gold Jewelry', appraised_value: 20000, description: '18K gold rope chain, 8.5 grams, tested 18k, lobster clasp.', status: 'ready' },
  { appraisal_id: 'APR-002', item_name: 'Seiko 5 Automatic Watch', item_type: 'Watch / Timepiece', appraised_value: 6000, description: 'Seiko 5 automatic, stainless steel, light scratches on case.', status: 'ready' },
  { appraisal_id: 'APR-003', item_name: 'Samsung Galaxy S22 256GB', item_type: 'Electronics / Gadget', appraised_value: 15000, description: 'Phantom Black, 256GB, no cracks, original charger.', status: 'pending' },
  { appraisal_id: 'APR-004', item_name: '14K Gold Ring (3.2g)', item_type: 'Gold Jewelry', appraised_value: 9500, description: '14K gold ring, 3.2 grams, hallmark 585.', status: 'ready' },
]

// status: active | due_soon | expired | redeemed | auctioned
export const seedTickets = [
  { ticket_no: 'PT-2024-00142', customer_id: 'CUST-001', appraisal_id: null, item_name: '18K Yellow Gold Rope Chain Necklace (8.5g)', appraised_value: 20000, principal: 15000, interest_rate: 0.035, loan_date: '2024-10-24', due_date: '2024-11-23', status: 'active', notes: 'Minor wear on clasp, hallmark stamp 750 verified; tested intact.' },
  { ticket_no: 'PT-2024-00089', customer_id: 'CUST-002', appraisal_id: null, item_name: 'Apple MacBook Air 13"', appraised_value: 30000, principal: 22000, interest_rate: 0.035, loan_date: '2024-09-15', due_date: '2024-10-15', status: 'expired', notes: '' },
  { ticket_no: 'PT-2024-00102', customer_id: 'CUST-001', appraisal_id: null, item_name: 'Citizen Eco-Drive Watch', appraised_value: 8000, principal: 5500, interest_rate: 0.035, loan_date: '2024-09-25', due_date: '2024-10-25', status: 'due_soon', notes: '' },
  { ticket_no: 'PT-2024-00115', customer_id: 'CUST-003', appraisal_id: null, item_name: '14K Gold Bracelet (6g)', appraised_value: 14000, principal: 10000, interest_rate: 0.035, loan_date: '2024-09-26', due_date: '2024-10-26', status: 'due_soon', notes: '' },
  { ticket_no: 'PT-2024-00120', customer_id: 'CUST-004', appraisal_id: null, item_name: 'Sony PlayStation 5', appraised_value: 18000, principal: 12000, interest_rate: 0.035, loan_date: '2024-09-28', due_date: '2024-10-28', status: 'active', notes: '' },
  { ticket_no: 'PT-2024-00075', customer_id: 'CUST-005', appraisal_id: null, item_name: 'Gold Pendant (2.1g)', appraised_value: 5000, principal: 3500, interest_rate: 0.035, loan_date: '2024-08-10', due_date: '2024-09-10', status: 'expired', notes: '' },
]

export const seedAuctions = [
  { ticket_no: 'PT-2024-00052', item_name: 'Samsung Galaxy S22 256GB', description: 'Phantom Black', original_loan: 12000, appraised_value: 15000, status: 'ready', bidder: '', sale_amount: null },
  { ticket_no: 'PT-2024-00041', item_name: 'Sony WH-1000XM4', description: 'Wireless Headphones', original_loan: 5000, appraised_value: 7000, status: 'ready', bidder: '', sale_amount: null },
  { ticket_no: 'PT-2024-00030', item_name: '14K Gold Bracelet (4.2g)', description: '', original_loan: 6500, appraised_value: 9000, status: 'sold', bidder: 'Eduardo Cruz', sale_amount: 8200 },
]

export const seedReceipts = [
  { receipt_no: 'OR-2024-00891', ticket_no: 'PT-2024-00142', customer_name: 'Juan Dela Cruz', item_name: '18K Yellow Gold Rope Chain Necklace (8.5g)', type: 'Full Redemption', date: '2024-10-24', principal: 15000, interest: 525, penalty: 0, amount_paid: 15525, new_due_date: null, cashier: 'Maria Santos' },
]

export const ITEM_TYPES = [
  'Gold Jewelry',
  'Silver Jewelry',
  'Watch / Timepiece',
  'Electronics / Gadget',
  'Appliance',
  'Musical Instrument',
  'Other',
]
