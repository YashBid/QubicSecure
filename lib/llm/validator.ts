import { AnalysisResultSchema, AnalysisResult } from '../types/analysis';
import { logger } from '../utils/logger';
import { ZodError } from 'zod';

/**
 * LLM Response Validator
 * Validates LLM output against strict JSON schema
 * Rejects responses with invalid severity values
 */

export interface ValidationResult {
    valid: boolean;
    data?: AnalysisResult;
    errors?: string[];
}

/**
 * Validate LLM response
 */
export function validateLLMResponse(response: any): ValidationResult {
    logger.info('LLMValidator', 'Validating LLM response');

    try {
        // Parse and validate against schema
        const validated = AnalysisResultSchema.parse(response);

        logger.info('LLMValidator', 'Validation successful');

        return {
            valid: true,
            data: validated,
        };

    } catch (error) {
        if (error instanceof ZodError) {
            const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);

            logger.error('LLMValidator', 'Validation failed', { errors });

            return {
                valid: false,
                errors,
            };
        }

        logger.error('LLMValidator', 'Unexpected validation error', { error });

        return {
            valid: false,
            errors: ['Unexpected validation error'],
        };
    }
}

/**
 * Extract JSON from LLM response text
 * Handles cases where LLM adds extra text around JSON
 */
export function extractJSON(text: string): any {
    logger.debug('LLMValidator', 'Extracting JSON from response');

    // Try to find JSON object in text
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
        throw new Error('No JSON object found in response');
    }

    try {
        return JSON.parse(jsonMatch[0]);
    } catch (error) {
        logger.error('LLMValidator', 'Failed to parse JSON', { error });
        throw new Error('Invalid JSON in response');
    }
}

/**
 * Validate and extract LLM response
 */
export function validateAndExtract(responseText: string): ValidationResult {
    try {
        const json = extractJSON(responseText);
        return validateLLMResponse(json);
    } catch (error) {
        logger.error('LLMValidator', 'Failed to extract/validate response', { error });
        return {
            valid: false,
            errors: [error instanceof Error ? error.message : 'Unknown error'],
        };
    }
}
