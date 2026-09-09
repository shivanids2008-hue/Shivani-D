import React from 'react';
import { PainAssessmentResult } from '../types';
import { ShieldCheck, ShieldAlert, Sparkles, TrendingUp, HelpCircle } from 'lucide-react';

interface PainGaugeProps {
  assessment: PainAssessmentResult | null;
  baselineAssessment: PainAssessmentResult | null;
  isAssessing: boolean;
}

export const PainGauge: React.FC<PainGaugeProps> = ({
  assessment,
  baselineAssessment,
  isAssessing,
}) => {
  const score = assessment?.overallPainScore ?? 0;
  const severity = assessment?.severityLevel ?? 'None';
  const confidence = assessment?.confidence ?? 92;
  const pspi = assessment?.pspiFormulaScore ?? 0;

  // Calculate delta from baseline if baseline is available
  const baselineScore = baselineAssessment?.overallPainScore ?? 0;
  const deltaFromBaseline = assessment && baselineAssessment
    ? Math.round((score - baselineScore) * 10) / 10
    : null;

  // Color mapping based on medical severity
  const getSeverityTheme = (lvl: string, val: number) => {
    if (val >= 8.5) {
      return {
        bg: 'bg-rose-950/70',
        border: 'border-rose-700/80',
        text: 'text-rose-400',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/50',
        barColor: 'from-amber-500 via-rose-500 to-rose-600',
        faceEmoji: '😫',
        label: 'Very Severe / Excruciating',
      };
    }
    if (val >= 6.5) {
      return {
        bg: 'bg-red-950/60',
        border: 'border-red-700/70',
        text: 'text-red-400',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
        barColor: 'from-yellow-500 via-orange-500 to-red-500',
        faceEmoji: '😣',
        label: 'Severe Pain',
      };
    }
    if (val >= 3.5) {
      return {
        bg: 'bg-amber-950/60',
        border: 'border-amber-700/70',
        text: 'text-amber-400',
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        barColor: 'from-emerald-500 via-yellow-500 to-amber-500',
        faceEmoji: '🙁',
        label: 'Moderate Discomfort',
      };
    }
    if (val >= 0.5) {
      return {
        bg: 'bg-emerald-950/50',
        border: 'border-emerald-700/60',
        text: 'text-emerald-400',
        badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
        barColor: 'from-cyan-500 to-emerald-500',
        faceEmoji: '😐',
        label: 'Mild Discomfort',
      };
    }
    return {
      bg: 'bg-slate-900/80',
      border: 'border-slate-800',
      text: 'text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
      barColor: 'from-slate-600 to-cyan-500',
      faceEmoji: '🙂',
      label: 'No Evident Pain',
    };
  };

  const theme = getSeverityTheme(severity, score);

  return (
    <div
      className={`rounded-2xl p-5 border transition-all duration-300 shadow-xl ${
        theme.bg
      } ${theme.border}`}
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Pain Severity Score
          </span>
          <span className="text-[11px] text-slate-500">(NRS / Wong-Baker Scale)</span>
        </div>

        {/* Confidence pill */}
        <div className="flex items-center gap-1 text-xs bg-slate-900/80 border border-slate-800 px-2.5 py-1 rounded-full text-slate-300 font-mono">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{confidence}% Confidence</span>
        </div>
      </div>

      {/* Hero Severity Value & Avatar */}
      <div className="flex items-baseline justify-between gap-4 my-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-6xl font-black tracking-tight font-mono ${theme.text}`}>
            {isAssessing ? (
              <span className="animate-pulse">--.-</span>
            ) : (
              score.toFixed(1)
            )}
          </span>
          <span className="text-xl font-bold text-slate-500">/ 10.0</span>
        </div>

        <div className="flex flex-col items-end">
          <div className="text-4xl mb-1">{theme.faceEmoji}</div>
          <span
            className={`text-xs font-bold uppercase tracking-wide px-3 py-1 rounded-full border ${theme.badgeBg}`}
          >
            {severity}
          </span>
        </div>
      </div>

      {/* Calibrated 0 - 10 Visual Rainbow Gradient Spectrum */}
      <div className="mt-5 mb-3">
        <div className="relative h-3 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
          {/* Clinical Gradient Base */}
          <div
            className="h-full w-full rounded-full opacity-80"
            style={{
              background:
                'linear-gradient(to right, #10b981 0%, #84cc16 25%, #eab308 50%, #f97316 75%, #ef4444 100%)',
            }}
          />
        </div>

        {/* Dynamic Needle Indicator */}
        <div className="relative w-full h-4 mt-1">
          <div
            className="absolute top-0 -translate-x-1/2 flex flex-col items-center transition-all duration-500 ease-out"
            style={{ left: `${Math.min(100, Math.max(0, (score / 10) * 100))}%` }}
          >
            <div className="w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-b-[6px] border-b-white" />
            <span className="text-[10px] font-mono font-bold text-white bg-slate-800 px-1 rounded shadow">
              {score.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Scale labels */}
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1 px-1">
          <span>0 (None)</span>
          <span>2 (Mild)</span>
          <span>5 (Moderate)</span>
          <span>7 (Severe)</span>
          <span>10 (Worst)</span>
        </div>
      </div>

      {/* Metric Breakdown Grid */}
      <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-800/80 text-xs">
        {/* PSPI Score */}
        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">PSPI Score</div>
            <div className="text-sm font-bold text-slate-200 font-mono">
              {pspi} <span className="text-slate-500 text-xs">/ 16</span>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 text-right">
            Prkachin & Solomon
          </div>
        </div>

        {/* Differential vs Baseline */}
        <div className="bg-slate-900/70 border border-slate-800 p-2.5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Delta vs Baseline</div>
            <div className="text-sm font-bold font-mono">
              {deltaFromBaseline !== null ? (
                <span
                  className={
                    deltaFromBaseline > 0
                      ? 'text-amber-400'
                      : deltaFromBaseline < 0
                      ? 'text-emerald-400'
                      : 'text-slate-300'
                  }
                >
                  {deltaFromBaseline > 0 ? `+${deltaFromBaseline}` : deltaFromBaseline}
                </span>
              ) : (
                <span className="text-slate-500">No baseline</span>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-500">
            {deltaFromBaseline !== null && deltaFromBaseline > 0 ? 'Elevated' : 'Calibrated'}
          </div>
        </div>
      </div>
    </div>
  );
};
