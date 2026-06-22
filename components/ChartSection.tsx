'use client';

import React, { useEffect, useState } from 'react';
import { AnalysisResult } from '@/lib/types/analysis';

const SEV_COLORS: Record<string, string> = {
    Critical: '#ff3b5c', High: '#ff8c42', Medium: '#f5c518', Low: '#22c55e',
};
const CAT_COLORS: Record<string, string> = {
    Security: '#60a5fa', Trading: '#a78bfa', Logic: '#34d399',
};

/* ── DONUT CHART ────────────────────────────────────────── */
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 100); }, []);

    const total = data.reduce((s, d) => s + d.value, 0) || 1;
    const r = 54; const cx = 70; const cy = 70;
    const circ = 2 * Math.PI * r;

    let offset = 0;
    const segments = data.map(d => {
        const dash = animated ? (d.value / total) * circ : 0;
        const gap  = circ - dash;
        const seg  = { ...d, dash, gap, offset };
        offset += dash;
        return seg;
    });

    return (
        <div className="flex flex-col items-center">
            <svg width="140" height="140" viewBox="0 0 140 140">
                {/* Track */}
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="14"/>
                {total === 0 ? (
                    <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14"/>
                ) : segments.map((s, i) => (
                    <circle key={i} cx={cx} cy={cy} r={r} fill="none"
                        stroke={s.color} strokeWidth="14"
                        strokeDasharray={`${s.dash} ${s.gap}`}
                        strokeDashoffset={-s.offset}
                        transform={`rotate(-90 ${cx} ${cy})`}
                        style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                    />
                ))}
                <text x={cx} y={cy - 6} textAnchor="middle" fill="white" fontSize="22" fontWeight="900">{total}</text>
                <text x={cx} y={cy + 12} textAnchor="middle" fill="#475569" fontSize="10">issues</text>
            </svg>
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
                {data.map(d => (
                    <div key={d.label} className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                        <span className="text-xs text-slate-500">{d.label} <span className="font-bold" style={{ color: d.color }}>{d.value}</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── SEMICIRCLE GAUGE ───────────────────────────────────── */
function SemiGauge({ score, color }: { score: number; color: string }) {
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 200); }, []);

    const r = 52; const cx = 70; const cy = 75;
    const circ = Math.PI * r; // half circle
    const fill = animated ? (score / 100) * circ : 0;

    // Gradient stops for track
    const trackGradId = 'gauge-track';

    return (
        <div className="flex flex-col items-center">
            <svg width="140" height="90" viewBox="0 0 140 90">
                <defs>
                    <linearGradient id={trackGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#22c55e"/>
                        <stop offset="33%" stopColor="#f5c518"/>
                        <stop offset="66%" stopColor="#ff8c42"/>
                        <stop offset="100%" stopColor="#ff3b5c"/>
                    </linearGradient>
                </defs>
                {/* BG track */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" strokeLinecap="round"/>
                {/* Colored track */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={`url(#${trackGradId})`} strokeWidth="12"
                    strokeLinecap="round" opacity="0.2"/>
                {/* Score arc */}
                <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
                    fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
                    strokeDasharray={`${fill} ${circ}`}
                    style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.16,1,0.3,1)', filter: 'none' }}
                />
                <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="26" fontWeight="900">{score}</text>
                <text x={cx} y={cy + 10} textAnchor="middle" fill="#475569" fontSize="9">RISK SCORE</text>
                <text x={cx - r + 2} y={cy + 18} fill="#475569" fontSize="8">0</text>
                <text x={cx + r - 8} y={cy + 18} fill="#475569" fontSize="8">100</text>
            </svg>
        </div>
    );
}

/* ── CATEGORY BAR CHART ─────────────────────────────────── */
function CategoryBars({ data }: { data: { label: string; value: number; color: string; icon: string }[] }) {
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 300); }, []);
    const max = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="space-y-3 w-full">
            {data.map(d => (
                <div key={d.label}>
                    <div className="flex items-center justify-between mb-1.5">
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span>{d.icon}</span>{d.label}
                        </span>
                        <span className="text-sm font-bold" style={{ color: d.color }}>{d.value}</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                        <div className="h-full rounded-full" style={{
                            width: animated ? `${(d.value / max) * 100}%` : '0%',
                            background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                            transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
                        }}/>
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── SEVERITY HEATMAP GRID ──────────────────────────────── */
function SeverityHeatmap({ issues }: { issues: AnalysisResult['issues'] }) {
    const categories = ['Security', 'Trading', 'Logic'];
    const severities = ['Critical', 'High', 'Medium', 'Low'];

    const grid = categories.map(cat =>
        severities.map(sev =>
            issues.filter(i => i.category === cat && i.severity === sev).length
        )
    );

    const max = Math.max(...grid.flat(), 1);

    return (
        <div className="w-full">
            {/* Header row */}
            <div className="grid grid-cols-5 gap-1 mb-1">
                <div />
                {severities.map(s => (
                    <div key={s} className="text-center text-xs font-mono text-slate-600" style={{ color: SEV_COLORS[s], fontSize: '10px' }}>{s}</div>
                ))}
            </div>
            {categories.map((cat, ci) => (
                <div key={cat} className="grid grid-cols-5 gap-1 mb-1">
                    <div className="text-xs text-slate-500 flex items-center" style={{ fontSize: '10px' }}>{cat}</div>
                    {severities.map((sev, si) => {
                        const count = grid[ci][si];
                        const intensity = count / max;
                        return (
                            <div
                                key={sev}
                                className="h-8 rounded-md flex items-center justify-center text-xs font-bold transition-all duration-700"
                                style={{
                                    background: count > 0
                                        ? `rgba(${hexToRgb(SEV_COLORS[sev])}, ${0.1 + intensity * 0.5})`
                                        : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${count > 0 ? `rgba(${hexToRgb(SEV_COLORS[sev])}, 0.25)` : 'rgba(255,255,255,0.04)'}`,
                                    color: count > 0 ? SEV_COLORS[sev] : '#1e293b',
                                }}
                            >
                                {count > 0 ? count : '·'}
                            </div>
                        );
                    })}
                </div>
            ))}
        </div>
    );
}

function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1,3), 16);
    const g = parseInt(hex.slice(3,5), 16);
    const b = parseInt(hex.slice(5,7), 16);
    return `${r},${g},${b}`;
}

/* ── SPIDER / RADAR CHART ───────────────────────────────── */
function SpiderChart({ issues }: { issues: AnalysisResult['issues'] }) {
    const [animated, setAnimated] = useState(false);
    useEffect(() => { setTimeout(() => setAnimated(true), 400); }, []);

    const cx = 110; const cy = 110; const R = 80;
    const levels = 4;

    // Compute weighted score per axis (0–100)
    const weightedScore = (filterFn: (i: AnalysisResult['issues'][0]) => boolean) => {
        const filtered = issues.filter(filterFn);
        const raw = filtered.reduce((s, i) => {
            const w = { Critical: 10, High: 6, Medium: 3, Low: 1 }[i.severity] || 1;
            return s + w;
        }, 0);
        return Math.min(100, raw * 8); // scale so a few issues shows clearly
    };

    const axes = [
        { label: 'Security',         score: weightedScore(i => i.category === 'Security'),                                  color: '#60a5fa' },
        { label: 'Trading',          score: weightedScore(i => i.category === 'Trading'),                                   color: '#a78bfa' },
        { label: 'Logic',            score: weightedScore(i => i.category === 'Logic'),                                     color: '#34d399' },
        { label: 'Arithmetic',       score: weightedScore(i => i.title.toLowerCase().includes('overflow') || i.title.toLowerCase().includes('underflow')), color: '#f5c518' },
        { label: 'Access Control',   score: weightedScore(i => i.title.toLowerCase().includes('access')),                   color: '#ff8c42' },
    ];

    const n = axes.length;
    // Points on unit circle for each axis
    const angleOf = (i: number) => (i / n) * 2 * Math.PI - Math.PI / 2;
    const pt = (axisIdx: number, pct: number) => ({
        x: cx + R * pct * Math.cos(angleOf(axisIdx)),
        y: cy + R * pct * Math.sin(angleOf(axisIdx)),
    });

    // Polygon points
    const dataPoints = axes.map((a, i) => pt(i, animated ? a.score / 100 : 0));
    const polyline   = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Grid rings
    const rings = Array.from({ length: levels }, (_, li) => {
        const pct = (li + 1) / levels;
        return axes.map((_, i) => pt(i, pct)).map(p => `${p.x},${p.y}`).join(' ');
    });

    return (
        <div className="flex flex-col items-center">
            <svg width="220" height="220" viewBox="0 0 220 220">
                {/* Grid rings */}
                {rings.map((pts, li) => (
                    <polygon key={li} points={pts}
                        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"
                    />
                ))}
                {/* Axis lines */}
                {axes.map((_, i) => {
                    const end = pt(i, 1);
                    return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1"/>;
                })}
                {/* Data polygon */}
                <polygon
                    points={polyline}
                    fill="rgba(34,211,238,0.12)"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    style={{ transition: 'points 1.2s cubic-bezier(0.16,1,0.3,1)' }}
                />
                {/* Data points */}
                {dataPoints.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4"
                        fill={axes[i].color} stroke="#020408" strokeWidth="1.5"
                        style={{ transition: 'cx 1.2s ease, cy 1.2s ease' }}
                    />
                ))}
                {/* Axis labels */}
                {axes.map((a, i) => {
                    const lp = pt(i, 1.22);
                    return (
                        <text key={i} x={lp.x} y={lp.y}
                            textAnchor="middle" dominantBaseline="middle"
                            fill={a.color} fontSize="9" fontFamily="monospace" fontWeight="600"
                        >
                            {a.label}
                        </text>
                    );
                })}
                {/* Score labels on axes */}
                {axes.map((a, i) => {
                    const sp = pt(i, animated ? a.score / 100 : 0);
                    return a.score > 0 ? (
                        <text key={i} x={sp.x} y={sp.y - 8}
                            textAnchor="middle" fill={a.color} fontSize="8" fontFamily="monospace"
                            style={{ transition: 'x 1.2s ease, y 1.2s ease' }}
                        >
                            {Math.round(a.score)}
                        </text>
                    ) : null;
                })}
                {/* Center dot */}
                <circle cx={cx} cy={cy} r="3" fill="rgba(34,211,238,0.4)"/>
            </svg>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
                {axes.map(a => (
                    <div key={a.label} className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: a.color }}/>
                        <span className="text-xs font-mono" style={{ color: a.color, fontSize: '9px' }}>{a.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── MAIN EXPORT ────────────────────────────────────────── */
export default function ChartSection({ result }: { result: AnalysisResult }) {
    const risk = result.summary.risk_level;
    const riskColor = { Critical: '#ff3b5c', High: '#ff8c42', Medium: '#f5c518', Low: '#22c55e' }[risk] || '#22c55e';

    const donutData = [
        { label: 'Critical', value: result.issues.filter(i => i.severity === 'Critical').length, color: SEV_COLORS.Critical },
        { label: 'High',     value: result.issues.filter(i => i.severity === 'High').length,     color: SEV_COLORS.High },
        { label: 'Medium',   value: result.issues.filter(i => i.severity === 'Medium').length,   color: SEV_COLORS.Medium },
        { label: 'Low',      value: result.issues.filter(i => i.severity === 'Low').length,      color: SEV_COLORS.Low },
    ];

    const catData = [
        { label: 'Security', value: result.issues.filter(i => i.category === 'Security').length, color: CAT_COLORS.Security, icon: '🔒' },
        { label: 'Trading',  value: result.issues.filter(i => i.category === 'Trading').length,  color: CAT_COLORS.Trading,  icon: '📈' },
        { label: 'Logic',    value: result.issues.filter(i => i.category === 'Logic').length,    color: CAT_COLORS.Logic,    icon: '⚙️' },
    ];

    return (
        <div className="fade-up-1 space-y-4">
            {/* Chart title */}
            <p className="text-xs font-mono text-slate-600 uppercase tracking-widest">Visual Analysis</p>

            {/* 3-col chart row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* 1 — Donut: severity distribution */}
                <div className="card p-5">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-4">Severity Distribution</p>
                    <DonutChart data={donutData} />
                </div>

                {/* 2 — Semi-gauge: risk score */}
                <div className="card p-5 flex flex-col items-center">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-4">Risk Score</p>
                    <SemiGauge score={result.summary.overall_risk_score} color={riskColor} />
                    <div className="mt-3 text-center">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                            style={{ background: `${riskColor}18`, color: riskColor, border: `1px solid ${riskColor}33` }}>
                            {risk} Risk
                        </div>
                    </div>
                </div>

                {/* 3 — Category bars */}
                <div className="card p-5">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-4">By Category</p>
                    <CategoryBars data={catData} />
                </div>
            </div>

            {/* Bottom row: Spider + Heatmap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Spider chart */}
                <div className="card p-5 flex flex-col items-center">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-2 self-start">Risk Radar</p>
                    <p className="text-xs text-slate-700 mb-3 self-start">Weighted risk score per dimension (0–100)</p>
                    <SpiderChart issues={result.issues} />
                </div>

                {/* Heatmap */}
                <div className="card p-5">
                    <p className="text-xs font-mono text-slate-600 uppercase tracking-wider mb-1">Severity × Category Matrix</p>
                    <p className="text-xs text-slate-700 mb-4">Darker cell = more issues at that intersection</p>
                    <SeverityHeatmap issues={result.issues} />
                </div>
            </div>
        </div>
    );
}
