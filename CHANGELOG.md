# Changelog

All notable changes to QubicSecure are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) · Versioning: [SemVer](https://semver.org/)

---

## [Unreleased]

### Planned
- AST-based interprocedural analysis via Clang plugin
- Fuzzing integration (libFuzzer)
- CI/CD webhook mode for auto-audit on commit
- Community vulnerability pattern database

---

## [2.0.0] — 2026-06-22

### 🚀 Added
- **Multi-provider LLM support**: Groq (primary), Google Gemini, OpenAI, Anthropic Claude
- **Provider-agnostic dispatcher** with environment-variable switching
- **Exponential backoff retry** for LLM API failures (up to 2 retries)
- **Static-only fallback mode** — full functionality with no API key required
- **Cross-source deduplication** using composite key `{function, lineStart, lineEnd, title}`
- **Logarithmic risk score normalisation** to prevent saturation from many minor issues
- **Animated analysis pipeline** with 4-step visualiser (upload → static → LLM → scoring)
- **Client-side PDF report generator** with per-issue exploit scenarios
- **6 sample contracts** covering full severity spectrum from Critical to Zero
- **IEEE-style research paper** (`docs/RESEARCH_PAPER.md`)
- **Product roadmap** with quarterly milestones (`docs/PRODUCT_ROADMAP.md`)
- **Architecture deep-dive** (`docs/ARCHITECTURE.md`)
- **Vulnerability pattern reference** (`docs/VULNERABILITY_PATTERNS.md`)
- GitHub community files: CONTRIBUTING, SECURITY, issue templates, PR template

### 🔧 Changed
- Risk scoring weights updated: Critical=10, High=6, Medium=3, Low=1
- Score thresholds: Low (0–20), Medium (21–40), High (41–70), Critical (71–100)
- Deduplication now runs two passes: within-source then cross-source

### 🐛 Fixed
- LLM response validation now handles markdown-wrapped JSON from some providers
- File-handler correctly sanitises upload paths to prevent directory traversal

---

## [1.0.0] — 2026-01-01

### Added
- Initial release
- 10 static vulnerability patterns for Qubic C++
- Single LLM provider (OpenAI)
- Basic PDF report generation
- Next.js 14 web interface
- Risk scoring engine

---

[Unreleased]: https://github.com/YOUR-USERNAME/qubicsecure/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/YOUR-USERNAME/qubicsecure/releases/tag/v2.0.0
[1.0.0]: https://github.com/YOUR-USERNAME/qubicsecure/releases/tag/v1.0.0
