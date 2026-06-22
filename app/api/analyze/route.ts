import { NextRequest, NextResponse } from 'next/server';
import { readContractFile } from '@/lib/utils/file-handler';
import { logger } from '@/lib/utils/logger';
import { performStaticAnalysis } from '@/lib/analyzers/static-analyzer';
import { performLLMAnalysisWithRetry } from '@/lib/llm/analyzer';
import { calculateRiskScore } from '@/lib/scoring/risk-calculator';
import { AnalysisResult, Issue } from '@/lib/types/analysis';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
    try {
        logger.info('AnalyzeAPI', 'Received analysis request');
        const body = await request.json();
        const { filePath, fileName } = body;

        if (!filePath) {
            return NextResponse.json({ error: 'No file path provided' }, { status: 400 });
        }

        const code = await readContractFile(filePath);

        // Step 1: Static Analysis
        logger.info('AnalyzeAPI', 'Starting static analysis');
        const staticResult = await performStaticAnalysis(code);
        console.log('Static findings:', staticResult.findings.length);

        // Step 2: LLM Analysis
        logger.info('AnalyzeAPI', 'Starting LLM analysis');
        const llmResult = await performLLMAnalysisWithRetry(code, staticResult.findings);

        // Step 3: Merge
        let finalResult: AnalysisResult;
        if (llmResult) {
            finalResult = llmResult;
        } else {
            finalResult = createFallbackResult(staticResult.findings);
        }

        // Calculate risk score
        const riskScore = calculateRiskScore(finalResult.issues);
        finalResult.summary.overall_risk_score = riskScore.score;
        finalResult.summary.risk_level = riskScore.level;

        return NextResponse.json({
            success: true,
            result: finalResult,
            metadata: {
                fileName,
                timestamp: new Date().toISOString(),
                analysisId: crypto.randomUUID(),
                staticAnalysisStats: staticResult.stats,
            },
        });

    } catch (error) {
        logger.error('AnalyzeAPI', 'Analysis failed', { error });
        return NextResponse.json(
            { error: 'Analysis failed: ' + (error instanceof Error ? error.message : 'Unknown error') },
            { status: 500 }
        );
    }
}

function createFallbackResult(findings: any[]): AnalysisResult {
    const issues: Issue[] = findings.map((finding, i) => ({
        id: finding.id || `static-${i}`,
        title: finding.title,
        severity: finding.severity,
        category: finding.category,
        description: finding.description,
        impact: buildImpactStatement(finding),
        exploit_scenario: finding.exploit_scenario || 'Manual code review required to determine exploitability in this specific context.',
        recommended_fix: finding.recommended_fix || 'Apply defensive programming patterns and consult Qubic security best practices.',
        source: 'Static' as const,
    }));

    const severityCounts = {
        Critical: issues.filter(i => i.severity === 'Critical').length,
        High:     issues.filter(i => i.severity === 'High').length,
        Medium:   issues.filter(i => i.severity === 'Medium').length,
        Low:      issues.filter(i => i.severity === 'Low').length,
    };

    const categoryCounts = {
        Security: issues.filter(i => i.category === 'Security').length,
        Trading:  issues.filter(i => i.category === 'Trading').length,
        Logic:    issues.filter(i => i.category === 'Logic').length,
    };

    const uniqueTitles = [...new Set(issues.map(i => i.title))];
    const criticalIssues = issues.filter(i => i.severity === 'Critical');
    const highIssues = issues.filter(i => i.severity === 'High');

    let verdict = '';

    if (issues.length === 0) {
        verdict = '✅ SAFE TO DEPLOY (Pending Manual Review)\n\nStatic analysis found no pattern-based vulnerabilities in this contract. The code structure does not match any of the 10 known vulnerability patterns for Qubic C++ contracts.\n\nWhile the automated scan is clean, a manual security review is still recommended before production deployment — static analysis cannot detect all classes of vulnerability, including complex business logic errors, access control misconfigurations not matching known patterns, or economic design flaws.';
    } else {
        if (severityCounts.Critical > 0) {
            verdict = `🚨 DO NOT DEPLOY — ${severityCounts.Critical} CRITICAL ISSUE${severityCounts.Critical > 1 ? 'S' : ''} DETECTED\n\n`;
        } else if (severityCounts.High > 0) {
            verdict = `⛔ NOT RECOMMENDED FOR DEPLOYMENT — ${severityCounts.High} HIGH-SEVERITY ISSUE${severityCounts.High > 1 ? 'S' : ''} REQUIRE RESOLUTION\n\n`;
        } else if (severityCounts.Medium > 0) {
            verdict = `⚠️ CONDITIONAL DEPLOYMENT — Resolve ${severityCounts.Medium} medium-severity issue${severityCounts.Medium > 1 ? 's' : ''} before production use\n\n`;
        } else {
            verdict = `✅ LOW RISK — Acceptable for deployment with acknowledged limitations\n\n`;
        }

        verdict += `SCAN SUMMARY\n`;
        verdict += `─────────────────────────────────────\n`;
        verdict += `Total issues: ${issues.length} across ${uniqueTitles.length} distinct vulnerability class${uniqueTitles.length > 1 ? 'es' : ''}\n`;
        if (severityCounts.Critical > 0) verdict += `• Critical: ${severityCounts.Critical} — immediate code changes required\n`;
        if (severityCounts.High > 0)     verdict += `• High: ${severityCounts.High} — should block deployment\n`;
        if (severityCounts.Medium > 0)   verdict += `• Medium: ${severityCounts.Medium} — review before production\n`;
        if (severityCounts.Low > 0)      verdict += `• Low: ${severityCounts.Low} — address in next iteration\n`;

        const activeCategories: string[] = [];
        if (categoryCounts.Security > 0) activeCategories.push(`${categoryCounts.Security} Security`);
        if (categoryCounts.Trading > 0)  activeCategories.push(`${categoryCounts.Trading} Trading`);
        if (categoryCounts.Logic > 0)    activeCategories.push(`${categoryCounts.Logic} Logic`);
        verdict += `\nCategory distribution: ${activeCategories.join(' · ')}\n`;

        if (criticalIssues.length > 0 || highIssues.length > 0) {
            verdict += `\nPRIORITY ACTIONS REQUIRED\n`;
            verdict += `─────────────────────────────────────\n`;
            [...criticalIssues, ...highIssues].slice(0, 4).forEach((issue, i) => {
                verdict += `${i + 1}. [${issue.severity}] ${issue.title}`;
                verdict += '\n';
            });
        }

        verdict += `\nSECURITY POSTURE\n`;
        verdict += `─────────────────────────────────────\n`;

        if (categoryCounts.Security > 0 && severityCounts.Critical > 0) {
            verdict += `Critical access control or reentrancy weaknesses make this contract directly exploitable without special privileges. Any on-chain address can trigger the vulnerable path.\n`;
        } else if (categoryCounts.Security > 0) {
            verdict += `Security-layer defenses are incomplete. Arithmetic and call-handling patterns create real attack surfaces that need hardening before deployment.\n`;
        }

        if (categoryCounts.Trading > 0) {
            verdict += `Trading functions lack MEV protection. Price manipulation and front-running are viable attack vectors extracting value from users on every transaction.\n`;
        }

        if (categoryCounts.Logic > 0) {
            verdict += `Logic-layer issues (unbounded loops, uninitialized variables) create operational risk that can escalate to permanent fund lock under adversarial conditions.\n`;
        }
    }

    return {
        summary: { overall_risk_score: 0, risk_level: 'Low' },
        issues,
        optimizations: generateOptimizations(issues, categoryCounts),
        final_verdict: verdict.trim(),
    };
}

function buildImpactStatement(finding: any): string {
    const fnCtx = finding.function_name ? ` Detected in function \`${finding.function_name}\`.` : '';
    const lineCtx = finding.line_start ? ` Line ~${finding.line_start}.` : '';
    const suffix = getImpactSuffix(finding.severity);
    return `${finding.description}${fnCtx}${lineCtx} ${suffix}`;
}

function getImpactSuffix(severity: string): string {
    switch (severity) {
        case 'Critical': return 'This class of vulnerability is directly exploitable and has caused complete fund loss in real-world contracts.';
        case 'High':     return 'Under specific conditions this can result in significant financial loss or permanent contract disruption.';
        case 'Medium':   return 'Exploitation requires some preconditions but is achievable by motivated actors.';
        default:         return 'Can compound with other issues to create more serious vulnerabilities.';
    }
}

function generateOptimizations(issues: Issue[], categoryCounts: Record<string, number>): any[] {
    const opts: any[] = [];

    if (categoryCounts.Security > 0) {
        opts.push({
            description: 'Implement a centralized role-bitmap access control registry',
            expected_benefit: 'Eliminates scattered per-function owner checks, reduces code duplication ~40%, and makes permission management auditable from a single source.',
        });
    }

    if (issues.some(i => i.title.includes('Overflow') || i.title.includes('Underflow'))) {
        opts.push({
            description: 'Extract all arithmetic into a SafeMath utility module with overflow/underflow assertions',
            expected_benefit: 'Makes arithmetic safety explicit and testable, reduces per-function boilerplate, ensures consistent protection across all numeric operations.',
        });
    }

    if (categoryCounts.Trading > 0) {
        opts.push({
            description: 'Add a circuit breaker with configurable per-block trade volume limits',
            expected_benefit: 'Automatically halts trading during anomalous price movement, limiting MEV extraction and providing time for human intervention.',
        });
    }

    if (categoryCounts.Logic > 0) {
        opts.push({
            description: 'Replace unbounded loops with an indexed pagination system',
            expected_benefit: 'Prevents gas exhaustion DoS and makes batch operations predictably cost-bounded under any array size.',
        });
    }

    opts.push({
        description: 'Add comprehensive event emissions for all state-changing operations',
        expected_benefit: 'Enables real-time monitoring, incident response, an immutable audit trail, and off-chain analytics.',
    });

    return opts;
}
