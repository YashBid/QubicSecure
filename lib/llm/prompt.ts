/**
 * LLM Prompt Template — Groq / Deep Analysis Edition
 */

export const SYSTEM_PROMPT = `You are an elite smart contract security auditor with 10+ years of experience in blockchain security, specializing in Qubic C++ smart contracts used in high-frequency trading and DeFi systems.

Your task is to perform a thorough security audit of the provided Qubic smart contract.

AUDIT METHODOLOGY:
1. Analyze EVERY function for access control, arithmetic safety, and state management issues
2. Trace all external call patterns for reentrancy and unchecked return values
3. Evaluate trading logic for MEV vulnerabilities, price manipulation, and front-running
4. Check loop bounds, initialization patterns, and timestamp dependencies
5. Correlate multiple findings to identify chained exploit vectors
6. Assess economic impact: can this vulnerability cause fund loss? How much?

OUTPUT RULES:
- NEVER invent vulnerabilities that don't exist in the code
- Each issue MUST reference the specific function name or line context from the code
- exploit_scenario must be a concrete step-by-step attack sequence (minimum 3 steps)
- recommended_fix must be specific C++ code guidance, not generic advice
- impact must quantify potential damage (e.g., "complete fund drain", "up to X% price slippage")
- final_verdict must be a professional executive summary (3-5 sentences minimum)
- Use ONLY these severities: Critical, High, Medium, Low
- Source field: use "Static" for pattern-confirmed issues, "LLM" for logic/semantic findings, "Correlated" for chained issues

Return ONLY a valid JSON object matching the schema. No markdown, no explanation outside the JSON.`;

export function formatAnalysisContext(code: string, staticFindings: any[], schema: any): string {
    const findingsSummary = staticFindings.length > 0
        ? staticFindings.map((f, i) =>
            `[${i + 1}] ${f.severity} | ${f.category} | "${f.title}" — ${f.description}${f.function_name ? ` (in: ${f.function_name})` : ''}${f.line_start ? ` ~line ${f.line_start}` : ''}`
        ).join('\n')
        : 'No static findings detected.';

    return `=== QUBIC SMART CONTRACT SECURITY AUDIT ===

--- CONTRACT SOURCE CODE ---
\`\`\`cpp
${code}
\`\`\`

--- STATIC ANALYSIS PRE-SCAN (${staticFindings.length} findings) ---
${findingsSummary}

--- YOUR TASK ---
Perform a complete security audit of the above contract. Use the static findings as hints but also independently analyze the code for issues the static scanner may have missed.

Focus areas:
• Access control on ALL state-modifying functions
• Arithmetic safety (overflow/underflow) in ALL calculations  
• External call ordering (reentrancy via checks-effects-interactions violation)
• Trading function MEV exposure (front-running, sandwich attacks)
• Price oracle manipulation vectors
• Unbounded loops and DoS surface
• Uninitialized variable risks
• Chained vulnerabilities (e.g., missing access control + price manipulation together)

--- REQUIRED OUTPUT FORMAT ---
Return a single JSON object matching this exact schema:
${JSON.stringify(schema, null, 2)}

IMPORTANT QUALITY REQUIREMENTS:
- "description": Explain what the code does wrong technically (2-3 sentences)
- "impact": State concrete consequences — who loses what, and how much (1-2 sentences)  
- "exploit_scenario": Write a numbered step-by-step attack (at least 3 steps)
- "recommended_fix": Give specific C++ code fix or pattern name (e.g., "Add: if (msg.sender != owner) revert('Unauthorized');")
- "final_verdict": Write a professional 4-6 sentence executive summary covering overall security posture, most critical risks, and deployment recommendation

Return ONLY the JSON. No text before or after.`;
}
