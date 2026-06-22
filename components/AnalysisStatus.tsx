'use client';

import React, { useEffect, useState } from 'react';

type PipelineStep = 'upload' | 'static' | 'llm' | 'scoring' | 'complete';

interface AnalysisStatusProps {
    status: 'uploading' | 'analyzing' | 'complete' | 'error';
    pipelineStep: PipelineStep;
}

const STEPS: { id: PipelineStep; label: string; sub: string; duration: string }[] = [
    { id: 'upload',   label: 'File Upload',      sub: 'Contract received & validated',     duration: '~0.5s' },
    { id: 'static',   label: 'Static Analysis',  sub: 'Running 10+ vulnerability patterns', duration: '~1s' },
    { id: 'llm',      label: 'AI Deep Scan',      sub: 'LLM correlation & risk analysis',   duration: '~5-10s' },
    { id: 'scoring',  label: 'Risk Scoring',      sub: 'Computing weighted severity score',  duration: '~0.3s' },
    { id: 'complete', label: 'Report Ready',      sub: 'Audit report compiled',              duration: '' },
];

const STEP_INDEX: Record<PipelineStep, number> = {
    upload: 0, static: 1, llm: 2, scoring: 3, complete: 4,
};

const STEP_MESSAGES: Record<PipelineStep, string> = {
    upload:   'Contract received. Validating file structure and encoding...',
    static:   'Matching against 10 vulnerability patterns: overflows, access control, reentrancy, MEV vectors...',
    llm:      'AI is correlating static findings, analysing business logic, and checking for complex exploit chains...',
    scoring:  'Applying weighted severity formula across Critical / High / Medium / Low findings...',
    complete: 'Audit complete. Compiling results and preparing your dashboard...',
};

const LOG_LINES: Record<PipelineStep, string[]> = {
    upload: [
        '> Received file upload request',
        '> Validating file extension & MIME type',
        '> Saving to secure temp storage',
        '> File hash computed (SHA-256)',
        '> Contract ready for analysis ✓',
    ],
    static: [
        '> Loading vulnerability rule set (10 patterns)',
        '> Scanning: Integer Overflow / Underflow',
        '> Scanning: Access Control checks',
        '> Scanning: Reentrancy patterns',
        '> Scanning: Unchecked external calls',
        '> Scanning: Price manipulation vectors',
        '> Scanning: Front-running exposure',
        '> Scanning: Unbounded loops',
        '> Scanning: Timestamp dependence',
        '> Deduplicating and normalising findings...',
    ],
    llm: [
        '> Preparing analysis context for LLM',
        '> Sending to AI with security-specialist prompt',
        '> AI analysing contract structure...',
        '> Correlating static findings with code semantics',
        '> Identifying logical & economic vulnerabilities',
        '> Generating exploit scenarios...',
        '> Validating LLM output schema',
    ],
    scoring: [
        '> Counting Critical × 10 + High × 6 + Medium × 3 + Low × 1',
        '> Applying logarithmic normalisation (0–100)',
        '> Mapping score to risk level band',
        '> Risk level determined ✓',
    ],
    complete: [
        '> All analysis stages finished',
        '> Assembling final audit result',
        '> Report ready ✓',
    ],
};

export default function AnalysisStatus({ status, pipelineStep }: AnalysisStatusProps) {
    const currentIndex = STEP_INDEX[pipelineStep];
    const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
    const [logKey, setLogKey] = useState('');

    // Animate log lines when step changes
    useEffect(() => {
        const lines = LOG_LINES[pipelineStep] || [];
        setVisibleLogs([]);
        setLogKey(pipelineStep);

        let i = 0;
        const interval = setInterval(() => {
            if (i < lines.length) {
                setVisibleLogs(prev => [...prev, lines[i]]);
                i++;
            } else {
                clearInterval(interval);
            }
        }, 280);

        return () => clearInterval(interval);
    }, [pipelineStep]);

    const msg = STEP_MESSAGES[pipelineStep];

    return (
        <div className="max-w-4xl mx-auto fade-up">
            {/* Header card */}
            <div className="card-glow p-8 mb-4">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                            <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">Analysis Running</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white">Scanning Contract</h2>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-black text-gradient">
                            {Math.round((currentIndex / (STEPS.length - 1)) * 100)}%
                        </div>
                        <div className="text-xs text-slate-500">complete</div>
                    </div>
                </div>

                {/* Steps */}
                <div className="relative">
                    {/* Background track */}
                    <div className="absolute left-[21px] top-[22px] bottom-[22px] w-px bg-white/[0.04]" />
                    {/* Fill */}
                    <div
                        className="absolute left-[21px] top-[22px] w-px bg-gradient-to-b from-cyan-500 to-violet-500 transition-all duration-700 ease-in-out"
                        style={{ height: `${currentIndex > 0 ? ((currentIndex - 0.5) / (STEPS.length - 1)) * 100 : 0}%` }}
                    />

                    <div className="space-y-1">
                        {STEPS.map((step, index) => {
                            const isDone   = index < currentIndex;
                            const isActive = index === currentIndex;

                            return (
                                <div
                                    key={step.id}
                                    className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-500 ${
                                        isActive ? 'bg-cyan-500/5 border border-cyan-500/10' : ''
                                    }`}
                                >
                                    {/* Circle */}
                                    <div className={`step-circle flex-shrink-0 ${isDone ? 'done' : isActive ? 'active' : 'pending'}`}>
                                        {isActive ? (
                                            <div className="w-4 h-4 border-2 border-cyan-400 border-t-transparent rounded-full spin-anim" />
                                        ) : isDone ? (
                                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/>
                                            </svg>
                                        ) : (
                                            <div className="w-2 h-2 rounded-full bg-white/10" />
                                        )}
                                    </div>

                                    {/* Text */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold text-sm ${isDone ? 'text-white' : isActive ? 'text-cyan-300' : 'text-slate-600'}`}>
                                                {step.label}
                                            </p>
                                            {step.duration && (
                                                <span className={`text-xs font-mono ${isActive ? 'text-slate-500' : 'text-slate-700'}`}>
                                                    {step.duration}
                                                </span>
                                            )}
                                        </div>
                                        <p className={`text-xs mt-0.5 ${isActive ? 'text-slate-400' : 'text-slate-700'}`}>
                                            {step.sub}
                                        </p>
                                    </div>

                                    {/* Pill */}
                                    {isDone && (
                                        <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/20 font-medium">Done</span>
                                    )}
                                    {isActive && (
                                        <span className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-medium">Running</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                    <div className="progress-track">
                        <div
                            className="progress-fill"
                            style={{ width: `${(currentIndex / (STEPS.length - 1)) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Terminal log card */}
            <div className="card p-5">
                <div className="flex items-center gap-2 mb-3">
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500/60" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                        <div className="w-3 h-3 rounded-full bg-green-500/60" />
                    </div>
                    <span className="text-xs font-mono text-slate-600 ml-2">analysis.log</span>
                    <span className="ml-auto text-xs font-mono text-cyan-400/60">{msg}</span>
                </div>
                <div className="space-y-1 min-h-[100px]">
                    {visibleLogs.filter(Boolean).map((line, i) => (
                        <div
                            key={`${logKey}-${i}`}
                            className="flex items-start gap-2 fade-in"
                        >
                            <span className="text-cyan-500/40 font-mono text-xs mt-0.5 flex-shrink-0">$</span>
                            <span className={`font-mono text-xs ${String(line).includes('✓') ? 'text-green-400' : 'text-slate-400'}`}>
                                {line}
                            </span>
                        </div>
                    ))}
                    {visibleLogs.length > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                            <span className="text-cyan-500/40 font-mono text-xs">$</span>
                            <span className="w-2 h-4 bg-cyan-400/60 animate-pulse" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
