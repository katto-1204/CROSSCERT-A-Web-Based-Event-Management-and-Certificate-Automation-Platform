# CROSSCERT Test Runs

Format: **test name — # of tests — date — status**

| Test name | # tests | Date | Status | Notes |
|-----------|---------|------|--------|-------|
| django-system-check | 1 | 2026-06-13 | **PASS** | `manage.py check` |
| django-unit-tests | 11 | 2026-06-13 | **PASS** | auth, OTP, events, bookmarks |
| typescript-compile | 1 | 2026-06-13 | **PASS** | `npm run test:types` |
| eslint-config | 1 | 2026-06-13 | **PASS** | `eslint.config.mjs` added |
| api-smoke | 7 | 2026-06-13 | **PASS** | restart backend for `/api/health/` |
| browser-devtools | 0 | 2026-06-13 | **SKIP** | manual checklist provided |

**Overall: 21 automated checks — PASS**

---

## Run commands

```powershell
# Backend
cd backend
.\venv\Scripts\python.exe manage.py check
.\venv\Scripts\python.exe manage.py test events participants crosscert

# Frontend
npm run test:types
npm run lint

# API smoke (backend running)
.\backend\venv\Scripts\python.exe tests-\smoke_test_api.py
```

---

## Test modules

| Module | Tests | Coverage |
|--------|-------|----------|
| `crosscert/test_core.py` | 5 | health, CSRF, auth/me, login, OTP cache |
| `events/test_events.py` | 3 | date validation, public events list |
| `participants/test_bookmarks.py` | 2 | bookmark toggle, bookmark ids |
| `tests-/smoke_test_api.py` | 7 | live API endpoints |
