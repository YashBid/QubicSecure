# 🧪 Sample Contracts

Test QubicSecure with these contracts. Upload any `.cpp` file at `http://localhost:3000`.

---

## File Index

| File | Risk Level | Issues | Purpose |
|------|-----------|--------|---------|
| [`vulnerable-critical.cpp`](vulnerable-critical.cpp) | 🔴 Critical | 7–9 | Demonstrates all major vulnerability classes |
| [`vulnerable-medium.cpp`](vulnerable-medium.cpp) | 🟠 High | 5–6 | Partial protections with remaining flaws |
| [`safe-low.cpp`](safe-low.cpp) | 🟢 Low | 1 | Well-written contract with minor timestamp use |
| [`clean-zero.cpp`](clean-zero.cpp) | ✅ Zero | 0 | Passes all static checks |
| [`safevault-hardened.cpp`](safevault-hardened.cpp) | ✅ Zero | 0 | Reference hardened implementation |
| [`config-store.cpp`](config-store.cpp) | ✅ Zero | 0 | Minimal clean utility contract |

---

## Expected Results

### `vulnerable-critical.cpp` — 🔴 DO NOT DEPLOY
- Missing access control on `withdraw`, `mint`, `updatePrice`
- Reentrancy in `transfer` (external call before state update)
- Integer overflow in `swap` and `mint`
- Integer underflow in `withdraw`
- Price manipulation via unguarded `updatePrice`
- Unbounded loop over dynamic array
- Timestamp dependence

### `vulnerable-medium.cpp` — 🟠 Fix Before Deploying
- Integer underflow in `withdraw` (despite owner check)
- Integer overflow in `swap`
- Unchecked external call in `sendFunds`
- Front-running exposure in `swap`
- Unbounded loop in `batchProcess`

### `safe-low.cpp` — 🟢 Mostly Safe
- Proper access control on all sensitive functions
- Overflow/underflow checks before every arithmetic op
- Checks-Effects-Interactions pattern followed
- One flagged item: timestamp comparison (acceptable for time windows)

### `clean-zero.cpp` — ✅ Zero Issues
- Compound assignment operators (`+=`, `-=`) avoid pattern triggers
- Bounded loops with compile-time constants
- No external calls
- No privileged function names matching dangerous patterns

### `safevault-hardened.cpp` — ✅ Reference Implementation
The gold standard. Deliberately engineered to pass all 10 vulnerability patterns:
- `canAdd()` overflow-safe helper
- Fixed-size `ledger[MAX_ENTRIES]` array — never dynamic
- All vars explicitly initialized
- `callerIsOwner()` checked at the top of every state-modifying function
- Zero `.call()` usage

### `config-store.cpp` — ✅ Clean Utility
A minimal configuration store with no arithmetic, no external calls, and bounded loops.
