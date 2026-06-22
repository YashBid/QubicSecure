import PDFDocument from 'pdfkit';
import { AnalysisResult, Issue, Optimization } from '../types/analysis';
import { logger } from '../utils/logger';

/**
 * PDF Audit Report Generator
 * Creates professional, formatted PDF reports
 */

interface ReportMetadata {
    contractName: string;
    contractHash: string;
    timestamp: string;
    analysisId: string;
}

/**
 * Generate PDF audit report
 */
export async function generatePDFReport(
    result: AnalysisResult,
    metadata: ReportMetadata
): Promise<Buffer> {
    logger.info('PDFGenerator', 'Starting PDF generation');

    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: 'A4', margin: 50 });
            const chunks: Buffer[] = [];

            // Collect PDF data
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(chunks);
                logger.info('PDFGenerator', 'PDF generation complete', { size: pdfBuffer.length });
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Header
            addHeader(doc, metadata);

            // Executive Summary
            addExecutiveSummary(doc, result);

            // Risk Score Visualization
            addRiskScoreSection(doc, result);

            // Issues
            addIssuesSection(doc, result.issues);

            // Optimizations
            if (result.optimizations.length > 0) {
                addOptimizationsSection(doc, result.optimizations);
            }

            // Final Verdict
            addFinalVerdict(doc, result.final_verdict);

            // Footer
            addFooter(doc, metadata);

            doc.end();
        } catch (error) {
            logger.error('PDFGenerator', 'PDF generation failed', { error });
            reject(error);
        }
    });
}

/**
 * Add report header
 */
function addHeader(doc: PDFKit.PDFDocument, metadata: ReportMetadata) {
    doc
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Qubic Smart Contract', { align: 'center' })
        .text('Security Audit Report', { align: 'center' })
        .moveDown(0.5);

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Contract: ${metadata.contractName}`, { align: 'center' })
        .text(`Hash: ${metadata.contractHash.substring(0, 16)}...`, { align: 'center' })
        .text(`Generated: ${metadata.timestamp}`, { align: 'center' })
        .text(`Analysis ID: ${metadata.analysisId}`, { align: 'center' })
        .moveDown(2);
}

/**
 * Add executive summary
 */
function addExecutiveSummary(doc: PDFKit.PDFDocument, result: AnalysisResult) {
    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Executive Summary')
        .moveDown(0.5);

    doc
        .fontSize(11)
        .font('Helvetica')
        .text(`Overall Risk Score: ${result.summary.overall_risk_score}/100`)
        .text(`Risk Level: ${result.summary.risk_level}`)
        .text(`Total Issues Found: ${result.issues.length}`)
        .text(`Optimizations Identified: ${result.optimizations.length}`)
        .moveDown(1.5);
}

/**
 * Add risk score visualization
 */
function addRiskScoreSection(doc: PDFKit.PDFDocument, result: AnalysisResult) {
    const score = result.summary.overall_risk_score;
    const level = result.summary.risk_level;

    // Color mapping
    const colors: Record<string, string> = {
        Low: '#22c55e',
        Medium: '#eab308',
        High: '#f97316',
        Critical: '#ef4444',
    };

    doc
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Risk Assessment')
        .moveDown(0.5);

    // Draw risk bar
    const barWidth = 400;
    const barHeight = 30;
    const x = 100;
    const y = doc.y;

    // Background
    doc.rect(x, y, barWidth, barHeight).fillAndStroke('#e5e7eb', '#d1d5db');

    // Fill based on score
    const fillWidth = (score / 100) * barWidth;
    doc.rect(x, y, fillWidth, barHeight).fillAndStroke(colors[level], colors[level]);

    // Score text
    doc
        .fontSize(12)
        .fillColor('#000')
        .text(`${score}/100 - ${level}`, x + barWidth / 2 - 40, y + 8);

    doc.moveDown(3);

    // Severity breakdown
    const severityCounts = {
        Critical: result.issues.filter(i => i.severity === 'Critical').length,
        High: result.issues.filter(i => i.severity === 'High').length,
        Medium: result.issues.filter(i => i.severity === 'Medium').length,
        Low: result.issues.filter(i => i.severity === 'Low').length,
    };

    doc
        .fontSize(11)
        .font('Helvetica')
        .fillColor('#000')
        .text(`Critical: ${severityCounts.Critical}`)
        .text(`High: ${severityCounts.High}`)
        .text(`Medium: ${severityCounts.Medium}`)
        .text(`Low: ${severityCounts.Low}`)
        .moveDown(1.5);
}

/**
 * Add issues section
 */
function addIssuesSection(doc: PDFKit.PDFDocument, issues: Issue[]) {
    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Security Issues')
        .moveDown(0.5);

    if (issues.length === 0) {
        doc
            .fontSize(11)
            .font('Helvetica')
            .text('No issues found.')
            .moveDown(1.5);
        return;
    }

    // Sort by severity
    const sortedIssues = [...issues].sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.severity] - order[b.severity];
    });

    sortedIssues.forEach((issue, index) => {
        addIssuePage(doc, issue, index + 1);
    });
}

/**
 * Add individual issue
 */
function addIssuePage(doc: PDFKit.PDFDocument, issue: Issue, number: number) {
    // Check if we need a new page
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(12)
        .font('Helvetica-Bold')
        .text(`${number}. ${issue.title}`)
        .moveDown(0.3);

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(`Severity: ${issue.severity} | Category: ${issue.category} | Source: ${issue.source}`)
        .moveDown(0.5);

    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Description:')
        .font('Helvetica')
        .text(issue.description, { width: 500 })
        .moveDown(0.3);

    doc
        .font('Helvetica-Bold')
        .text('Impact:')
        .font('Helvetica')
        .text(issue.impact, { width: 500 })
        .moveDown(0.3);

    doc
        .font('Helvetica-Bold')
        .text('Exploit Scenario:')
        .font('Helvetica')
        .text(issue.exploit_scenario, { width: 500 })
        .moveDown(0.3);

    doc
        .font('Helvetica-Bold')
        .text('Recommended Fix:')
        .font('Helvetica')
        .text(issue.recommended_fix, { width: 500 })
        .moveDown(1);
}

/**
 * Add optimizations section
 */
function addOptimizationsSection(doc: PDFKit.PDFDocument, optimizations: Optimization[]) {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Optimization Recommendations')
        .moveDown(0.5);

    optimizations.forEach((opt, index) => {
        doc
            .fontSize(11)
            .font('Helvetica-Bold')
            .text(`${index + 1}. ${opt.description}`)
            .font('Helvetica')
            .text(`Expected Benefit: ${opt.expected_benefit}`)
            .moveDown(0.5);
    });

    doc.moveDown(1);
}

/**
 * Add final verdict
 */
function addFinalVerdict(doc: PDFKit.PDFDocument, verdict: string) {
    if (doc.y > 650) {
        doc.addPage();
    }

    doc
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Final Verdict')
        .moveDown(0.5);

    doc
        .fontSize(11)
        .font('Helvetica')
        .text(verdict, { width: 500, align: 'justify' })
        .moveDown(1.5);
}

/**
 * Add footer
 */
function addFooter(doc: PDFKit.PDFDocument, metadata: ReportMetadata) {
    const pages = doc.bufferedPageRange();

    for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);

        doc
            .fontSize(8)
            .font('Helvetica')
            .text(
                `Qubic Audit System | ${metadata.timestamp} | Page ${i + 1} of ${pages.count}`,
                50,
                doc.page.height - 50,
                { align: 'center' }
            );
    }
}
