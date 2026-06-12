"""
CROSSCERT API smoke tests — run with backend on http://127.0.0.1:8000
Usage: python tests-/smoke_test_api.py
"""
import json
import sys
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"
RESULTS: list[tuple[str, bool, str]] = []


def req(method: str, path: str, body: dict | None = None) -> tuple[int, dict | str]:
    url = f"{BASE}{path}"
    data = json.dumps(body).encode() if body else None
    request = urllib.request.Request(url, data=data, method=method)
    if body:
        request.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(request, timeout=10) as resp:
            raw = resp.read().decode()
            try:
                return resp.status, json.loads(raw)
            except json.JSONDecodeError:
                return resp.status, raw
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw)
        except json.JSONDecodeError:
            return e.code, raw


def check(name: str, ok: bool, detail: str = ""):
    RESULTS.append((name, ok, detail))
    mark = "PASS" if ok else "FAIL"
    print(f"  [{mark}] {name}" + (f" — {detail}" if detail else ""))


def main():
    print(f"\nCROSSCERT API Smoke Tests — {BASE}\n")

    status, data = req("GET", "/api/health/")
    check("Health endpoint", status == 200 and isinstance(data, dict), f"status={status}")

    status, data = req("GET", "/api/auth/csrf-token/")
    check("CSRF token", status == 200 and isinstance(data, dict) and "csrf_token" in data, f"status={status}")

    status, data = req("GET", "/api/auth/me/")
    check("Auth me (anonymous)", status == 200, f"status={status}")

    status, data = req("GET", "/api/events/")
    check("Events list (public)", status == 200, f"status={status}")

    status, data = req("GET", "/api/bookmarks/ids/")
    check("Bookmarks ids (auth required)", status in (401, 403), f"status={status}")

    status, data = req("POST", "/api/auth/login/", {"email": "invalid@test.com", "password": "wrong"})
    check("Login rejects bad credentials", status == 401, f"status={status}")

    status, data = req("POST", "/api/check-ins/check-in-by-code/", {"code": "INVALID-CODE"})
    check("Check-in by code (auth/body)", status in (401, 403, 404), f"status={status}")

    passed = sum(1 for _, ok, _ in RESULTS if ok)
    total = len(RESULTS)
    print(f"\n{passed}/{total} passed\n")
    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
