import { Severity, RiskLevel, Issue } from '../types/analysis';
import { logger } from '../utils/logger';

/**
 * Risk Scoring Engine
 * Implements exact specification: Critical=10, High=6, Medium=3, Low=1
 * Normalizes to 0-100 scale and maps to risk levels
 */

const SEVERITY_WEIGHTS: Record<Severity, number> = {
    Critical: 10,
    High: 6,
    Medium: 3,
    Low: 1,
};

const RISK_LEVEL_THRESHOLDS = {
    Low: { min: 0, max: 20 },
    Medium: { min: 21, max: 40 },
    High: { min: 41, max: 70 },
    Critical: { min: 71, max: 100 },
} as const;

interface SeverityCounts {
    Critical: number;
    High: number;
    Medium: number;
    Low: number;
}

/**
 * Calculate raw risk score from issues
 */
function calculateRawScore(issues: Issue[]): number {
    const counts: SeverityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
    };

    issues.forEach(issue => {
        counts[issue.severity]++;
    });

    logger.info('RiskCalculation', 'Severity counts', counts);

    const rawScore =
        counts.Critical * SEVERITY_WEIGHTS.Critical +
        counts.High * SEVERITY_WEIGHTS.High +
        counts.Medium * SEVERITY_WEIGHTS.Medium +
        counts.Low * SEVERITY_WEIGHTS.Low;

    return rawScore;
}

/**
 * Normalize score to 0-100 scale
 * Uses logarithmic scaling to prevent saturation
 */
function normalizeScore(rawScore: number): number {
    if (rawScore === 0) return 0;

    // Logarithmic normalization with base adjustment
    // This ensures scores scale reasonably even with many issues
    const normalized = Math.min(100, (Math.log10(rawScore + 1) / Math.log10(101)) * 100);

    return Math.round(normalized);
}

/**
 * Map normalized score to risk level
 */
function mapToRiskLevel(score: number): RiskLevel {
    if (score >= RISK_LEVEL_THRESHOLDS.Critical.min) return 'Critical';
    if (score >= RISK_LEVEL_THRESHOLDS.High.min) return 'High';
    if (score >= RISK_LEVEL_THRESHOLDS.Medium.min) return 'Medium';
    return 'Low';
}

/**
 * Calculate overall risk score and level
 */
export function calculateRiskScore(issues: Issue[]): { score: number; level: RiskLevel } {
    logger.info('RiskCalculation', 'Starting risk calculation', { issueCount: issues.length });

    const rawScore = calculateRawScore(issues);
    logger.info('RiskCalculation', 'Raw score calculated', { rawScore });

    const normalizedScore = normalizeScore(rawScore);
    logger.info('RiskCalculation', 'Score normalized', { normalizedScore });

    const riskLevel = mapToRiskLevel(normalizedScore);
    logger.info('RiskCalculation', 'Risk level determined', { riskLevel });

    return {
        score: normalizedScore,
        level: riskLevel,
    };
}

/**
 * Get severity distribution
 */
export function getSeverityDistribution(issues: Issue[]): SeverityCounts {
    const counts: SeverityCounts = {
        Critical: 0,
        High: 0,
        Medium: 0,
        Low: 0,
    };

    issues.forEach(issue => {
        counts[issue.severity]++;
    });

    return counts;
}
