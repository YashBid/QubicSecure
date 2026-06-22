import { StaticFinding, Severity, Category } from '../types/analysis';
import { logger } from '../utils/logger';

/**
 * Qubic Smart Contract Vulnerability Detection Rules
 * Pattern-based static analysis for C++ Qubic contracts
 */

interface VulnerabilityPattern {
    name: string;
    severity: Severity;
    category: Category;
    pattern: RegExp;
    description: string;
    impact: string;
    exploit_scenario: string;
    recommended_fix: string;
}

const VULNERABILITY_PATTERNS: VulnerabilityPattern[] = [
    {
        name: 'Integer Overflow Risk',
        severity: 'High',
        category: 'Security',
        pattern: /(\w+)\s*=\s*(\w+)\s*\+\s*(\w+)/g,
        description: 'Unchecked integer addition detected. In C++ Qubic contracts, uint64_t arithmetic wraps silently on overflow without throwing — the result becomes a tiny number instead of the expected large value.',
        impact: 'An attacker can cause the addition result to wrap to near-zero, enabling them to mint large token amounts that register as small balances, bypass balance checks that rely on the total being above a threshold, or corrupt accounting state that other contract functions depend on.',
        exploit_scenario: 'If `totalSupply = totalSupply + mintAmount` overflows, an attacker who controls `mintAmount` can pass a value that causes totalSupply to wrap to 0 or 1. Subsequent checks like `require(totalSupply <= MAX_SUPPLY)` will pass incorrectly, and the internal ledger will be permanently corrupted — all users holding tokens will see incorrect balances.',
        recommended_fix: 'Add an explicit pre-addition overflow check: `if (amount > UINT64_MAX - balance) revert("Overflow")`. Alternatively define a safe-add helper: `uint64_t safeAdd(uint64_t a, uint64_t b) { assert(b <= UINT64_MAX - a); return a + b; }` and use it for every arithmetic operation involving user-supplied values.',
    },
    {
        name: 'Integer Underflow Risk',
        severity: 'High',
        category: 'Security',
        pattern: /(\w+)\s*=\s*(\w+)\s*-\s*(\w+)/g,
        description: 'Unchecked integer subtraction detected. Subtracting a larger uint64_t from a smaller one silently wraps to near UINT64_MAX (~18.4 quintillion), not a negative number.',
        impact: 'An underflow in a balance subtraction transforms what should be a revert into granting the caller an astronomically large balance. Any downstream check of `balance >= threshold` will pass, and the attacker can withdraw or transfer far more than they own.',
        exploit_scenario: 'If `balance = balance - withdrawAmount` executes when `withdrawAmount > balance`, the result wraps to UINT64_MAX. The attacker now effectively has unlimited funds in the contract\'s internal ledger. A single call can drain the entire contract by withdrawing in chunks equal to the newly wrapped balance.',
        recommended_fix: 'Always check `if (amount > balance) revert("Insufficient funds")` before any subtraction. For compound updates, validate each operand independently. Consider a dedicated safe-sub: `uint64_t safeSub(uint64_t a, uint64_t b) { assert(a >= b); return a - b; }`.',
    },
    {
        name: 'Missing Access Control',
        severity: 'Critical',
        category: 'Security',
        pattern: /void\s+(withdraw|transfer|send|updatePrice|setOwner|destroy|mint|burn|pause|upgrade)\s*\(/gi,
        description: 'Privileged function has no visible caller authentication. Functions that move funds, change ownership, or alter critical contract state must verify the caller identity before executing.',
        impact: 'Any address on the Qubic network can call this function and execute its logic. This is the most common and devastating class of smart contract vulnerability — it allows complete fund drain, ownership hijacking, supply manipulation, or contract self-destruction by any actor.',
        exploit_scenario: 'An attacker discovers the unguarded function via on-chain inspection, calls it directly with their wallet address as the recipient, and drains all funds or transfers ownership to themselves. No special knowledge is required — the absence of a check means the first caller wins. This has caused hundreds of millions in DeFi losses historically.',
        recommended_fix: 'Add `if (msg.sender != owner) revert("Unauthorized")` as the very first statement in the function body. For multi-role systems, implement a role bitmap and check `hasRole(ADMIN_ROLE, msg.sender)`. Ensure the `owner` variable is set in the constructor and cannot be set to `address(0)`.',
    },
    {
        name: 'Reentrancy Vulnerability',
        severity: 'Critical',
        category: 'Security',
        pattern: /\.call\([^)]*\)[^}]*balance\s*=/gs,
        description: 'External call is made before internal state (balance) is updated — a violation of the Checks-Effects-Interactions (CEI) pattern. The external contract can re-enter this function before the balance variable is decremented.',
        impact: 'A malicious contract as the recipient can re-enter the withdraw function recursively. Each re-entrant call sees the original unmodified balance, passes the balance check, and triggers another transfer. This continues until the contract is fully drained, at which point the call stack unwinds and all balance subtractions happen — but by then the funds are gone.',
        exploit_scenario: 'Attacker deploys a malicious contract whose `receive()` function calls back into the vulnerable `withdraw()`. The sequence: (1) Attacker deposits 1 QUBIC, (2) calls withdraw(1), (3) the vulnerable contract calls attacker.receive(), (4) attacker re-enters withdraw(1) again — still sees balance = 1 because the state update hasn\'t run, (5) repeats until drained.',
        recommended_fix: 'Update all state variables BEFORE making any external calls: `balance -= amount; // first` then `recipient.call(amount); // then`. Add a reentrancy guard mutex: `bool private _locked; modifier noReentrant() { require(!_locked); _locked = true; _; _locked = false; }`.',
    },
    {
        name: 'Unchecked External Call Return',
        severity: 'Medium',
        category: 'Security',
        pattern: /\.call\(/g,
        description: 'External call made without checking or handling its return value. In Qubic C++, a failed external call does not automatically revert the transaction — it silently returns false.',
        impact: 'If the external call fails (recipient is a contract that reverts, runs out of gas, or is not deployed), the calling contract continues execution as if the call succeeded. This creates phantom transfers — the contract\'s internal state says funds were sent, but they weren\'t. The recipient never gets funds, but the sender\'s balance is still decremented.',
        exploit_scenario: 'A contract marks a payment as "sent" after calling `recipient.call(amount)` without checking the return value. If the recipient is a self-destructed contract, the call silently fails, the payment is permanently lost, but the contract\'s accounting marks it as paid — creating an irrecoverable fund lock.',
        recommended_fix: 'Capture and assert the return value: `(bool success, ) = recipient.call{value: amount}(""); require(success, "Transfer failed");`. For token transfers, use a checked transfer pattern and emit events only after confirmed success. Never update accounting state based on unverified external calls.',
    },
    {
        name: 'Price Manipulation Risk',
        severity: 'High',
        category: 'Trading',
        pattern: /price\s*=\s*\w+/gi,
        description: 'Contract price is set via a direct assignment without oracle validation, time-weighting, or access restriction. This price likely feeds into swap or valuation calculations.',
        impact: 'An attacker controlling or influencing the price source can set an arbitrarily high or low price, execute trades at manipulated rates, then restore the price — extracting value from liquidity providers or other users in a single block. Flash loans amplify this to massive scale with zero upfront capital.',
        exploit_scenario: 'Using a flash loan, attacker: (1) borrows 10M QUBIC, (2) calls setPrice() to set price 100x higher, (3) sells their existing tokens at the inflated price, (4) repays the flash loan, (5) profit. The entire attack happens in one transaction, making it nearly impossible to detect until after the fact.',
        recommended_fix: 'Never allow direct price setting by any single caller. Instead use a Chainlink-style oracle with staleness checks, or implement a TWAP (Time-Weighted Average Price): accumulate price × time over N blocks and divide. Require at least `MIN_OBSERVATION_PERIOD` seconds to pass before a new price takes effect.',
    },
    {
        name: 'Front-Running Exposure',
        severity: 'Medium',
        category: 'Trading',
        pattern: /void\s+(swap|trade|buy|sell|exchange)\s*\([^)]*\)/gi,
        description: 'Trading function accepts an exact input/output amount with no slippage tolerance or deadline parameter. Miners or bots monitoring the mempool can sandwich this transaction.',
        impact: 'A sandwich attack extracts value from every trade. The attacker front-runs the victim\'s buy by buying first (driving price up), lets the victim buy at a worse price, then immediately sells (back-running) at the inflated price. The victim receives fewer tokens than expected, the attacker profits, and the liquidity provider is worse off.',
        exploit_scenario: 'User submits swap(1000 QUBIC → TOKEN). An MEV bot sees this in the mempool, inserts its own buy before it (raising TOKEN price), lets the user\'s trade execute at worse rate, then sells immediately after. The user gets 15% fewer tokens than the quoted price — with no recourse since the transaction completed "successfully".',
        recommended_fix: 'Add a `minAmountOut` parameter that the caller specifies: `require(actualOut >= minAmountOut, "Slippage exceeded")`. Add a `deadline` parameter: `require(block.timestamp <= deadline, "Expired")`. For larger pools, implement a price impact limit that reverts trades moving price more than N%.',
    },
    {
        name: 'Unbounded Loop',
        severity: 'Medium',
        category: 'Logic',
        pattern: /for\s*\([^)]*\.length[^)]*\)/g,
        description: 'Loop bound depends on a dynamic array whose length can grow unboundedly. In Qubic\'s execution model, loops consume computational resources proportional to iteration count with no hard upper limit.',
        impact: 'As the array grows (through normal usage or adversarial inflation), the gas/compute cost of calling this function grows linearly until it becomes unaffordable or hits execution limits. This creates a Denial of Service vector — critical functions like withdraw, distribute, or process become permanently uncallable once the array is large enough.',
        exploit_scenario: 'An attacker repeatedly calls a registration/participation function to bloat the array to 10,000+ entries. The next time the contract owner tries to call `processAll()`, the transaction runs out of gas midway, reverts, and leaves the contract in an inconsistent half-processed state. Funds may become permanently locked if the function cannot complete.',
        recommended_fix: 'Replace the loop with pagination: `function process(uint startIndex, uint batchSize) external`. Add a hard cap check: `require(array.length <= MAX_ENTRIES, "Too many entries")`. For distributing funds, switch to a pull model where each recipient calls their own claim function rather than having one function iterate all recipients.',
    },
    {
        name: 'Timestamp Dependence',
        severity: 'Low',
        category: 'Logic',
        pattern: /timestamp\s*[<>=]/g,
        description: 'Contract logic branches based on `block.timestamp`. In Qubic, validators have a small but non-zero ability to influence the timestamp of blocks they produce within the allowed drift window.',
        impact: 'For time-sensitive operations like auctions, vesting cliffs, or lottery draws, a validator running a node can manipulate the timestamp by a few seconds to minutes to push an outcome in their favor — specifically, delaying or advancing the deadline to either participate at the last moment or prevent others from doing so.',
        exploit_scenario: 'A contract runs an auction that ends at `block.timestamp >= auctionEndTime`. A validator who wants to win submits their bid and simultaneously mines a block with `timestamp = auctionEndTime - 1`, keeping the auction open long enough for their bid to be the last. Then immediately mines another block with `timestamp = auctionEndTime + 1` to close the auction.',
        recommended_fix: 'For low-precision timing (hours/days), timestamps are acceptable. For precise deadlines (minutes/seconds), use block numbers as a proxy for time since they are manipulation-resistant. Add a grace period buffer of at least 60 seconds to any timestamp comparison. Never use timestamps for randomness or lottery mechanics.',
    },
    {
        name: 'Uninitialized State Variable',
        severity: 'Medium',
        category: 'Logic',
        pattern: /(?:uint64_t|uint32_t|uint|int|bool|address)\s+(\w+);(?![^\n]*=)/g,
        description: 'State variable declared without explicit initialization. In C++, uninitialized variables contain undefined values (garbage memory), not zero. In Qubic contracts this behavior depends on the runtime, but relying on implicit zero-initialization is a dangerous assumption.',
        impact: 'Functions that check or compute using this variable before it is explicitly set will operate on garbage data or 0, whichever the runtime provides. This can silently skip execution paths, incorrectly pass/fail validation checks, or corrupt derived calculations that feed into financial logic.',
        exploit_scenario: 'If `bool isPaused` is declared but not initialized, the initial value is implementation-defined. If the contract is deployed and `isPaused` happens to be `true` (non-zero memory garbage), all operations guarded by `if (!isPaused)` will be blocked from the first block, effectively making the contract permanently non-functional without the owner realizing it.',
        recommended_fix: 'Explicitly initialize every state variable at declaration: `uint64_t balance = 0; bool isPaused = false; address owner = address(0);`. In the constructor, set all configurable variables explicitly even if their value is 0 or false. Never rely on runtime implicit zero-initialization for contract correctness.',
    },
];

/**
 * Analyze contract code for vulnerabilities
 */
export async function analyzeQubicContract(code: string): Promise<StaticFinding[]> {
    logger.info('StaticAnalysis', 'Starting Qubic contract analysis');
    console.log('=== ANALYZING CONTRACT ===');
    console.log('Code length:', code.length);

    const findings: StaticFinding[] = [];
    const lines = code.split('\n');

    for (const pattern of VULNERABILITY_PATTERNS) {
        const matches = Array.from(code.matchAll(pattern.pattern));

        if (matches.length > 0) {
            console.log(`✓ Pattern "${pattern.name}" found ${matches.length} match(es)`);
        }

        for (const match of matches) {
            const matchIndex = match.index || 0;
            const lineNumber = code.substring(0, matchIndex).split('\n').length;
            const functionMatch = extractFunctionContext(code, matchIndex);

            findings.push({
                title: pattern.name,
                severity: pattern.severity,
                category: pattern.category,
                description: pattern.description,
                exploit_scenario: pattern.exploit_scenario,
                recommended_fix: pattern.recommended_fix,
                line_start: lineNumber,
                line_end: lineNumber,
                function_name: functionMatch?.functionName,
            });

            logger.debug('StaticAnalysis', `Found: ${pattern.name}`, { line: lineNumber });
        }
    }

    console.log(`=== ANALYSIS COMPLETE: ${findings.length} findings ===`);
    logger.info('StaticAnalysis', 'Analysis complete', { findingsCount: findings.length });

    return findings;
}

function extractFunctionContext(code: string, position: number): { functionName: string } | null {
    const beforeMatch = code.substring(0, position);
    const functionPattern = /(?:void|int|uint|bool|address)\s+(\w+)\s*\([^)]*\)\s*{[^}]*$/;
    const match = beforeMatch.match(functionPattern);
    if (match) return { functionName: match[1] };
    return null;
}

export function getContractStats(code: string): { lines: number; functions: number; complexity: number } {
    const lines = code.split('\n').length;
    const functionMatches = code.match(/(?:void|int|uint|bool|address)\s+\w+\s*\([^)]*\)\s*{/g);
    const functions = functionMatches ? functionMatches.length : 0;
    const controlFlowMatches = code.match(/\b(if|for|while|switch|case)\b/g);
    const complexity = controlFlowMatches ? controlFlowMatches.length : 0;
    return { lines, functions, complexity };
}
