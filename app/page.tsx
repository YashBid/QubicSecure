'use client';

import React, { useState } from 'react';
import UploadZone from '@/components/UploadZone';
import AnalysisStatus from '@/components/AnalysisStatus';
import ResultsDashboard from '@/components/ResultsDashboard';
import { AnalysisResult } from '@/lib/types/analysis';
import { generateAndDownloadReport } from '@/lib/pdf/client-generator';
import './globals.css';

type AppState = 'idle' | 'uploading' | 'analyzing' | 'complete' | 'error';
type PipelineStep = 'upload' | 'static' | 'llm' | 'scoring' | 'complete';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export default function Home() {
    const [state, setState] = useState<AppState>('idle');
    const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
    const [metadata, setMetadata] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [pipelineStep, setPipelineStep] = useState<PipelineStep>('upload');

    const handleUploadComplete = async (data: any) => {
        setState('analyzing');
        setPipelineStep('upload');

        // Kick off the actual API call immediately in background
        const apiPromise = fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filePath: data.filePath, fileName: data.fileName }),
        });

        try {
            // Animate pipeline steps with human-feeling delays
            // Upload step: already visible, move to static quickly
            await sleep(900);
            setPipelineStep('static');

            await sleep(1800);
            setPipelineStep('llm');

            await sleep(2200);
            setPipelineStep('scoring');

            // Now await the real API result (may already be done)
            const response = await apiPromise;
            const result = await response.json();

            if (!response.ok) throw new Error(result.error || 'Analysis failed');

            await sleep(700);
            setPipelineStep('complete');
            await sleep(600);

            setAnalysisResult(result.result);
            setMetadata({ ...data, ...result.metadata });
            setState('complete');

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
            setState('error');
        }
    };

    const handleDownloadPDF = () => {
        if (!analysisResult || !metadata) return;
        generateAndDownloadReport(analysisResult, {
            fileName:   metadata.fileName   || 'contract',
            analysisId: metadata.analysisId || 'N/A',
            timestamp:  metadata.timestamp  || new Date().toISOString(),
            fileHash:   metadata.fileHash,
        });
    };

    const handleReset = () => {
        setState('idle');
        setAnalysisResult(null);
        setMetadata(null);
        setError(null);
        setPipelineStep('upload');
    };

    return (
        <>
            <div className="grid-bg" />

            <main className="relative min-h-screen z-10">
                {/* ── NAVBAR ─────────────────────────────── */}
                <nav className="sticky top-0 z-50 border-b border-white/[0.04] backdrop-blur-xl bg-black/30">
                    <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-9 h-9">
                                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-400 to-violet-600 opacity-90" />
                                <svg className="absolute inset-0 w-full h-full p-2" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 2L3 7v10l9 5 9-5V7L12 2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                                    <path d="M12 12L3 7M12 12l9-5M12 12v10" stroke="white" strokeWidth="1.5"/>
                                </svg>
                            </div>
                            <div>
                                <span className="font-bold text-white text-base tracking-tight">QubicAudit</span>
                                <span className="text-xs text-cyan-400/60 font-mono ml-2">v2.0</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                <span className="text-xs font-medium text-green-400">System Online</span>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* ── IDLE / HERO ─────────────────────────── */}
                {state === 'idle' && (
                    <div className="max-w-7xl mx-auto px-6 pt-20 pb-12">
                        <div className="text-center mb-16 fade-up">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-400/8 border border-cyan-400/15 mb-8">
                                <span className="text-cyan-400 text-xs font-mono font-medium tracking-widest uppercase">Automated Security Auditor</span>
                            </div>
                            <h1 className="text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[1.05]">
                                <span className="text-white">Audit Qubic</span><br/>
                                <span className="text-gradient">Smart Contracts</span>
                            </h1>
                            <p className="text-lg text-slate-400 max-w-xl mx-auto leading-relaxed">
                                Deep security analysis powered by pattern matching and LLM.
                                Detect vulnerabilities, assess risk, generate reports.
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-16 fade-up-1">
                            {[
                                { label: 'Patterns', value: '10+', icon: '🔍' },
                                { label: 'Severity Levels', value: '4', icon: '⚠️' },
                                { label: 'Categories', value: '3', icon: '📊' },
                            ].map((s) => (
                                <div key={s.label} className="card text-center py-5 px-4">
                                    <div className="text-2xl mb-1">{s.icon}</div>
                                    <div className="text-2xl font-bold text-gradient">{s.value}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
                                </div>
                            ))}
                        </div>

                        <div className="max-w-2xl mx-auto fade-up-2">
                            <UploadZone
                                onUploadComplete={handleUploadComplete}
                                onUploadStart={() => setState('uploading')}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mt-16 fade-up-3">
                            {[
                                { icon: '🔬', title: 'Static Analysis', desc: 'Custom C++ rule engine with 10+ vulnerability patterns specific to Qubic contracts.' },
                                { icon: '🧠', title: 'LLM Deep Scan', desc: 'AI-powered analysis correlates findings and detects complex logic vulnerabilities.' },
                                { icon: '📄', title: 'PDF Reports', desc: 'Professional downloadable audit reports with executive summary and issue details.' },
                            ].map((f) => (
                                <div key={f.title} className="card card-hover p-6">
                                    <div className="text-3xl mb-3">{f.icon}</div>
                                    <h3 className="font-semibold text-white mb-2 text-sm">{f.title}</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── UPLOADING / ANALYZING ───────────────── */}
                {(state === 'uploading' || state === 'analyzing') && (
                    <div className="max-w-7xl mx-auto px-6 pt-20">
                        <AnalysisStatus status={state} pipelineStep={pipelineStep} />
                    </div>
                )}

                {/* ── RESULTS ─────────────────────────────── */}
                {state === 'complete' && analysisResult && metadata && (
                    <div className="max-w-7xl mx-auto px-6 py-10">
                        <ResultsDashboard
                            result={analysisResult}
                            metadata={metadata}
                            onDownloadPDF={handleDownloadPDF}
                            onReset={handleReset}
                        />
                    </div>
                )}

                {/* ── ERROR ───────────────────────────────── */}
                {state === 'error' && (
                    <div className="max-w-2xl mx-auto px-6 pt-20 fade-up">
                        <div className="card p-10 border border-red-500/20 text-center">
                            <div className="text-6xl mb-6">⚠️</div>
                            <h3 className="text-2xl font-bold text-red-400 mb-3">Analysis Failed</h3>
                            <p className="text-slate-400 mb-8 leading-relaxed">{error}</p>
                            <button onClick={handleReset} className="btn-primary">Try Again</button>
                        </div>
                    </div>
                )}

                <footer className="text-center py-12 mt-20 border-t border-white/[0.04]">
                    <p className="text-slate-600 text-xs mono">QubicAudit — Automated Smart Contract Security Analysis</p>
                </footer>
            </main>
        </>
    );
}
