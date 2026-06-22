'use client';

import React, { useState } from 'react';
import { AnalysisResult } from '@/lib/types/analysis';
import IssueCard from './IssueCard';
import ChartSection from './ChartSection';

interface ResultsDashboardProps {
    result: AnalysisResult;
    metadata: any;
    onDownloadPDF: () => void;
    onReset: () => void;
}

export default function ResultsDashboard({ result, metadata, onDownloadPDF, onReset }: ResultsDashboardProps) {
    const [activeTab, setActiveTab] = useState<'issues' | 'optimizations' | 'verdict'>('issues');

    const sortedIssues = [...result.issues].sort((a, b) => {
        const o = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return o[a.severity as keyof typeof o] - o[b.severity as keyof typeof o];
    });

    return (
        <div className="w-full space-y-5">

            {/* ── TOP ACTION BAR ─────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 fade-up">
                <div>
                    <p className="text-xs font-mono text-slate-600 mb-1">
                        {new Date(metadata.timestamp).toLocaleString()} · ID {metadata.analysisId?.slice(0, 8).toUpperCase()}
                    </p>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <span className="text-gradient">Audit Complete</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-normal truncate max-w-[200px] text-base">{metadata.fileName}</span>
                    </h2>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                    <button onClick={onDownloadPDF} className="btn-primary text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                        Download Report
                    </button>
                    <button onClick={onReset} className="btn-secondary text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                        </svg>
                        New Scan
                    </button>
                </div>
            </div>

            {/* ── VISUAL ANALYSIS (main hero) ─────────────── */}
            <ChartSection result={result} />

            {/* ── TABBED CONTENT ─────────────────────────── */}
            <div className="fade-up-2">
                {/* Tab bar */}
                <div className="flex gap-1 p-1 rounded-xl mb-5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', width: 'fit-content' }}>
                    {([
                        { key: 'issues',        label: 'Issues',        count: result.issues.length },
                        { key: 'optimizations', label: 'Optimizations', count: result.optimizations.length },
                        { key: 'verdict',       label: 'Final Verdict', count: null },
                    ] as const).map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeTab === tab.key ? 'bg-white/[0.08] text-white' : 'text-slate-500 hover:text-slate-300'
                            }`}
                        >
                            {tab.label}
                            {tab.count !== null && (
                                <span className={`text-xs font-mono px-1.5 py-0.5 rounded-md ${activeTab === tab.key ? 'bg-white/10 text-slate-300' : 'bg-white/[0.04] text-slate-600'}`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Issues tab */}
                {activeTab === 'issues' && (
                    <div className="space-y-3">
                        {result.issues.length === 0 ? (
                            <div className="rounded-2xl p-12 text-center" style={{ border: '1px solid rgba(34,197,94,0.2)', background: 'rgba(34,197,94,0.04)' }}>
                                <div className="text-5xl mb-4">✅</div>
                                <h3 className="text-xl font-bold text-green-400 mb-2">No Issues Detected</h3>
                                <p className="text-sm text-slate-500">This contract passed all static analysis checks.</p>
                            </div>
                        ) : (
                            sortedIssues.map((issue, i) => <IssueCard key={issue.id} issue={issue} number={i + 1} />)
                        )}
                    </div>
                )}

                {/* Optimizations tab */}
                {activeTab === 'optimizations' && (
                    <div>
                        {result.optimizations.length === 0 ? (
                            <div className="card p-8 text-center text-slate-500 text-sm">No optimization recommendations.</div>
                        ) : (
                            <>
                                {/* Header strip */}
                                <div className="flex items-center gap-3 mb-5 p-4 rounded-2xl" style={{ background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.08)' }}>
                                    <div className="text-2xl">⚡</div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{result.optimizations.length} Optimization{result.optimizations.length !== 1 ? 's' : ''} Identified</p>
                                        <p className="text-xs text-slate-500">Recommended improvements to enhance security, performance, and maintainability</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-3">
                                    {result.optimizations.map((opt, i) => {
                                        const icons = ['🔐','📊','🔄','🛡️','📡','⚙️','🔬','💡','🧩','🚀'];
                                        const accents = ['#22d3ee','#a78bfa','#34d399','#f5c518','#60a5fa','#ff8c42','#ec4899','#22d3ee','#a78bfa','#34d399'];
                                        const accent = accents[i % accents.length];
                                        const icon   = icons[i % icons.length];
                                        return (
                                            <div key={i}
                                                className="relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:translate-y-[-2px]"
                                                style={{ background: 'rgba(6,13,26,0.9)', border: `1px solid rgba(255,255,255,0.06)`, boxShadow: `0 0 0 0 ${accent}` }}
                                                onMouseEnter={e => (e.currentTarget.style.border = `1px solid ${accent}33`)}
                                                onMouseLeave={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
                                            >
                                                {/* Left accent bar */}
                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 rounded-l-2xl" style={{ background: `linear-gradient(180deg, ${accent}, transparent)` }}/>

                                                <div className="flex items-start gap-4">
                                                    {/* Number + icon badge */}
                                                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                                                            style={{ background: `${accent}12`, border: `1px solid ${accent}25` }}>
                                                            {icon}
                                                        </div>
                                                        <span className="text-xs font-black font-mono" style={{ color: `${accent}80` }}>#{String(i+1).padStart(2,'0')}</span>
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-bold text-white mb-2 leading-snug">{opt.description}</p>

                                                        {/* Benefit chip */}
                                                        <div className="inline-flex items-start gap-2 px-3 py-2 rounded-xl w-full" style={{ background: `${accent}08`, border: `1px solid ${accent}18` }}>
                                                            <span className="text-xs font-bold flex-shrink-0 mt-0.5" style={{ color: accent }}>↗ Benefit</span>
                                                            <p className="text-xs leading-relaxed" style={{ color: 'rgba(148,163,184,0.9)' }}>{opt.expected_benefit}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Verdict tab */}
                {activeTab === 'verdict' && (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(124,58,237,0.2)', background: 'rgba(6,15,30,0.9)' }}>
                        <div className="flex items-center gap-2 px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(0,0,0,0.3)' }}>
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 rounded-full bg-red-500/50" />
                                <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                                <div className="w-3 h-3 rounded-full bg-green-500/50" />
                            </div>
                            <span className="ml-3 text-xs font-mono text-slate-600">final_verdict.txt</span>
                            <div className="ml-auto flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                                <span className="text-xs font-mono text-violet-400/60">AI Analysis</span>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-1">
                                {result.final_verdict.split('\n').map((line, i) => {
                                    const isDivider    = line.startsWith('─');
                                    const isEmoji      = /^[🚨⛔⚠️✅]/.test(line);
                                    const isBullet     = line.trim().startsWith('•');
                                    const isAllCaps    = line === line.toUpperCase() && line.trim().length > 3 && !isBullet && !isEmoji;

                                    if (isDivider)  return <div key={i} className="h-px my-2" style={{ background: 'rgba(255,255,255,0.05)' }} />;
                                    if (isEmoji)    return <p key={i} className="text-sm font-bold text-white py-1 font-mono">{line}</p>;
                                    if (isAllCaps)  return <p key={i} className="text-xs font-bold font-mono tracking-widest mt-3 mb-1" style={{ color: '#a78bfa' }}>{line}</p>;
                                    if (isBullet)   return <p key={i} className="text-sm text-slate-300 pl-3 font-mono leading-relaxed">{line}</p>;
                                    if (!line.trim()) return <div key={i} className="h-2" />;
                                    return <p key={i} className="text-sm text-slate-400 leading-relaxed font-mono">{line}</p>;
                                })}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── METADATA FOOTER ────────────────────────── */}
            <div className="fade-up-3 flex flex-wrap gap-6 px-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                {[
                    { k: 'Analysis ID', v: metadata.analysisId?.slice(0, 16) + '…' },
                    { k: 'File',        v: metadata.fileName },
                    { k: 'Generated',   v: new Date(metadata.timestamp).toLocaleString() },
                ].map(({ k, v }) => (
                    <div key={k}>
                        <p className="text-xs text-slate-700">{k}</p>
                        <p className="text-xs font-mono text-slate-500 mt-0.5">{v}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
