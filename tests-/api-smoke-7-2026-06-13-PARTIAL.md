# api-smoke — 7 — 2026-06-13 — PARTIAL (6/7 PASS)

**Command:** `python tests-/smoke_test_api.py`  
**Target:** `http://127.0.0.1:8000`

| # | Test | Status | Detail |
|---|------|--------|--------|
| 1 | Health endpoint | **FAIL** | HTTP 404 — restart backend after `health_endpoint` was added |
| 2 | CSRF token | PASS | 200, returns `csrf_token` |
| 3 | Auth me (anonymous) | PASS | 200 |
| 4 | Events list (public) | PASS | 200 |
| 5 | Bookmarks ids (auth required) | PASS | 403 as expected |
| 6 | Login rejects bad credentials | PASS | 401 |
| 7 | Check-in by code (unauthenticated) | PASS | 403 |

**Fix for #1:** Restart `python manage.py runserver` and re-run smoke test.
