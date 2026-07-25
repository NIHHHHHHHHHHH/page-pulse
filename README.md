# Page Pulse

A URL auditor built for the Digital Heroes SDE training task. Paste any URL,
get back an instant report on HTTP status, response time, SEO-relevant
tags, and basic accessibility signals.

**Live app:** 
https://page-pulse-mu-eight.vercel.app

**Backend API:**
https://page-pulse-6r16.onrender.com

Built for [Digital Heroes Training Task](https://digitalheroesco.com).

---

## Setup

### Backend
```bash
cd backend
npm install
npm start        # runs on http://localhost:5000
npm test         # runs the Jest suite
```

### Frontend
```bash
cd frontend
npm install
```
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```
```bash
npm run dev       # runs on http://localhost:3000
```

Both need to be running locally for the frontend to work end-to-end.

---

## API Contract

### `POST /api/audit`

**Request**
```json
{ "url": "https://example.com" }
```

**Response — 200 (HTML page)**
```json
{
  "url": "https://example.com",
  "finalUrl": "https://example.com/",
  "redirectCount": 0,
  "httpStatus": 200,
  "responseTimeMs": 214,
  "contentType": "text/html; charset=UTF-8",
  "title": "Example Domain",
  "metaDescription": null,
  "h1Count": 1,
  "totalImages": 0,
  "imagesMissingAlt": 0,
  "wordCount": 28,
  "canonicalUrl": null,
  "hasViewportMeta": false,
  "ogTagsPresent": false,
  "ogTags": { "title": null, "description": null, "image": null }
}
```

**Response — 200 (non-HTML)**
```json
{
  "url": "https://example.com/data.json",
  "httpStatus": 200,
  "responseTimeMs": 120,
  "contentType": "application/json",
  "warning": "Response is not HTML — skipped content parsing."
}
```

**Error responses**

| Status | Error code | When |
|---|---|---|
| 400 | `INVALID_URL` | Not a syntactically valid http(s) URL |
| 400 | `BLOCKED_HOST` | URL resolves to a private/internal IP (SSRF guard) |
| 422 | `DNS_FAILURE` | Hostname doesn't resolve |
| 502 | `FETCH_FAILED` | Network-level failure fetching the page |
| 504 | `TIMEOUT` | Target didn't respond within 8 seconds |
| 500 | `INTERNAL_ERROR` | Unexpected server error |

```json
{ "error": "TIMEOUT", "message": "Request timed out after 8000ms." }
```

---

## Design decisions

**1. SSRF protection on the audit endpoint.**
Because this endpoint fetches any URL a user supplies, it's a textbook
SSRF vector — without a guard, someone could point it at
`http://localhost:5000`, an internal service, or a cloud metadata endpoint
(`169.254.169.254`) and use the server as a proxy into infrastructure it
has no business reaching. I resolve the hostname via DNS before fetching
and reject anything that resolves to a private/loopback/link-local range,
rather than relying on string-matching the input URL (which is easy to
bypass with redirects or DNS rebinding).

**2. Classified errors instead of one generic failure.**
Rather than a single catch-all 500 on any failure, errors are tagged with
a specific code (`TIMEOUT`, `DNS_FAILURE`, `INVALID_URL`, etc.) and mapped
to an appropriate HTTP status. This makes the frontend's error messages
actually useful to a user, and makes the failure paths testable in
isolation rather than as one undifferentiated "it broke" branch.

**3. Mocked network calls in tests, not live requests.**
The Jest suite mocks `axios` and the DNS-based validator so tests run
instantly, deterministically, and without depending on example.com or
any external service being up. This keeps CI reliable and fast, at the
cost of not testing the real network layer — a tradeoff I'm comfortable
with for unit tests, and something I'd complement with a small
integration/smoke test hitting the live deployed endpoint if I had more
time.

---

## What I'd change with another day

- Add a proper integration test hitting the deployed Render endpoint,
  to catch real network/DNS-layer issues the mocked unit tests can't.
- Cache recent audit results (by URL) for a short TTL to avoid
  re-fetching the same page repeatedly and to protect against abuse.
- Convert the backend to TypeScript for stronger contracts between the
  route, service, and validator layers.
- Add a basic Lighthouse-style performance/accessibility score instead
  of just raw counts, so the report is more actionable at a glance.
