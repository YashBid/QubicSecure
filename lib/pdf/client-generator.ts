import { AnalysisResult } from '../types/analysis';

/**
 * Client-side PDF/HTML Report Generator
 * Opens a print-ready HTML report in a new tab.
 * User presses Ctrl+P → Save as PDF (or it auto-triggers).
 */

const SEVERITY_COLORS: Record<string, string> = {
    Critical: '#ff3b5c',
    High:     '#ff8c42',
    Medium:   '#f5c518',
    Low:      '#22c55e',
};

const RISK_BG: Record<string, string> = {
    Critical: '#2d0a10',
    High:     '#2d1505',
    Medium:   '#2a2000',
    Low:      '#0a2010',
};

export function generateAndDownloadReport(
    result: AnalysisResult,
    metadata: { fileName: string; analysisId: string; timestamp: string; fileHash?: string }
) {
    const sortedIssues = [...result.issues].sort((a, b) => {
        const order = { Critical: 0, High: 1, Medium: 2, Low: 3 };
        return order[a.severity as keyof typeof order] - order[b.severity as keyof typeof order];
    });

    const severityCounts = {
        Critical: result.issues.filter(i => i.severity === 'Critical').length,
        High:     result.issues.filter(i => i.severity === 'High').length,
        Medium:   result.issues.filter(i => i.severity === 'Medium').length,
        Low:      result.issues.filter(i => i.severity === 'Low').length,
    };

    const riskColor = SEVERITY_COLORS[result.summary.risk_level] || '#22c55e';
    const riskBg    = RISK_BG[result.summary.risk_level]    || '#0a2010';

    const issuesHTML = sortedIssues.map((issue, i) => `
        <div class="issue-card" style="border-left-color: ${SEVERITY_COLORS[issue.severity] || '#888'}">
            <div class="issue-header">
                <span class="issue-num">#${String(i + 1).padStart(2, '0')}</span>
                <span class="issue-title">${escHtml(issue.title)}</span>
                <span class="badge" style="background:${SEVERITY_COLORS[issue.severity]}22; color:${SEVERITY_COLORS[issue.severity]}; border-color:${SEVERITY_COLORS[issue.severity]}44">${issue.severity}</span>
                <span class="badge cat-badge">${issue.category}</span>
                <span class="badge cat-badge">${issue.source}</span>
            </div>
            <div class="issue-body">
                <div class="field-block">
                    <div class="field-label">Description</div>
                    <div class="field-content">${escHtml(issue.description)}</div>
                </div>
                <div class="field-block">
                    <div class="field-label impact-label">Impact</div>
                    <div class="field-content">${escHtml(issue.impact)}</div>
                </div>
                <div class="field-block">
                    <div class="field-label exploit-label">Exploit Scenario</div>
                    <div class="field-content">${escHtml(issue.exploit_scenario)}</div>
                </div>
                <div class="field-block">
                    <div class="field-label fix-label">Recommended Fix</div>
                    <div class="field-content">${escHtml(issue.recommended_fix)}</div>
                </div>
            </div>
        </div>
    `).join('');

    const optsHTML = result.optimizations.map((opt, i) => `
        <div class="opt-card">
            <div class="opt-num">${i + 1}</div>
            <div>
                <div class="opt-title">${escHtml(opt.description)}</div>
                <div class="opt-benefit"><span class="benefit-label">Expected benefit:</span> ${escHtml(opt.expected_benefit)}</div>
            </div>
        </div>
    `).join('');

    const severityBarsHTML = Object.entries(severityCounts).map(([sev, count]) => `
        <div class="sev-row">
            <span class="sev-label">${sev}</span>
            <div class="sev-track">
                <div class="sev-fill" style="width:${result.issues.length > 0 ? (count / result.issues.length) * 100 : 0}%; background:${SEVERITY_COLORS[sev]}"></div>
            </div>
            <span class="sev-count" style="color:${SEVERITY_COLORS[sev]}">${count}</span>
        </div>
    `).join('');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Qubic Audit Report — ${escHtml(metadata.fileName)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    background: #020408;
    color: #e2e8f0;
    min-height: 100vh;
    padding: 0 0 60px;
  }
  /* Print button — hidden when printing */
  .print-bar {
    position: sticky; top: 0; z-index: 100;
    background: #060d18;
    border-bottom: 1px solid rgba(34,211,238,0.12);
    padding: 12px 40px;
    display: flex; align-items: center; justify-content: space-between;
  }
  .print-bar span { font-size: 13px; color: #64748b; }
  .print-btn {
    padding: 8px 24px;
    background: linear-gradient(135deg, #0891b2, #7c3aed);
    color: white; border: none; border-radius: 8px;
    font-size: 13px; font-weight: 600; cursor: pointer;
    transition: opacity 0.2s;
  }
  .print-btn:hover { opacity: 0.85; }

  .report-wrap { max-width: 860px; margin: 0 auto; padding: 40px 24px; }

  /* Header */
  .report-header {
    border: 1px solid rgba(34,211,238,0.12);
    border-radius: 20px;
    background: #060d18;
    padding: 36px 40px;
    margin-bottom: 24px;
  }
  .header-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; }
  .logo-mark { width: 40px; height: 40px; background: linear-gradient(135deg, #22d3ee, #7c3aed); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 18px; }
  .header-badge { font-size: 11px; font-family: monospace; color: #22d3ee; background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.15); border-radius: 20px; padding: 4px 14px; letter-spacing: 0.1em; text-transform: uppercase; }
  .report-title { font-size: 32px; font-weight: 900; margin: 0 0 6px; color: white; letter-spacing: -0.02em; }
  .report-subtitle { font-size: 14px; color: #64748b; }
  .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .meta-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); border-radius: 10px; padding: 12px 16px; }
  .meta-key { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #475569; margin-bottom: 4px; font-family: monospace; }
  .meta-val { font-size: 13px; font-family: monospace; color: #94a3b8; word-break: break-all; }

  /* Risk hero */
  .risk-hero {
    border-radius: 20px;
    border: 1px solid;
    padding: 32px 40px;
    margin-bottom: 24px;
    display: flex; align-items: center; gap: 40px;
  }
  .risk-circle {
    width: 120px; height: 120px; border-radius: 50%;
    background: conic-gradient(#22c55e 0deg 72deg, #f5c518 72deg 144deg, #ff8c42 144deg 216deg, #ff3b5c 216deg 360deg);
    flex-shrink: 0; position: relative;
    display: flex; align-items: center; justify-content: center;
  }
  .risk-circle-inner {
    position: absolute; inset: 10px; border-radius: 50%;
    background: #020408;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
  }
  .risk-score-num { font-size: 28px; font-weight: 900; }
  .risk-score-label { font-size: 10px; color: #64748b; margin-top: 2px; }
  .risk-right { flex: 1; }
  .risk-level-text { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
  .risk-sub { font-size: 13px; color: #64748b; margin-bottom: 20px; }
  .sev-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .sev-label { font-size: 11px; font-family: monospace; color: #64748b; width: 56px; }
  .sev-track { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
  .sev-fill { height: 100%; border-radius: 2px; }
  .sev-count { font-size: 13px; font-weight: 700; width: 20px; text-align: right; }

  /* Section */
  .section { margin-bottom: 24px; }
  .section-title {
    font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
    color: #64748b; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: rgba(255,255,255,0.05); }
  .section-count {
    font-size: 11px; font-family: monospace; background: rgba(255,255,255,0.05);
    color: #94a3b8; border-radius: 12px; padding: 2px 10px;
  }

  /* Issue cards */
  .issue-card {
    background: #060d18; border: 1px solid rgba(255,255,255,0.05);
    border-left: 3px solid; border-radius: 14px;
    margin-bottom: 12px; overflow: hidden;
  }
  .issue-header {
    display: flex; align-items: center; gap: 10px;
    padding: 14px 20px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    flex-wrap: wrap;
  }
  .issue-num { font-family: monospace; font-size: 11px; color: #475569; }
  .issue-title { font-size: 14px; font-weight: 700; color: white; flex: 1; min-width: 180px; }
  .badge {
    font-size: 10px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase;
    padding: 3px 10px; border-radius: 20px; border: 1px solid; white-space: nowrap;
  }
  .cat-badge { background: rgba(99,179,237,0.08); color: #64748b; border-color: rgba(99,179,237,0.15); }
  .issue-body { padding: 16px 20px; display: grid; gap: 12px; }
  .field-block {}
  .field-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 700; margin-bottom: 4px; font-family: monospace; color: #475569; }
  .impact-label { color: #3b82f6; }
  .exploit-label { color: #a78bfa; }
  .fix-label { color: #22c55e; }
  .field-content { font-size: 13px; color: #94a3b8; line-height: 1.6; }

  /* Optimizations */
  .opt-card {
    background: #060d18; border: 1px solid rgba(34,211,238,0.08);
    border-radius: 12px; padding: 14px 18px;
    margin-bottom: 10px; display: flex; gap: 14px; align-items: flex-start;
  }
  .opt-num {
    width: 28px; height: 28px; border-radius: 8px; flex-shrink: 0;
    background: rgba(34,211,238,0.08); border: 1px solid rgba(34,211,238,0.15);
    color: #22d3ee; font-size: 12px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
  }
  .opt-title { font-size: 13px; font-weight: 600; color: white; margin-bottom: 4px; }
  .opt-benefit { font-size: 12px; color: #64748b; line-height: 1.5; }
  .benefit-label { color: #22d3ee; }

  /* Verdict */
  .verdict-card {
    background: #060d18; border: 1px solid rgba(124,58,237,0.2);
    border-radius: 16px; padding: 24px 28px;
  }
  .verdict-inner {
    background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.04);
    border-radius: 10px; padding: 18px 20px;
  }
  .verdict-text { font-size: 13px; color: #94a3b8; line-height: 1.8; white-space: pre-wrap; font-family: monospace; }

  /* Footer */
  .report-footer {
    text-align: center; margin-top: 40px;
    font-size: 11px; font-family: monospace; color: #1e293b;
  }

  /* No issues */
  .no-issues {
    border: 1px solid rgba(34,197,94,0.2); background: rgba(34,197,94,0.04);
    border-radius: 14px; padding: 32px; text-align: center;
    color: #22c55e; font-size: 14px;
  }

  @media print {
    .print-bar { display: none; }
    body { background: white; color: black; padding: 0; }
    .report-header, .risk-hero, .issue-card, .opt-card, .verdict-card {
      background: white !important; border-color: #e5e7eb !important;
      color: black !important; break-inside: avoid;
    }
    .issue-title, .report-title { color: black !important; }
    .field-content, .verdict-text, .opt-benefit { color: #374151 !important; }
    .meta-val, .sev-label, .issue-num, .opt-title, .risk-sub { color: #6b7280 !important; }
    .field-label, .section-title { color: #6b7280 !important; }
    .no-issues { color: #16a34a !important; }
  }
</style>
</head>
<body>
  <div class="print-bar">
    <span>Qubic Smart Contract Audit Report — ${escHtml(metadata.fileName)}</span>
    <button class="print-btn" onclick="window.print()">⬇ Save as PDF</button>
  </div>

  <div class="report-wrap">
    <!-- Header -->
    <div class="report-header">
      <div class="header-top">
        <div class="logo-mark">Q</div>
        <span class="header-badge">Security Audit Report</span>
      </div>
      <div class="report-title">Qubic Audit</div>
      <div class="report-subtitle" style="margin-bottom:24px">${escHtml(metadata.fileName)}</div>
      <div class="meta-grid">
        <div class="meta-item"><div class="meta-key">Analysis ID</div><div class="meta-val">${escHtml(metadata.analysisId)}</div></div>
        <div class="meta-item"><div class="meta-key">Timestamp</div><div class="meta-val">${escHtml(new Date(metadata.timestamp).toLocaleString())}</div></div>
        <div class="meta-item"><div class="meta-key">Contract File</div><div class="meta-val">${escHtml(metadata.fileName)}</div></div>
        <div class="meta-item"><div class="meta-key">Total Issues</div><div class="meta-val">${result.issues.length} found</div></div>
      </div>
    </div>

    <!-- Risk Hero -->
    <div class="risk-hero" style="background:${riskBg}; border-color:${riskColor}33">
      <div class="risk-circle">
        <div class="risk-circle-inner">
          <span class="risk-score-num" style="color:${riskColor}">${result.summary.overall_risk_score}</span>
          <span class="risk-score-label">/ 100</span>
        </div>
      </div>
      <div class="risk-right">
        <div class="risk-level-text" style="color:${riskColor}">${result.summary.risk_level} Risk</div>
        <div class="risk-sub">${getRiskSub(result.summary.risk_level)}</div>
        ${severityBarsHTML}
      </div>
    </div>

    <!-- Issues -->
    <div class="section">
      <div class="section-title">
        Security Issues
        <span class="section-count">${result.issues.length}</span>
      </div>
      ${result.issues.length > 0 ? issuesHTML : '<div class="no-issues">✅ No security issues detected</div>'}
    </div>

    <!-- Optimizations -->
    ${result.optimizations.length > 0 ? `
    <div class="section">
      <div class="section-title">Optimization Recommendations <span class="section-count">${result.optimizations.length}</span></div>
      ${optsHTML}
    </div>` : ''}

    <!-- Final Verdict -->
    <div class="section">
      <div class="section-title">Final Verdict</div>
      <div class="verdict-card">
        <div class="verdict-inner">
          <div class="verdict-text">${escHtml(result.final_verdict)}</div>
        </div>
      </div>
    </div>

    <div class="report-footer">
      QubicAudit — Generated ${new Date(metadata.timestamp).toUTCString()}
    </div>
  </div>

  <script>
    // Auto-trigger print after a short delay so styles load
    // Comment this out if you just want to review first
    // setTimeout(() => window.print(), 800);
  </script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url, '_blank');
    if (!win) {
        // Fallback: direct download of HTML file
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-report-${metadata.analysisId}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
}

function escHtml(s: string): string {
    if (!s) return '';
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getRiskSub(level: string): string {
    const map: Record<string, string> = {
        Critical: 'Do not deploy — critical vulnerabilities present',
        High:     'Fix high-severity issues before deployment',
        Medium:   'Review and resolve before production',
        Low:      'Minor issues — safe to deploy with caveats',
    };
    return map[level] || '';
}
