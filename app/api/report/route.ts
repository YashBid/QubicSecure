import { NextRequest, NextResponse } from 'next/server';
import { generatePDFReport } from '@/lib/pdf/generator';
import { logger } from '@/lib/utils/logger';
import { AnalysisResult } from '@/lib/types/analysis';

/**
 * POST /api/report
 * Generate PDF audit report
 */
export async function POST(request: NextRequest) {
    try {
        logger.info('ReportAPI', 'Received report generation request');

        const body = await request.json();
        const { result, metadata } = body;

        if (!result || !metadata) {
            logger.warn('ReportAPI', 'Missing required data');
            return NextResponse.json(
                { error: 'Missing analysis result or metadata' },
                { status: 400 }
            );
        }

        // Generate PDF
        logger.info('ReportAPI', 'Generating PDF report');
        const pdfBuffer = await generatePDFReport(result as AnalysisResult, {
            contractName: metadata.fileName || 'Unknown Contract',
            contractHash: metadata.fileHash || 'N/A',
            timestamp: metadata.timestamp || new Date().toISOString(),
            analysisId: metadata.analysisId || 'N/A',
        });

        logger.info('ReportAPI', 'PDF report generated successfully');

        // Return PDF as downloadable file
        return new NextResponse(pdfBuffer, {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="audit-report-${metadata.analysisId || 'report'}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (error) {
        logger.error('ReportAPI', 'Report generation failed', { error });
        return NextResponse.json(
            { error: 'Report generation failed' },
            { status: 500 }
        );
    }
}
