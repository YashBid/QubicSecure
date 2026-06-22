<div align="center">

# 🔐 QubicSecure

### Automated Smart Contract Security Auditor for Qubic C++

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-brightgreen?style=for-the-badge)](CONTRIBUTING.md)

**Upload a Qubic C++ smart contract. Get a full security audit in under 30 seconds.**

[📖 Research Paper](docs/RESEARCH_PAPER.md) · [🗺️ Roadmap](docs/PRODUCT_ROADMAP.md) · [🤝 Contribute](CONTRIBUTING.md) · [🐛 Report Bug](https://github.com/YOUR-USERNAME/qubicsecure/issues)

</div>

---

QubicSecure scans Qubic C++ smart contracts for security vulnerabilities using pattern-based static analysis and optional LLM-powered deep scanning. It generates a risk score and a downloadable audit report.

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🔬 **Static Analysis** | 10 hand-crafted vulnerability patterns tuned for Qubic C++ semantics |
| 🧠 **LLM Deep Scan** | AI-powered semantic analysis via Groq, Gemini, OpenAI, or Claude |
| 📊 **Risk Scoring** | Logarithmically normalised 0–100 risk score across 4 severity levels |
| 🔁 **Deduplication** | Cross-source finding merge so you never see the same issue twice |
| 📄 **PDF Reports** | Professional, downloadable audit reports with executive summary |
| ⚡ **< 30 Second Analysis** | From upload to full dashboard in under 30 seconds |
| 🎨 **Modern UI** | Dark glassmorphism interface with animated pipeline visualiser |

---

## 🛡️ What It Detects

<table>
<tr>
<th>🔴 Security</th>
<th>🟡 Trading</th>
<th>🔵 Logic</th>
</tr>
<tr>
<td>

- Integer Overflow
- Integer Underflow
- Missing Access Control
- Reentrancy Vulnerability
- Unchecked External Calls

</td>
<td>

- Price Manipulation
- Front-Running Exposure
- Missing Slippage Protection
- MEV Attack Vectors

</td>
<td>

- Unbounded Loops (DoS)
- Timestamp Dependence
- Uninitialized State Variables

</td>
</tr>
</table>

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/YOUR-USERNAME/qubicsecure.git
cd qubicsecure
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Add your API key (free tier works fine)
```

### 3. Run
```bash
npm run dev
# Open http://localhost:3000
```

**That's it.** Upload any `.cpp` Qubic smart contract and get your audit.

> 💡 **No API key?** The system works in **static-only mode** out of the box — no configuration needed.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        QubicSecure                          │
│                                                             │
│  ┌────────────┐      ┌──────────────────────────────────┐  │
│  │  Frontend  │      │          Analysis Pipeline        │  │
│  │            │      │                                   │  │
│  │ UploadZone │─────▶│  1. Static Analyzer               │  │
│  │  Analysis  │      │     └─ 10 regex patterns          │  │
│  │   Status   │      │                                   │  │
│  │  Results   │      │  2. LLM Deep Scan                 │  │
│  │ Dashboard  │      │     
│  │  IssueCard │      │                                   │  │
│  │   Charts   │◀─────│  3. Deduplication & Merge         │  │
│  └────────────┘      │     └─ composite key algorithm    │  │
│                       │                                   │  │
│                       │  4. Risk Scoring Engine           │  │
│                       │     └─ log-normalised 0-100       │  │
│                       │                                   │  │
│                       │  5. PDF Report Generator          │  │
│                       └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

**Tech Stack:** Next.js 14 · TypeScript · Tailwind CSS · Zod · PDFKit · Groq SDK

---


## 📊 Risk Scoring Model

| Severity | Weight | Score Range | Risk Level |
|----------|--------|------------|-----------|
| 🔴 Critical | ×10 | 71–100 | Critical |
| 🟠 High | ×6 | 41–70 | High |
| 🟡 Medium | ×3 | 21–40 | Medium |
| 🟢 Low | ×1 | 0–20 | Low |

*Scores are logarithmically normalised to prevent saturation from many minor issues.*

---

## 📁 Project Structure

```
qubicsecure/
├── app/
│   ├── api/
│   │   ├── analyze/route.ts      # Main analysis pipeline endpoint
│   │   ├── upload/route.ts       # File upload handler
│   │   └── report/route.ts       # PDF report endpoint
│   ├── page.tsx                  # Main application page
│   ├── layout.tsx                # App layout & metadata
│   └── globals.css               # Design system & animations
├── components/
│   ├── UploadZone.tsx            # Drag-and-drop file upload
│   ├── AnalysisStatus.tsx        # Animated pipeline progress tracker
│   ├── ResultsDashboard.tsx      # Tabbed results view
│   ├── IssueCard.tsx             # Individual vulnerability display
│   └── ChartSection.tsx          # Severity distribution charts
├── lib/
│   ├── analyzers/
│   │   ├── qubic-rules.ts        # 10 vulnerability pattern definitions
│   │   ├── static-analyzer.ts    # Analysis coordinator
│   │   ├── deduplicator.ts       # Cross-source finding merge
│   │   └── external-api.ts       # External API integration stub
│   ├── llm/
│   │   ├── analyzer.ts           # Multi-provider LLM dispatcher
│   │   ├── prompt.ts             # Audit system prompt & context builder
│   │   └── validator.ts          # Zod schema validation for LLM output
│   ├── scoring/
│   │   └── risk-calculator.ts    # Severity-weighted risk scoring engine
│   ├── pdf/
│   │   ├── generator.ts          # Server-side PDF generation (PDFKit)
│   │   └── client-generator.ts   # Client-side report builder
│   ├── types/
│   │   └── analysis.ts           # Shared TypeScript types & Zod schemas
│   └── utils/
│       ├── file-handler.ts       # Secure file read utilities
│       └── logger.ts             # Structured logging
├── samples/                      # Example contracts for testing
│   ├── README.md                 # Sample descriptions & expected results
│   ├── vulnerable-critical.cpp   # High-risk contract (do not deploy)
│   ├── vulnerable-medium.cpp     # Medium-risk contract
│   ├── safe-low.cpp              # Mostly safe contract
│   ├── clean-zero.cpp            # Zero-vulnerability contract
│   ├── safevault-hardened.cpp    # Hardened reference implementation
│   └── config-store.cpp          # Minimal clean contract
├── docs/
│   ├── ARCHITECTURE.md           # Deep-dive system design
│   ├── VULNERABILITY_PATTERNS.md # Pattern reference guide
│   ├── PRODUCT_ROADMAP.md        # Feature roadmap & milestones
│   └── RESEARCH_PAPER.md         # IEEE-style research paper
├── .env.example                  # Environment variable template
├── CONTRIBUTING.md               # Contribution guidelines
├── CHANGELOG.md                  # Version history
├── SECURITY.md                   # Security disclosure policy
└── LICENSE                       # MIT License
```

---

## 🧪 Sample Contracts

Try QubicSecure with the included sample contracts in [`samples/`](samples/):

| File | Risk Level | Key Issues |
|------|-----------|-----------|
| `vulnerable-critical.cpp` | 🔴 Critical | Reentrancy, missing access control, overflow |
| `vulnerable-medium.cpp` | 🟠 High | Arithmetic bugs, front-running |
| `safe-low.cpp` | 🟢 Low | Minor timestamp dependence only |
| `clean-zero.cpp` | ✅ Zero | No issues detected |
| `safevault-hardened.cpp` | ✅ Zero | Reference hardened implementation |

---




## 📄 License

MIT © [Bid Sakshi](https://github.com/YOUR-USERNAME)

---

<div align="center">

**Built for the Qubic ecosystem** · Star ⭐ if this helped you

</div>
