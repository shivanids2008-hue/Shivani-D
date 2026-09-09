import React, { useState } from 'react';
import { X, Printer, Copy, Check, FileText, Calendar, Clock, AlertTriangle } from 'lucide-react';
import { PainAssessmentResult } from '../types';

interface ClinicalReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: PainAssessmentResult[];
  category: string;
}

export const ClinicalReportModal: React.FC<ClinicalReportModalProps> = ({
  isOpen,
  onClose,
  history,
  category,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const latest = history[0];
  const scores = history.map((h) => h.overallPainScore);
  const maxScore = history.length ? Math.max(...scores) : 0;
  const minScore = history.length ? Math.min(...scores) : 0;
  const avgScore = history.length
    ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
    : 0;

  const copyReport = () => {
    const text = `CLINICAL PAIN TELEMETRY SESSION REPORT
Generated: ${new Date().toLocaleString()}
Patient Cohort: ${category}
Total Readings: ${history.length}
Score Range: Min ${minScore} - Max ${maxScore} (Avg: ${avgScore})

LATEST EVALUATION:
Score: ${latest?.overallPainScore ?? 'N/A'} / 10.0 (${latest?.severityLevel ?? 'N/A'})
PSPI Score: ${latest?.pspiFormulaScore ?? 'N/A'} / 16
Confidence: ${latest?.confidence ?? 'N/A'}%
Diagnostic Impression: ${latest?.clinicalInterpretation ?? 'N/A'}
Recommended Action: ${latest?.recommendedAction ?? 'N/A'}
Risk Flag: ${latest?.riskFlag ?? 'N/A'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-950 text-indigo-400 border border-indigo-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                Clinical Pain Handover & Session Report
              </h2>
              <p className="text-xs text-slate-400">
                EHR-ready documentation of computer vision facial pain scores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Report Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Top Meta Card */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Patient Cohort</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">{category}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Session Date</div>
              <div className="text-xs font-bold text-slate-200 mt-0.5">{new Date().toLocaleDateString()}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Total Observations</div>
              <div className="text-xs font-bold text-cyan-400 font-mono mt-0.5">{history.length}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase font-semibold text-slate-500">Severity Mean</div>
              <div className="text-xs font-bold text-amber-400 font-mono mt-0.5">{avgScore} / 10</div>
            </div>
          </div>

          {/* Current Evaluation Details */}
          {latest && (
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950/60 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <span className="font-bold text-sm text-slate-200">
                  Most Recent Assessment ({new Date(latest.timestamp).toLocaleTimeString()})
                </span>
                <span className="font-mono text-sm font-bold text-cyan-400">
                  {latest.overallPainScore.toFixed(1)} / 10.0 ({latest.severityLevel})
                </span>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Impression:</span>
                <p className="text-xs text-slate-300 mt-0.5">{latest.clinicalInterpretation}</p>
              </div>

              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">Recommended Protocol:</span>
                <p className="text-xs text-cyan-300 mt-0.5">{latest.recommendedAction}</p>
              </div>

              {/* Action Units Table */}
              <div>
                <span className="text-slate-500 text-[10px] uppercase font-bold">FACS Markers:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                  {latest.actionUnits.map((au) => (
                    <div key={au.code} className="bg-slate-900 border border-slate-800 p-2 rounded-lg text-[11px]">
                      <div className="font-mono font-bold text-slate-300">{au.code}</div>
                      <div className="text-slate-400 text-[10px]">{au.name}</div>
                      <div className="text-cyan-400 font-bold font-mono mt-1">Intensity: {au.intensity}/5</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Assessment Chronology Table */}
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">
              Assessment Chronology Log
            </h3>
            <div className="border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-2.5">Time</th>
                    <th className="p-2.5">Pain Score</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">PSPI</th>
                    <th className="p-2.5">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 font-mono text-slate-400">
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-2.5 font-bold font-mono text-cyan-400">
                        {item.overallPainScore.toFixed(1)}
                      </td>
                      <td className="p-2.5 font-medium text-slate-300">{item.severityLevel}</td>
                      <td className="p-2.5 font-mono text-slate-400">{item.pspiFormulaScore}</td>
                      <td className="p-2.5 font-mono text-slate-400">{item.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={copyReport}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Report</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
