# 🗺️ Product Roadmap — QubicSecure

> Last updated: June 2026 · Owner: Bid Sakshi

---

## Vision

Make professional-grade smart contract security accessible to every Qubic developer — not just those who can afford $5,000 manual audits.

## Success Metrics

| Metric | Current (v2.0) | Target (v3.0) |
|--------|---------------|---------------|
| Vulnerability patterns | 10 | 25+ |
| LLM providers supported | 4 | 6+ |
| Analysis latency | < 30s | < 10s |
| False positive rate | ~15% (patterns 1–2) | < 5% |
| Supported languages | Qubic C++ | C++, WASM |

---

## Q3 2026

### 🔬 AST-Based Analysis Engine
**Why:** The current regex engine cannot trace data flow across function boundaries. A Clang AST plugin enables interprocedural analysis — detecting issues like "function A checks access, but calls unguarded function B."

**Deliverables:**
- Clang plugin for Qubic C++ static analysis
- Call-graph construction
- Data-flow taint tracking for user-supplied inputs
- Integration with existing pattern engine (hybrid mode)

**Success Criteria:** Zero false positives on all 6 sample contracts; detect at least 3 new vulnerability classes.

---

### 🎯 Fuzzing Integration
**Why:** Static analysis misses runtime vulnerabilities. Fuzzing generates inputs that exercise code paths the scanner cannot reason about.

**Deliverables:**
- libFuzzer harness generator for Qubic contracts
- Crash corpus storage and replay
- Integration with QubicSecure dashboard (fuzz results tab)

---

## Q4 2026

### 🔗 CI/CD Webhook Mode
**Why:** Developers want automated audits on every commit, not manual uploads.

**Deliverables:**
- REST webhook endpoint (`POST /webhook/analyze`)
- GitHub App for PR status checks
- Configurable fail-threshold (e.g., "fail CI if Critical issues detected")
- Slack/Teams notification integration

**User Story:** As a Qubic developer, I want QubicSecure to comment on my PR with an audit summary so that I catch vulnerabilities before merging.

---

### 📚 Community Vulnerability Pattern Database
**Why:** The Qubic ecosystem is evolving. A community-maintained pattern DB ensures the scanner stays current without requiring a new release.

**Deliverables:**
- Versioned JSON pattern registry (`patterns/qubic-v1.json`)
- Auto-update mechanism (pull from registry on startup)
- Pattern submission workflow via GitHub PRs
- Pattern validation test suite

---

## Q1 2027

### 🤖 Fine-Tuned Qubic Audit LLM
**Why:** General-purpose LLMs hallucinate Qubic-specific details. A fine-tuned model reduces hallucination and improves precision.

**Deliverables:**
- Training corpus: 500+ manually audited Qubic contracts
- Fine-tuned LLaMA-3-8B checkpoint (open-source)
- Self-hosted inference option (no API key required)
- Benchmark vs. GPT-4o and Gemini 1.5 Flash

---

### 🌐 Multi-Chain Support
**Why:** WASM-based smart contracts on other chains share many vulnerability classes with Qubic C++.

**Deliverables:**
- Language detection (C++ vs. WASM text format)
- WASM-specific pattern library
- Chain selector in the UI

---

## Backlog (Unscheduled)

- [ ] VS Code extension for in-editor audit
- [ ] Audit history and report storage (database backend)
- [ ] Team collaboration features (shared workspaces)
- [ ] Severity threshold configuration per project
- [ ] Export findings as SARIF (Static Analysis Results Interchange Format)
- [ ] Integration with Qubic testnet for live contract deployment simulation

---

## How to Contribute to the Roadmap

Open a [Feature Request](https://github.com/YOUR-USERNAME/qubicsecure/issues/new?template=feature_request.md) on GitHub. Roadmap items with the most 👍 reactions get prioritised for the next quarter.
