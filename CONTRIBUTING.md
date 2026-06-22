# 🤝 Contributing to QubicSecure

Thank you for your interest in contributing! QubicSecure is open to contributions of all kinds — from new vulnerability patterns, to UI improvements, to documentation.

---

## 📋 Table of Contents

- [Getting Started](#getting-started)
- [Adding a Vulnerability Pattern](#adding-a-vulnerability-pattern)
- [Adding an LLM Provider](#adding-an-llm-provider)
- [Adding a Sample Contract](#adding-a-sample-contract)
- [Code Style](#code-style)
- [Pull Request Checklist](#pull-request-checklist)

---

## Getting Started

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR-USERNAME/qubicsecure.git
cd qubicsecure

# 2. Install dependencies
npm install

# 3. Copy the environment template
cp .env.example .env

# 4. Run in development mode
npm run dev
```

---

## Adding a Vulnerability Pattern

Patterns live in [`lib/analyzers/qubic-rules.ts`](lib/analyzers/qubic-rules.ts).

Each pattern must have:

```typescript
{
    name: string;            // Short, descriptive name
    severity: Severity;      // 'Critical' | 'High' | 'Medium' | 'Low'
    category: Category;      // 'Security' | 'Trading' | 'Logic'
    pattern: RegExp;         // Regex matched against full contract source
    description: string;     // What the code does wrong (2–3 sentences)
    impact: string;          // Who loses what and how (concrete)
    exploit_scenario: string; // Step-by-step attack (≥3 steps)
    recommended_fix: string; // Specific C++ code fix
}
```

**Quality bar:**
- The pattern must have zero false positives on `samples/clean-zero.cpp` and `samples/safevault-hardened.cpp`
- The `exploit_scenario` must be a realistic, step-by-step attack — not generic advice
- The `recommended_fix` must include actual C++ code, not just a description

---

## Adding an LLM Provider

Provider logic is in [`lib/llm/analyzer.ts`](lib/llm/analyzer.ts).

1. Add the provider name to the `LLMProvider` union type
2. Add the API key lookup in `getLLMConfig()`
3. Add the default model in the `models` map
4. Add a `callYourProvider()` function following the same pattern as `callGroq()`
5. Add a `case` in the `switch` statement in `performLLMAnalysis()`
6. Document it in `.env.example`

---

## Adding a Sample Contract

Add a `.cpp` file to the [`samples/`](samples/) folder and update [`samples/README.md`](samples/README.md) with:

- File name
- Expected risk level
- Expected issue count and breakdown
- Key vulnerabilities or key security features

---

## Code Style

- **TypeScript**: Strict mode, no `any` where avoidable
- **Naming**: camelCase for functions/variables, PascalCase for types/classes
- **Comments**: Add JSDoc to all exported functions
- **Formatting**: Run `npm run lint` before committing

---

## Pull Request Checklist

Before submitting a PR, confirm:

- [ ] `npm run build` passes with no errors
- [ ] New patterns are tested against both vulnerable and clean sample contracts
- [ ] New code has no `console.log` left in production paths (use `logger.*` instead)
- [ ] `.env.example` is updated if you added a new env variable
- [ ] `CHANGELOG.md` is updated under `[Unreleased]`
- [ ] PR description explains the **why**, not just the what

---

## Reporting Issues

Use the GitHub Issues tab. Please include:
- What you expected to happen
- What actually happened
- The contract you tested (sanitised if needed)
- Your environment (OS, Node version, provider)
