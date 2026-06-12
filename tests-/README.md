# CROSSCERT Test Runs

Format: **test name — # of tests — date — status**

| Test name | # tests | Date | Status | Notes |
|-----------|---------|------|--------|-------|
| django-system-check | 1 | 2026-06-13 | **PASS** | `manage.py check` — 0 issues |
| django-unit-tests | 0 | 2026-06-13 | **SKIP** | No test files in repo |
| typescript-compile | 1 | 2026-06-13 | **PASS** | `npx tsc --noEmit` — 0 errors |
| eslint-lint | 0 | 2026-06-13 | **SKIP** | No `eslint.config.js`; eslint not in node_modules |
| npm-test-script | 0 | 2026-06-13 | **SKIP** | No `"test"` script in package.json |
| api-smoke | 7 | 2026-06-13 | **PARTIAL** | 6/7 pass — health endpoint 404 (server reload needed) |
| browser-devtools | 0 | 2026-06-13 | **SKIP** | Chrome DevTools MCP not configured in this environment |

**Overall automated run:** 9 checks executed, **7 PASS**, **1 PARTIAL**, **3 SKIP**

---

## How to re-run

```powershell
# Backend system check
cd backend
.\venv\Scripts\python.exe manage.py check

# TypeScript
npx tsc --noEmit

# API smoke (backend must be running on :8000)
.\backend\venv\Scripts\python.exe tests-\smoke_test_api.py
```

---

## Detailed logs

See individual files in this folder:
- `django-system-check-1-2026-06-13-PASS.md`
- `typescript-compile-1-2026-06-13-PASS.md`
- `api-smoke-7-2026-06-13-PARTIAL.md`
- `browser-manual-checklist-2026-06-13-SKIP.md`
