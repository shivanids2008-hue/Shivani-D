import React from 'react';
import { PainAssessmentResult } from '../types';
import { TrendingUp, Clock, FileDown, Copy, Check, BarChart2 } from 'lucide-react';

interface PainTimelineProps {
  history: PainAssessmentResult[];
  onSelectAssessment?: (item: PainAssessmentResult) => void;
  activeId?: string;
}

export const PainTimeline: React.FC<PainTimelineProps> = ({
  history,
  onSelectAssessment,
  activeId,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-500 shadow-xl">
        No session assessments recorded yet. Run an assessment or activate Auto-Scan to build a temporal pain trend.
      </div>
    );
  }

  // Calculate statistics
  const scores = history.map((h) => h.overallPainScore);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const avgScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
  const severeCount = scores.filter((s) => s >= 6.5).length;

  // Generate Handover Note Text
  const generateHandoverText = () => {
    const latest = history[0];
    return `=== AI FACIAL PAIN ASSESSMENT CLINICAL SUMMARY ===
Timestamp: ${new Date().toLocaleString()}
Patient Cohort: ${latest.patientContext?.category || 'Adult'}
Total Evaluations in Session: ${history.length}
Current Pain Score: ${latest.overallPainScore} / 10.0 (${latest.severityLevel})
Session Range: Min ${minScore} - Peak ${maxScore} (Mean: ${avgScore})
PSPI Metric: ${latest.pspiFormulaScore} / 16
FACS Indicators: ${latest.actionUnits
      .filter((au) => au.intensity > 0)
      .map((au) => `${au.code} (intensity ${au.intensity}/5)`)
      .join(', ') || 'No elevated muscle action units'}
Diagnostic Impression: ${latest.clinicalInterpretation}
Recommended Action: ${latest.recommendedAction}
Alert Status: ${latest.riskFlag.toUpperCase()}
=================================================`;
  };

  const copyHandoverNote = () => {
    navigator.clipboard.writeText(generateHandoverText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `pain_session_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Build SVG trajectory line chart
  const chartHeight = 90;
  const chartWidth = 500;
  const points = [...history].reverse().map((item, idx, arr) => {
    const x = arr.length === 1 ? chartWidth / 2 : (idx / (arr.length - 1)) * (chartWidth - 40) + 20;
    const y = chartHeight - (item.overallPainScore / 10) * (chartHeight - 24) - 12;
    return { x, y, item };
  });

  const svgPath =
    points.length > 1
      ? points.reduce((acc, curr, idx) => `${acc} ${idx === 0 ? 'M' : 'L'} ${curr.x} ${curr.y}`, '')
      : '';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Session Severity Trajectory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal pain score progression over time ({history.length} evaluations)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={copyHandoverNote}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Copy clinical handover note to clipboard"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Handover'}</span>
          </button>
          <button
            onClick={downloadJson}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export session data as JSON"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Summary Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Current Score</div>
          <div className="text-lg font-bold font-mono text-cyan-400">
            {history[0]?.overallPainScore.toFixed(1)}
          </div>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Session Peak</div>
          <div className="text-lg font-bold font-mono text-rose-400">{maxScore.toFixed(1)}</div>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">Mean Average</div>
          <div className="text-lg font-bold font-mono text-amber-400">{avgScore.toFixed(1)}</div>
        </div>
        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[10px] uppercase font-semibold text-slate-400">High Pain Flares</div>
          <div className="text-lg font-bold font-mono text-slate-200">{severeCount}</div>
        </div>
      </div>

      {/* SVG Trajectory Chart */}
      <div className="bg-slate-950/90 border border-slate-800/80 rounded-xl p-3 overflow-hidden">
        <div className="relative w-full h-[90px]">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
            {/* Horizontal Grid guidelines (0, 3.5, 6.5, 10) */}
            <line x1="0" y1={chartHeight - 12} x2={chartWidth} y2={chartHeight - 12} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="0" y1={chartHeight * 0.65} x2={chartWidth} y2={chartHeight * 0.65} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
            <line x1="0" y1={chartHeight * 0.35} x2={chartWidth} y2={chartHeight * 0.35} stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" opacity="0.4" />

            {/* Severity trend line */}
            {points.length > 1 && (
              <path
                d={svgPath}
                fill="none"
                stroke="#06b6d4"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Data points */}
            {points.map((pt) => {
              const isSelected = pt.item.id === activeId;
              let ptColor = '#38bdf8';
              if (pt.item.overallPainScore >= 6.5) ptColor = '#ef4444';
              else if (pt.item.overallPainScore >= 3.5) ptColor = '#f59e0b';

              return (
                <g key={pt.item.id} className="cursor-pointer" onClick={() => onSelectAssessment?.(pt.item)}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isSelected ? 6 : 4}
                    fill={ptColor}
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    {pt.item.overallPainScore.toFixed(1)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-2 pt-1 border-t border-slate-900">
          <span>Oldest ({new Date(points[0]?.item.timestamp || Date.now()).toLocaleTimeString()})</span>
          <span>Red Line = Severe Threshold (6.5)</span>
          <span>Latest ({new Date(history[0]?.timestamp || Date.now()).toLocaleTimeString()})</span>
        </div>
      </div>

      {/* Chronological Recent Entries list */}
      <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
        {history.slice(0, 8).map((item) => {
          const isSelected = item.id === activeId;
          const timeStr = new Date(item.timestamp).toLocaleTimeString();

          let badgeColor = 'bg-slate-800 text-slate-300';
          if (item.overallPainScore >= 6.5) badgeColor = 'bg-rose-950 text-rose-300 border-rose-800';
          else if (item.overallPainScore >= 3.5) badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
          else if (item.overallPainScore >= 0.5) badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';

          return (
            <div
              key={item.id}
              onClick={() => onSelectAssessment?.(item)}
              className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                isSelected
                  ? 'bg-slate-850 border-cyan-500 shadow-md'
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="font-mono text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  {timeStr}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded border ${badgeColor}`}>
                  {item.overallPainScore.toFixed(1)} / 10 ({item.severityLevel})
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span>PSPI: {item.pspiFormulaScore}</span>
                <span className="text-slate-600">|</span>
                <span className="truncate max-w-[150px] text-slate-400 hidden sm:inline">
                  {item.clinicalInterpretation}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
