import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Generates a mock UUID
function uuid() {
  return Math.random().toString(36).substring(2, 15);
}

const initialState = {
  items: [
    { id: uuid(), name: 'Pizza', totalAmount: 100, availableAmount: 25 },
    { id: uuid(), name: 'Ketchup', totalAmount: 1, availableAmount: 1 },
    { id: uuid(), name: 'Ketchup', totalAmount: 1, availableAmount: 1 },
  ],
  requests: [],
  logs: [] // Useful for UI feedback
};

// Actions:
// ADD_ITEM
// REQUEST_PORTION
// CONSUME_PORTION
// CHECK_SPOILAGE
// CORRECT_INVENTORY

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Scenario 3: Distinct identity via unique ID, not by name.
      const newItem = {
        id: uuid(),
        name: action.payload.name,
        totalAmount: action.payload.amount,
        availableAmount: action.payload.amount
      };
      return { 
        ...state, 
        items: [...state.items, newItem],
        logs: [`Added item: ${newItem.name} (ID: ${newItem.id})`, ...state.logs]
      };
    }
    
    case 'REQUEST_PORTION': {
      const { itemId, requester, amount } = action.payload;
      const itemIndex = state.items.findIndex(i => i.id === itemId);
      
      if (itemIndex === -1) return state;
      const item = state.items[itemIndex];

      // Scenario 1: Prevent double allocation of same portion (strictly checking current state atomatically)
      if (item.availableAmount >= amount) {
        const newItems = [...state.items];
        newItems[itemIndex] = { ...item, availableAmount: item.availableAmount - amount };
        
        const newRequest = {
          id: uuid(),
          itemId,
          itemName: item.name,
          requester,
          amount,
          status: 'approved',
          // Scenario 2: Timed spoilage
          expiresAt: Date.now() + 10000 // 10 seconds alive before spoilage
        };
        
        return { 
          ...state, 
          items: newItems, 
          requests: [...state.requests, newRequest],
          logs: [`✅ SUCCESS: ${requester} allocated ${amount} of ${item.name}`, ...state.logs]
        };
      } else {
        // Failed concurrency or just empty
        return {
          ...state,
          logs: [`❌ FAILED: ${requester} tried to request ${amount} from ${item.name}, but only ${item.availableAmount} left!`, ...state.logs]
        };
      }
    }
    
    case 'CONSUME_PORTION': {
      const { requestId } = action.payload;
      const newRequests = state.requests.map(req => {
        if (req.id === requestId && req.status === 'approved') {
          return { ...req, status: 'consumed' };
        }
        return req;
      });
      return { ...state, requests: newRequests, logs: [`Consumed portion from request ${requestId}`, ...state.logs] };
    }
    
    case 'CHECK_SPOILAGE': {
      const now = Date.now();
      let changed = false;
      const newRequests = state.requests.map(req => {
        if (req.status === 'approved' && req.expiresAt < now) {
          changed = true;
          return { ...req, status: 'spoiled' };
        }
        return req;
      });
      if (changed) {
         return { ...state, requests: newRequests, logs: [`⚠️ Some food portions expired and spoiled!`, ...state.logs] };
      }
      return state;
    }
    
    case 'CORRECT_INVENTORY': {
      // Scenario 4: Manual correction
      const { itemId, newAmount, reason } = action.payload;
      const newItems = state.items.map(item => {
        if (item.id === itemId) {
          return { ...item, availableAmount: newAmount };
        }
        return item;
      });
      return { 
        ...state, 
        items: newItems,
        logs: [`✏️ INVENTORY CORRECTED: Item ${itemId} changed to ${newAmount}. Reason: ${reason}`, ...state.logs]
      };
    }

    default:
      return state;
  }
}

const AppContext = createContext();

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Poll for expiration
  useEffect(() => {
    const interval = setInterval(() => {
      dispatch({ type: 'CHECK_SPOILAGE' });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}
