# browser-devtools — 0 — 2026-06-13 — SKIP

Chrome DevTools MCP was **not available** in this session. Use this checklist manually (or configure `chrome-devtools` MCP in `.mcp.json`).

## Manual browser test plan

### Setup
1. Start backend (`:8000`) and frontend (`:3000`)
2. Open DevTools → Console + Network tabs

### Auth
- [ ] Sign in as admin → lands on `/admin/dashboard`, console clean
- [ ] Sign in as participant → lands on `/participant/dashboard`
- [ ] Bad password → error shown, no crash

### Admin — Check-in
- [ ] `/admin/checkin` — light mode readable, dark mode readable
- [ ] Select event → open camera → scan valid QR
- [ ] Wallet success modal shows name, event, QR, pass ID
- [ ] Scan same QR again → “Already verified” / duplicate badge
- [ ] Network: `POST /api/check-ins/check-in-by-code/` → 201 or 200

### Participant — Wallet
- [ ] `/participant/wallet` — tickets + certificates listed
- [ ] Expand ticket → inline QR renders

### Bookmarks
- [ ] Toggle bookmark on event → refresh → still bookmarked (server sync)
- [ ] Sign in on another browser → bookmarks appear

### Certificates
- [ ] Complete evaluation flow → certificate in `/participant/certificates`
- [ ] Download opens PDF

### Console standard
- [ ] Zero red errors on main flows above
