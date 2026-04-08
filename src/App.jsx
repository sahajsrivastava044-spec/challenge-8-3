import React, { useState } from 'react';
import { useAppContext } from './store';

function App() {
  const { state, dispatch } = useAppContext();
  const { items, requests, logs } = state;

  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');

  // Scenario 3: Add independent items even if same name
  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName || !newItemAmount) return;
    dispatch({ type: 'ADD_ITEM', payload: { name: newItemName, amount: Number(newItemAmount) } });
    setNewItemName('');
    setNewItemAmount('');
  };

  // Scenario 1: Concurrent requests simulation
  const simulateConcurrentRequest = (itemId, amount) => {
    // Both dispatched synchronously. Reducer processes them in serial order instantly. 
    // The second dispatch will correctly see the updated state from the first one.
    dispatch({ type: 'REQUEST_PORTION', payload: { itemId, requester: 'Roommate B', amount } });
    dispatch({ type: 'REQUEST_PORTION', payload: { itemId, requester: 'Roommate C', amount } });
  };

  // Scenario 4: Manual Correction
  const handleCorrection = (itemId) => {
    const rawVal = window.prompt("Enter correct available amount (someone ate it!):");
    if (rawVal !== null && !isNaN(Number(rawVal))) {
      dispatch({ type: 'CORRECT_INVENTORY', payload: { itemId, newAmount: Number(rawVal), reason: 'Reality check' } });
    }
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>FridgePolice Prototype 🍕</h1>
      <p>Roommate Food Tracker handling tricky scenarios.</p>

      <section style={sectionStyle}>
        <h2>Inventory (Scenario 3 & 4)</h2>
        <form onSubmit={handleAddItem} style={{ marginBottom: '1rem' }}>
          <input 
            placeholder="Item Name (e.g. Ketchup)" 
            value={newItemName} 
            onChange={e => setNewItemName(e.target.value)} 
          />
          <input 
            type="number" 
            placeholder="Amount" 
            value={newItemAmount} 
            onChange={e => setNewItemAmount(e.target.value)} 
          />
          <button type="submit">Add to Fridge</button>
        </form>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Available</th>
              <th style={thStyle}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={tdStyle}>{item.id}</td>
                <td style={tdStyle}>{item.name}</td>
                <td style={tdStyle}>
                  <strong>{item.availableAmount} / {item.totalAmount}</strong>
                </td>
                <td style={tdStyle}>
                  {/* Scenario 1 Simulation */}
                  <button onClick={() => simulateConcurrentRequest(item.id, item.availableAmount)}>
                    Simulate Double Request (Final Portion)
                  </button>
                  {/* Scenario 4 Correction */}
                  <button onClick={() => handleCorrection(item.id)} style={{ marginLeft: '0.5rem' }}>
                    Correct Inventory
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={sectionStyle}>
        <h2>Requests & Approvals (Scenario 2)</h2>
        <p><small>Approved portions will spoil if not consumed within 10 seconds.</small></p>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {requests.length === 0 && <li>No requests yet.</li>}
          {requests.map(req => (
            <li key={req.id} style={{ padding: '0.5rem', background: '#f9f9f9', marginBottom: '0.5rem', borderRadius: '4px' }}>
              <strong>{req.requester}</strong> requested {req.amount} of {req.itemName} - Status: {' '}
              <span style={{ 
                color: req.status === 'approved' ? 'green' : 
                       req.status === 'spoiled' ? 'red' : 'blue',
                fontWeight: 'bold'
              }}>
                {req.status.toUpperCase()}
              </span>
              
              {req.status === 'approved' && (
                <button onClick={() => dispatch({ type: 'CONSUME_PORTION', payload: { requestId: req.id } })} style={{ marginLeft: '1rem' }}>
                  Consume Now
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ ...sectionStyle, background: '#222', color: '#0f0', fontFamily: 'monospace' }}>
        <h3>Action Logs</h3>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ padding: '2px 0' }}>&gt; {log}</div>
          ))}
        </div>
      </section>
    </div>
  );
}

const sectionStyle = {
  background: '#fff', 
  padding: '1.5rem', 
  borderRadius: '8px', 
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  marginBottom: '2rem'
};

const thStyle = { padding: '0.5rem', borderBottom: '2px solid #ccc' };
const tdStyle = { padding: '0.5rem' };

export default App;
