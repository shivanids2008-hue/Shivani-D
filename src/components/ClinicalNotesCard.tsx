import React from 'react';
import { PainAssessmentResult } from '../types';
import { Stethoscope, AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, Check } from 'lucide-react';

interface ClinicalNotesCardProps {
  assessment: PainAssessmentResult | null;
}

export const ClinicalNotesCard: React.FC<ClinicalNotesCardProps> = ({ assessment }) => {
  if (!assessment) return null;

  const getRiskDisplay = (flag: string) => {
    switch (flag) {
      case 'critical':
        return {
          icon: <ShieldAlert className="w-4 h-4 text-rose-400" />,
          title: 'Critical Distress Alert',
          bg: 'bg-rose-950/60 border-rose-800/80 text-rose-300',
        };
      case 'attention':
        return {
          icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
          title: 'Clinical Attention Advised',
          bg: 'bg-amber-950/60 border-amber-800/80 text-amber-300',
        };
      default:
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          title: 'Stable / Baseline Within Limits',
          bg: 'bg-emerald-950/50 border-emerald-800/70 text-emerald-300',
        };
    }
  };

  const risk = getRiskDisplay(assessment.riskFlag || 'normal');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
          <Stethoscope className="w-4 h-4 text-cyan-400" />
          Clinical Assessment & Guidance
        </h2>
        {/* Risk Banner */}
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${risk.bg}`}>
          {risk.icon}
          <span>{risk.title}</span>
        </div>
      </div>

      {/* Clinical Interpretation */}
      <div className="space-y-1">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
          Diagnostic Impression:
        </span>
        <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/80 p-3 rounded-xl border border-slate-800">
          {assessment.clinicalInterpretation ||
            'Patient exhibits neutral facial tone with no significant signs of acute distress or discomfort.'}
        </p>
      </div>

      {/* Recommended Action */}
      <div className="space-y-1">
        <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
          Recommended Action / Nursing Protocol:
        </span>
        <div className="flex items-start gap-2 text-xs text-cyan-300 bg-cyan-950/50 border border-cyan-800/60 p-3 rounded-xl">
          <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {assessment.recommendedAction ||
              'Continue scheduled observation; maintain patient comfort and standard vital checks.'}
          </p>
        </div>
      </div>

      {/* Image Quality Diagnostics */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
        <div className="flex items-center gap-3">
          <span>
            Lighting:{' '}
            <strong className="text-slate-200 uppercase">
              {assessment.imageQuality?.lighting || 'Good'}
            </strong>
          </span>
          <span>
            Alignment:{' '}
            <strong className="text-slate-200 uppercase">
              {assessment.imageQuality?.faceAlignment || 'Optimal'}
            </strong>
          </span>
        </div>
        <span className="text-slate-500">
          ID: {assessment.id ? assessment.id.slice(0, 14) : 'N/A'}
        </span>
      </div>
    </div>
  );
};
