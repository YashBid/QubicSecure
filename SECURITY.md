# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in QubicSecure, please **do not** open a public GitHub issue.

Instead, please email: **[your-email@example.com]**

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

You will receive a response within 48 hours. We take all security reports seriously and will credit responsible disclosures in the CHANGELOG.

---

## Scope

This policy covers:
- The QubicSecure web application source code
- The analysis pipeline (static engine, LLM layer, scoring engine)
- API endpoints (`/api/analyze`, `/api/upload`, `/api/report`)

Out of scope:
- The sample `.cpp` contracts (these are intentionally vulnerable for demo purposes)
- Third-party LLM provider APIs

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 2.x     | ✅ Yes    |
| 1.x     | ❌ No     |
