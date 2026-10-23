# Encave Canteen Pre-order Prototype

## Current state
This is a refactored version of the supplied Encave single-file frontend. It preserves the existing menu, cart, pickup-slot selection, two-minute slot hold, order tracking, QR token, and demo kitchen/kiosk controls.

## Run it
1. Keep the folder structure intact.
2. Open `index.html` in a modern browser. For more reliable local development, run a static server from this folder, e.g. `python -m http.server 8000`, then visit `http://localhost:8000`.
3. QR generation and web fonts currently use CDN links, so those features need an internet connection.

## Important prototype limitations
- Menu, pickup-slot capacity, waitlist, order IDs, and order status are hard-coded/in-memory demo data.
- Orders do not persist after refresh and are not shared between devices.
- The kitchen status and QR scan buttons are demo controls, not a real staff/kiosk integration.
- A QR token is not proof of a real order until a backend validates it.

## Suggested production-ready structure (next stage)
- `index.html`: page shell
- `css/styles.css`: visual design
- `js/app.js`: current UI and demo flow
- `js/api.js`: API calls to the backend (add when backend exists)
- `js/state.js`: state management (optional, when the app grows)
- `assets/`: local images/icons if added
- `backend/`: API and database, ideally a separate project/package

## Next engineering steps
1. Agree on the real canteen menu, prices, service hours, and slot capacities.
2. Build an API and database for menu items, slot inventory, orders, and status changes.
3. Make slot reservation atomic on the server; a browser-only timer cannot prevent two users taking the same capacity.
4. Generate and validate one-time pickup tokens on the server; don't trust client-side status.
5. Add staff authentication/roles and a kitchen dashboard.
6. Add input validation, error/loading states, and automated tests.
