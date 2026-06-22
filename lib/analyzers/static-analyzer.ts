import { NormalizedFinding } from '../types/analysis';
import { logger } from '../utils/logger';
import { analyzeQubicContract } from './qubic-rules';
import { analyzeWithExternalAPI } from './external-api';
import { mergeFindings } from './deduplicator';

/**
 * Main Static Analysis Coordinator
 * Orchestrates internal and external analysis, then deduplicates
 */

export interface StaticAnalysisResult {
    findings: NormalizedFinding[];
    stats: {
        internalCount: number;
        externalCount: number;
        mergedCount: number;
        deduplicatedCount: number;
    };
}

/**
 * Perform complete static analysis
 */
export async function performStaticAnalysis(code: string): Promise<StaticAnalysisResult> {
    logger.info('StaticAnalyzer', 'Starting static analysis');

    // Run internal rule-based analyzer
    logger.info('StaticAnalyzer', 'Running internal Qubic analyzer');
    const internalFindings = await analyzeQubicContract(code);
    logger.info('StaticAnalyzer', 'Internal analysis complete', { count: internalFindings.length });

    // Run external API analyzer (if configured)
    logger.info('StaticAnalyzer', 'Running external API analyzer');
    const externalFindings = await analyzeWithExternalAPI(code);
    logger.info('StaticAnalyzer', 'External analysis complete', { count: externalFindings.length });

    // Merge and deduplicate findings
    logger.info('StaticAnalyzer', 'Merging and deduplicating findings');
    const normalizedFindings = mergeFindings(internalFindings, externalFindings);
    logger.info('StaticAnalyzer', 'Deduplication complete', { count: normalizedFindings.length });

    const result: StaticAnalysisResult = {
        findings: normalizedFindings,
        stats: {
            internalCount: internalFindings.length,
            externalCount: externalFindings.length,
            mergedCount: internalFindings.length + externalFindings.length,
            deduplicatedCount: normalizedFindings.length,
        },
    };

    logger.info('StaticAnalyzer', 'Static analysis complete', result.stats);

    return result;
}
