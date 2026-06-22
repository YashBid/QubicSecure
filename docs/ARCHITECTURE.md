# 🏗️ Architecture — QubicSecure

## Overview

QubicSecure is a **Next.js 14** web application with a TypeScript backend. All analysis runs server-side via Next.js API Routes. The frontend and backend share type definitions through `lib/types/analysis.ts`, ensuring type-safe communication.

---

## System Diagram

```
Browser (User)
    │
    │  Upload .cpp file
    ▼
POST /api/upload  ─────────────────────────────────────────
    │                                                      │
    │  Returns { filePath, fileName }                      │
    ▼                                                      │
POST /api/analyze                                          │
    │                                                      │
    ├─ 1. readContractFile(filePath)                       │
    │      lib/utils/file-handler.ts                       │
    │                                                      │
    ├─ 2. performStaticAnalysis(code)                      │
    │      lib/analyzers/static-analyzer.ts                │
    │         ├─ analyzeQubicContract()   → internal rules │
    │         ├─ analyzeWithExternalAPI() → stub (opt.)    │
    │         └─ mergeFindings()          → deduplicator   │
    │                                                      │
    ├─ 3. performLLMAnalysisWithRetry(code, staticFindings)│
    │      lib/llm/analyzer.ts                             │
    │         ├─ getLLMConfig()           → reads .env     │
    │         ├─ callGroq / callGemini    → API call       │
    │         │  / callOpenAI / callAnthropic              │
    │         └─ validateAndExtract()    → Zod validation  │
    │                                                      │
    ├─ 4. calculateRiskScore(issues)                       │
    │      lib/scoring/risk-calculator.ts                  │
    │         ├─ calculateRawScore()                        │
    │         └─ normalizeScore() (log₁₀ scale)            │
    │                                                      │
    └─ Returns AnalysisResult JSON ──────────────────────▶ Frontend
                                                           │
                                          ResultsDashboard │
                                          IssueCard        │
                                          ChartSection     │
                                          AnalysisStatus   │
                                                           │
                                 User clicks "Download" ───┘
                                          │
                              lib/pdf/client-generator.ts
                                          │
                                   .pdf downloaded
```

---

## Key Design Decisions

### Why Regex Instead of AST?
The first version uses regex pattern matching rather than building a full C++ AST. This was a deliberate trade-off:

**Pros:** Zero external dependencies, fast (< 100ms), works on any C++ variant  
**Cons:** Cannot trace data flow; some false positives on guarded arithmetic  

AST-based analysis is on the [roadmap](PRODUCT_ROADMAP.md) for Q3 2026.

### Why Support Multiple LLM Providers?
API availability, cost, and quality differ by user and over time. A provider-agnostic interface lets users:
- Use Groq's free tier during development
- Switch to GPT-4 for high-value contracts
- Use Gemini if Groq is down
- Run fully offline (static-only) with zero API dependency

### Why Logarithmic Risk Scoring?
Linear scoring saturates quickly. A contract with 10 Low issues would outscore one with 1 Critical on a linear scale — which is incorrect. The log-normalised formula ensures:
```
1 Critical (score ~38) < 2 Critical (score ~56) < 10 Critical (score ~100)
```

### Why Deduplicate?
Both the static engine and LLM can flag the same vulnerability. Without deduplication, a report might show "Integer Overflow" 4 times from different detection paths — which looks noisy and unprofessional.

---

## Data Types

All shared types are defined in `lib/types/analysis.ts` using **Zod** schemas, which serve dual purpose:
1. Runtime validation of LLM JSON output
2. TypeScript type inference (zero duplication)

```typescript
// Core types
Severity  = 'Critical' | 'High' | 'Medium' | 'Low'
Category  = 'Security' | 'Trading' | 'Logic'
Source    = 'Static' | 'LLM' | 'Correlated'
RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical'
```

---

## File Structure

```
lib/
├── analyzers/
│   ├── qubic-rules.ts      10 VulnerabilityPattern objects + analyzeQubicContract()
│   ├── static-analyzer.ts  Coordinator: runs internal + external, then deduplicates
│   ├── deduplicator.ts     mergeFindings() with composite key deduplication
│   └── external-api.ts     Stub for future third-party API integration
│
├── llm/
│   ├── analyzer.ts         getLLMConfig(), callGroq/Gemini/OpenAI/Anthropic, retry wrapper
│   ├── prompt.ts           SYSTEM_PROMPT constant + formatAnalysisContext()
│   └── validator.ts        validateAndExtract() — JSON extraction + Zod validation
│
├── scoring/
│   └── risk-calculator.ts  calculateRawScore() → normalizeScore() → mapToRiskLevel()
│
├── pdf/
│   ├── generator.ts        Server-side PDFKit report builder
│   └── client-generator.ts Client-side report builder (used in browser)
│
├── types/
│   └── analysis.ts         Zod schemas + TypeScript types for entire pipeline
│
└── utils/
    ├── file-handler.ts     readContractFile() with path sanitisation
    └── logger.ts           Structured logger (info/debug/warn/error)
```

---

## API Endpoints

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/upload` | `FormData { file }` | `{ filePath, fileName }` |
| POST | `/api/analyze` | `{ filePath, fileName }` | `{ result: AnalysisResult, metadata }` |
| POST | `/api/report` | `{ result, metadata }` | PDF binary |
