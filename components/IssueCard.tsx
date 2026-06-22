'use client';

import React from 'react';
import { Issue } from '@/lib/types/analysis';

interface IssueCardProps {
    issue: Issue;
    number: number;
}

const SEVERITY_CONFIG = {
    Critical: { badgeClass: 'badge-critical', bar: 'bg-red-500',    dot: 'bg-red-400',    glow: 'rgba(255,59,92,0.08)' },
    High:     { badgeClass: 'badge-high',     bar: 'bg-orange-500', dot: 'bg-orange-400', glow: 'rgba(255,140,66,0.08)' },
    Medium:   { badgeClass: 'badge-medium',   bar: 'bg-yellow-500', dot: 'bg-yellow-400', glow: 'rgba(245,197,24,0.06)' },
    Low:      { badgeClass: 'badge-low',      bar: 'bg-green-500',  dot: 'bg-green-400',  glow: 'rgba(34,197,94,0.06)' },
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
    Security: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
        </svg>
    ),
    Trading: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>
    ),
    Logic: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
        </svg>
    ),
};

export default function IssueCard({ issue, number }: IssueCardProps) {
    const [expanded, setExpanded] = React.useState(false);
    const cfg = SEVERITY_CONFIG[issue.severity as keyof typeof SEVERITY_CONFIG] || SEVERITY_CONFIG.Low;

    return (
        <div
            className="card issue-card fade-up"
            style={{
                background: `linear-gradient(135deg, ${cfg.glow}, rgba(6,15,30,0.9))`,
                animationDelay: `${number * 0.05}s`,
            }}
        >
            {/* Top row */}
            <div className="p-5">
                <div className="flex items-start gap-4">
                    {/* Number + severity dot */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                        <span className="mono text-xs text-slate-600 font-medium">#{number.toString().padStart(2,'0')}</span>
                        <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2.5">
                            <span className={`badge ${cfg.badgeClass}`}>{issue.severity}</span>
                            <span className="badge badge-category flex items-center gap-1">
                                {CATEGORY_ICONS[issue.category]}
                                {issue.category}
                            </span>
                            <span className="badge badge-category text-xs opacity-60">{issue.source}</span>
                        </div>

                        <h4 className="font-bold text-white text-base leading-snug mb-1.5">
                            {issue.title}
                        </h4>
                        <p className="text-sm text-slate-400 leading-relaxed">{issue.description}</p>
                    </div>

                    {/* Expand button */}
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-all"
                    >
                        <svg
                            className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
                            fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7"/>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Expanded details */}
            <div className={`issue-expand ${expanded ? 'open' : ''}`}>
                <div className="px-5 pb-5 pt-0">
                    <div className="border-t border-white/[0.04] pt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Impact */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-md bg-blue-500/20 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Impact</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{issue.impact}</p>
                        </div>

                        {/* Exploit */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-md bg-violet-500/20 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Exploit</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{issue.exploit_scenario}</p>
                        </div>

                        {/* Fix */}
                        <div className="p-4 rounded-xl bg-black/20 border border-white/[0.04]">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-md bg-green-500/20 flex items-center justify-center">
                                    <svg className="w-3 h-3 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                </div>
                                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">Fix</span>
                            </div>
                            <p className="text-sm text-slate-300 leading-relaxed">{issue.recommended_fix}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
