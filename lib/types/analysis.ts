import { z } from 'zod';

// Severity levels - EXACTLY as specified
export const SeverityEnum = z.enum(['Critical', 'High', 'Medium', 'Low']);
export type Severity = z.infer<typeof SeverityEnum>;

// Issue categories
export const CategoryEnum = z.enum(['Security', 'Trading', 'Logic']);
export type Category = z.infer<typeof CategoryEnum>;

// Source of finding
export const SourceEnum = z.enum(['Static', 'LLM', 'Correlated']);
export type Source = z.infer<typeof SourceEnum>;

// Risk level mapping
export const RiskLevelEnum = z.enum(['Low', 'Medium', 'High', 'Critical']);
export type RiskLevel = z.infer<typeof RiskLevelEnum>;

// Issue schema
export const IssueSchema = z.object({
    id: z.string(),
    title: z.string(),
    severity: SeverityEnum,
    category: CategoryEnum,
    description: z.string(),
    impact: z.string(),
    exploit_scenario: z.string(),
    recommended_fix: z.string(),
    source: SourceEnum,
});
export type Issue = z.infer<typeof IssueSchema>;

// Optimization schema (NO severity field)
export const OptimizationSchema = z.object({
    description: z.string(),
    expected_benefit: z.string(),
});
export type Optimization = z.infer<typeof OptimizationSchema>;

// Summary schema
export const SummarySchema = z.object({
    overall_risk_score: z.number().min(0).max(100),
    risk_level: RiskLevelEnum,
});
export type Summary = z.infer<typeof SummarySchema>;

// Complete analysis result schema
export const AnalysisResultSchema = z.object({
    summary: SummarySchema,
    issues: z.array(IssueSchema),
    optimizations: z.array(OptimizationSchema),
    final_verdict: z.string(),
});
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

// Static finding (internal format before normalization)
export interface StaticFinding {
    title: string;
    severity: Severity;
    category: Category;
    description: string;
    exploit_scenario?: string;
    recommended_fix?: string;
    line_start?: number;
    line_end?: number;
    function_name?: string;
    file_path?: string;
}

// Normalized finding (after deduplication)
export interface NormalizedFinding extends StaticFinding {
    id: string;
    sources: Source[];
}
