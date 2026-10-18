# Vruksha Watika: Plant Nursery (frontend + backend)

## Run
    node server.js        # needs Node 16+, no npm install required
    open http://localhost:3000     (PORT=8080 node server.js to change port)

## Structure
- server.js          Node backend (built-in modules only): REST API, auth, static hosting
- data/seed.txt      The 20 sample plants; data/db.json is created on first run
- public/index.html  Page shell, preloader, canvas
- public/css/style.css   Your original styles;  extras.css = new animations + dashboard
- public/js/app.js   Your original app;  api.js = backend connection + dashboard;  extras.js = animations

## API
Public:  GET /api/plants · POST /api/orders {name,phone,addr,items:[{id,q}]}
Admin (Bearer token): POST /api/admin/login {passcode} · GET /api/admin/data · GET /api/admin/dashboard · PUT /api/admin/sync
First admin login sets the passcode (6+ chars, stored scrypt-hashed). Tokens last 12h. Login is rate-limited.

## Notes
Prices/stock are checked and stock deducted on the server. Data is a JSON file: fine for a small nursery or demo; move to a real database before heavy use. Use HTTPS when deploying.
