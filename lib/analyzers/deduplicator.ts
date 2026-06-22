import { StaticFinding, NormalizedFinding, Severity, Source } from '../types/analysis';
import { logger } from '../utils/logger';
import crypto from 'crypto';

/**
 * Deduplication Logic
 * Rules:
 * - Same function + same line range = same issue
 * - Retain highest severity
 * - Merge descriptions from multiple sources
 */

interface FindingKey {
    functionName: string;
    lineStart: number;
    lineEnd: number;
    title: string;
}

/**
 * Generate unique key for a finding
 */
function generateFindingKey(finding: StaticFinding): string {
    const key: FindingKey = {
        functionName: finding.function_name || 'global',
        lineStart: finding.line_start || 0,
        lineEnd: finding.line_end || 0,
        title: finding.title,
    };

    return JSON.stringify(key);
}

/**
 * Compare severity levels
 */
const SEVERITY_ORDER: Record<Severity, number> = {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1,
};

function isHigherSeverity(a: Severity, b: Severity): boolean {
    return SEVERITY_ORDER[a] > SEVERITY_ORDER[b];
}

/**
 * Deduplicate findings
 */
export function deduplicateFindings(findings: StaticFinding[], source: Source = 'Static'): NormalizedFinding[] {
    logger.info('Deduplication', 'Starting deduplication', { count: findings.length });

    const findingMap = new Map<string, NormalizedFinding>();

    for (const finding of findings) {
        const key = generateFindingKey(finding);
        const existing = findingMap.get(key);

        if (existing) {
            // Merge with existing finding
            if (isHigherSeverity(finding.severity, existing.severity)) {
                // Update to higher severity
                existing.severity = finding.severity;
            }

            // Add source if not already present
            if (!existing.sources.includes(source)) {
                existing.sources.push(source);
            }

            logger.debug('Deduplication', 'Merged duplicate finding', { title: finding.title });
        } else {
            // Add new finding
            const normalized: NormalizedFinding = {
                ...finding,
                id: crypto.randomUUID(),
                sources: [source],
            };

            findingMap.set(key, normalized);
        }
    }

    const deduplicated = Array.from(findingMap.values());

    logger.info('Deduplication', 'Deduplication complete', {
        original: findings.length,
        deduplicated: deduplicated.length,
        removed: findings.length - deduplicated.length,
    });

    return deduplicated;
}

/**
 * Merge findings from multiple sources
 */
export function mergeFindings(
    internalFindings: StaticFinding[],
    externalFindings: StaticFinding[]
): NormalizedFinding[] {
    logger.info('Deduplication', 'Merging findings from multiple sources');

    // Deduplicate internal findings
    const normalizedInternal = deduplicateFindings(internalFindings, 'Static');

    // Deduplicate external findings
    const normalizedExternal = deduplicateFindings(externalFindings, 'Static');

    // Merge both sets
    const allFindings = [...normalizedInternal, ...normalizedExternal];

    // Deduplicate again across sources
    const findingMap = new Map<string, NormalizedFinding>();

    for (const finding of allFindings) {
        const key = generateFindingKey(finding);
        const existing = findingMap.get(key);

        if (existing) {
            // Merge sources
            for (const source of finding.sources) {
                if (!existing.sources.includes(source)) {
                    existing.sources.push(source);
                }
            }

            // Keep highest severity
            if (isHigherSeverity(finding.severity, existing.severity)) {
                existing.severity = finding.severity;
            }
        } else {
            findingMap.set(key, finding);
        }
    }

    const merged = Array.from(findingMap.values());

    logger.info('Deduplication', 'Merge complete', {
        internal: normalizedInternal.length,
        external: normalizedExternal.length,
        merged: merged.length,
    });

    return merged;
}
