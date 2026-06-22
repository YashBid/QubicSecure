import { StaticFinding } from '../types/analysis';
import { logger } from '../utils/logger';

/**
 * External Static Analysis API Integration
 * STUB: To be configured manually with actual API credentials
 */

interface ExternalAPIConfig {
    apiKey?: string;
    endpoint?: string;
    enabled: boolean;
}

/**
 * Get API configuration from environment
 */
function getAPIConfig(): ExternalAPIConfig {
    return {
        apiKey: process.env.STATIC_ANALYSIS_API_KEY,
        endpoint: process.env.STATIC_ANALYSIS_API_ENDPOINT,
        enabled: !!process.env.STATIC_ANALYSIS_API_KEY,
    };
}

/**
 * Call external static analysis API
 * STUB: Replace with actual API integration
 */
export async function analyzeWithExternalAPI(code: string): Promise<StaticFinding[]> {
    const config = getAPIConfig();

    if (!config.enabled) {
        logger.info('ExternalAPI', 'External API not configured, skipping');
        return [];
    }

    logger.info('ExternalAPI', 'Calling external static analysis API');

    try {
        // STUB: Replace with actual API call
        // Example structure for future implementation:
        /*
        const response = await fetch(config.endpoint!, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            language: 'cpp',
            options: {
              severity: 'all',
              categories: ['security', 'logic', 'trading'],
            },
          }),
        });
    
        const data = await response.json();
        
        // Normalize API response to StaticFinding format
        return normalizeExternalFindings(data);
        */

        logger.warn('ExternalAPI', 'External API integration is a stub - manual implementation required');
        return [];

    } catch (error) {
        logger.error('ExternalAPI', 'External API call failed', { error });
        return [];
    }
}

/**
 * Normalize external API findings to internal format
 * STUB: Implement based on actual API response structure
 */
function normalizeExternalFindings(apiResponse: any): StaticFinding[] {
    // STUB: Map API response to StaticFinding[]
    // This will depend on the specific API being used

    const findings: StaticFinding[] = [];

    // Example normalization (adjust based on actual API):
    /*
    if (apiResponse.vulnerabilities) {
      for (const vuln of apiResponse.vulnerabilities) {
        findings.push({
          title: vuln.title || vuln.name,
          severity: mapSeverity(vuln.severity),
          category: mapCategory(vuln.category),
          description: vuln.description,
          line_start: vuln.line,
          line_end: vuln.line,
          function_name: vuln.function,
        });
      }
    }
    */

    return findings;
}

/**
 * Map external API severity to internal severity
 */
function mapSeverity(externalSeverity: string): 'Critical' | 'High' | 'Medium' | 'Low' {
    const normalized = externalSeverity.toLowerCase();

    if (normalized.includes('critical') || normalized.includes('high')) {
        return 'Critical';
    }
    if (normalized.includes('medium') || normalized.includes('moderate')) {
        return 'Medium';
    }
    if (normalized.includes('low') || normalized.includes('minor')) {
        return 'Low';
    }

    return 'Medium'; // Default
}

/**
 * Map external API category to internal category
 */
function mapCategory(externalCategory: string): 'Security' | 'Trading' | 'Logic' {
    const normalized = externalCategory.toLowerCase();

    if (normalized.includes('security') || normalized.includes('vulnerability')) {
        return 'Security';
    }
    if (normalized.includes('trading') || normalized.includes('economic')) {
        return 'Trading';
    }

    return 'Logic';
}
