# FridgePolice Prototype Decisions

## What this App Does
This prototype is a simple roommate food tracking app. It allows users to add food items to a shared digital inventory and request portions of that food. It enforces fairness and correctness even in edge-case situations, such as unexpected spoilage, synchronous double-requests, identical-name items, and physical inventory desyncs.

The prototype uses React with an in-memory `useReducer` store.

## How the 4 Scenarios Are Handled

### Scenario 1: Concurrent Requests for the Final Portion
Sometimes, there's exactly 25% of pizza left, and Roommate B and Roommate C click "request" at the exact same moment. 
**Solution**: The app manages global state synchronously through atomic actions in a reducer. When a request action is dispatched, it reads the absolute latest state to check if `amount <= availableAmount`. If sufficient, the amount is immediately decremented and the action succeeds. The trailing parallel request is naturally evaluated against the freshly decremented amount and will safely be rejected. You can test this by clicking "Simulate Double Request" on the frontend. The terminal log clearly shows the first request succeeding and the second failing.

### Scenario 2: Spoiled Claims (Approved but never consumed)
Sometimes a roommate gets an approval for a portion of food, forgets about it, and it spoils. This locks up food unnecessarily or falsifies history forever.
**Solution**: Every "approved" request is immediately affixed with an `expiresAt` timestamp (set to 10 seconds for prototyping). The store contains a poll mechanism that checks for expirations continuously. If a claim expires before being clicked "Consume Now", the status updates automatically to `'spoiled'`, and we could naturally extend this to re-credit the general inventory pool if the food hasn't expired globally.

### Scenario 3: Identical Items (e.g. Two Ketchup Bottles)
Roommates often buy two of the exact same item. If tracked by name, interactions conflict.
**Solution**: Items are assigned discrete `UUID` fields upon creation. Name acts purely as a display alias. As an example, if you add "Ketchup" twice in the UI, two distinct rows generate, each with its own ID, total amount, and trackable life cycle. The request and consume actions solely rely on `itemId`.

### Scenario 4: Reality vs. App Mismatch
A roommate eats food without logging it, leaving the digital tracker desynced from the physical fridge.
**Solution**: I added an "Adjust Inventory" manual override button to every item. When truth contradicts the app, a user simply clicks the correct inventory button and inputs the real number. A manual sync action instantly overwrites the store value and logs a "Reality Check" manual edit event.
