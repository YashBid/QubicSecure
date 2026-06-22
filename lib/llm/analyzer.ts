import { AnalysisResult, NormalizedFinding } from '../types/analysis';
import { logger } from '../utils/logger';
import { SYSTEM_PROMPT, formatAnalysisContext } from './prompt';
import { validateAndExtract } from './validator';

/**
 * LLM Analyzer — Groq Primary, with OpenAI / Anthropic fallback support
 */

type LLMProvider = 'groq' | 'gemini' | 'openai' | 'anthropic';

interface LLMConfig {
    provider: LLMProvider;
    apiKey: string;
    model: string;
}

const OUTPUT_SCHEMA = {
    summary: {
        overall_risk_score: 'number (0-100, where 0=safe, 100=critically dangerous)',
        risk_level: 'Low | Medium | High | Critical',
    },
    issues: [
        {
            id: 'string (unique, e.g. "issue-1")',
            title: 'string (concise vulnerability name)',
            severity: 'Critical | High | Medium | Low',
            category: 'Security | Trading | Logic',
            description: 'string (technical explanation of the flaw, 2-3 sentences)',
            impact: 'string (concrete damage: who loses what and how much)',
            exploit_scenario: 'string (numbered step-by-step attack, minimum 3 steps)',
            recommended_fix: 'string (specific C++ code fix or named pattern)',
            source: 'Static | LLM | Correlated',
        },
    ],
    optimizations: [
        {
            description: 'string (specific improvement recommendation)',
            expected_benefit: 'string (measurable or qualitative benefit)',
        },
    ],
    final_verdict: 'string (4-6 sentence professional executive summary with deployment recommendation)',
};

function getLLMConfig(): LLMConfig | null {
    const provider = (process.env.LLM_PROVIDER || 'groq') as LLMProvider;

    const apiKeys: Record<string, string | undefined> = {
        groq:      process.env.GROQ_API_KEY,
        gemini:    process.env.GEMINI_API_KEY,
        openai:    process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY,
    };

    const apiKey = apiKeys[provider];

    if (!apiKey) {
        console.log(`🔴 LLM SKIP: No API key for provider "${provider}". Set ${provider.toUpperCase()}_API_KEY in .env`);
        return null;
    }

    const models: Record<string, string> = {
        groq:      process.env.GROQ_MODEL      || 'llama3-70b-8192',
        gemini:    process.env.GEMINI_MODEL     || 'gemini-1.5-flash',
        openai:    process.env.OPENAI_MODEL     || 'gpt-4o-mini',
        anthropic: process.env.ANTHROPIC_MODEL  || 'claude-3-haiku-20240307',
    };

    return { provider, apiKey, model: models[provider] };
}

/**
 * Call Groq API (OpenAI-compatible, uses groq-sdk)
 */
async function callGroq(config: LLMConfig, context: string): Promise<string> {
    const Groq = require('groq-sdk');
    const groq = new Groq({ apiKey: config.apiKey });

    const response = await groq.chat.completions.create({
        model: config.model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: context },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
    });

    return response.choices[0]?.message?.content || '{}';
}

/**
 * Call Google Gemini API
 */
async function callGemini(config: LLMConfig, context: string): Promise<string> {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(config.apiKey);
    const model = genAI.getGenerativeModel({
        model: config.model,
        generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    });
    const result = await model.generateContent(`${SYSTEM_PROMPT}\n\n${context}`);
    return result.response.text();
}

/**
 * Call OpenAI API
 */
async function callOpenAI(config: LLMConfig, context: string): Promise<string> {
    const OpenAI = require('openai').default;
    const openai = new OpenAI({ apiKey: config.apiKey });
    const response = await openai.chat.completions.create({
        model: config.model,
        messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user',   content: context },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
    });
    return response.choices[0].message.content || '{}';
}

/**
 * Call Anthropic Claude API
 */
async function callAnthropic(config: LLMConfig, context: string): Promise<string> {
    const Anthropic = require('@anthropic-ai/sdk').default;
    const anthropic = new Anthropic({ apiKey: config.apiKey });
    const message = await anthropic.messages.create({
        model: config.model,
        max_tokens: 4096,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: context }],
    });
    const content = message.content[0];
    return content.type === 'text' ? content.text : '{}';
}

/**
 * Core LLM analysis function
 */
export async function performLLMAnalysis(
    code: string,
    staticFindings: NormalizedFinding[]
): Promise<AnalysisResult | null> {
    const config = getLLMConfig();
    if (!config) return null;

    console.log(`🟡 LLM CALL: ${config.provider} / ${config.model} | ${staticFindings.length} static findings`);

    try {
        const context = formatAnalysisContext(code, staticFindings, OUTPUT_SCHEMA);
        console.log(`   → Prompt size: ${context.length} chars`);

        let raw: string;

        switch (config.provider) {
            case 'groq':      raw = await callGroq(config, context);      break;
            case 'gemini':    raw = await callGemini(config, context);    break;
            case 'openai':    raw = await callOpenAI(config, context);    break;
            case 'anthropic': raw = await callAnthropic(config, context); break;
            default:          throw new Error(`Unknown provider: ${config.provider}`);
        }

        console.log(`✅ LLM response: ${raw.length} chars`);
        console.log(`   → Preview: ${raw.substring(0, 200)}`);

        const validation = validateAndExtract(raw);

        if (!validation.valid) {
            console.log('❌ LLM schema validation failed:', validation.errors);
            throw new Error('LLM response schema invalid: ' + validation.errors?.join(', '));
        }

        console.log(`✅ LLM SUCCESS — ${validation.data?.issues?.length} issues found by AI`);
        return validation.data!;

    } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.log(`❌ LLM ERROR (${config.provider}): ${msg}`);
        logger.error('LLMAnalyzer', 'LLM call failed', { error: msg });
        throw error;
    }
}

/**
 * Retry wrapper with exponential backoff
 */
export async function performLLMAnalysisWithRetry(
    code: string,
    staticFindings: NormalizedFinding[],
    maxRetries = 2
): Promise<AnalysisResult | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 LLM attempt ${attempt}/${maxRetries}`);
            return await performLLMAnalysis(code, staticFindings);
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            console.log(`   → Attempt ${attempt} failed: ${msg}`);

            if (attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000;
                console.log(`   → Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }

    console.log('🔴 All LLM attempts failed — using static analysis fallback');
    return null;
}
