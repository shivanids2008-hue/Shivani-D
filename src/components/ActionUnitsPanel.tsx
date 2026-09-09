import React from 'react';
import { ActionUnitAssessment } from '../types';
import { Check, Eye, ChevronRight, Activity } from 'lucide-react';

interface ActionUnitsPanelProps {
  actionUnits: ActionUnitAssessment[];
}

export const ActionUnitsPanel: React.FC<ActionUnitsPanelProps> = ({ actionUnits }) => {
  // Label for FACS 0-5 scale
  const getIntensityLabel = (val: number) => {
    switch (val) {
      case 0:
        return 'Absent (0)';
      case 1:
        return 'Trace (A)';
      case 2:
        return 'Slight (B)';
      case 3:
        return 'Marked (C)';
      case 4:
        return 'Severe (D)';
      case 5:
        return 'Maximum (E)';
      default:
        return `${val}/5`;
    }
  };

  const getIntensityColor = (intensity: number) => {
    if (intensity >= 4) return 'bg-rose-500 text-rose-300';
    if (intensity >= 3) return 'bg-amber-500 text-amber-300';
    if (intensity >= 2) return 'bg-yellow-500 text-yellow-300';
    if (intensity >= 1) return 'bg-emerald-500 text-emerald-300';
    return 'bg-slate-700 text-slate-500';
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            FACS Action Units (Ekman / PSPI)
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Biometric facial muscle activation intensity (0 to 5 scale)
          </p>
        </div>
        <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2.5 py-0.5 rounded-full">
          7 Core Indicators
        </span>
      </div>

      <div className="space-y-3">
        {actionUnits && actionUnits.length > 0 ? (
          actionUnits.map((au) => {
            const intensity = au.intensity ?? 0;
            const isDetected = au.detected || intensity > 0;

            return (
              <div
                key={au.code}
                className={`p-3 rounded-xl border transition-all ${
                  isDetected && intensity >= 3
                    ? 'bg-slate-950/90 border-amber-900/40'
                    : isDetected && intensity >= 1
                    ? 'bg-slate-950/60 border-slate-800'
                    : 'bg-slate-950/30 border-slate-800/60 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {au.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-200">
                      {au.name}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded ${
                      intensity > 0
                        ? 'bg-slate-800 ' + getIntensityColor(intensity)
                        : 'text-slate-500'
                    }`}
                  >
                    {getIntensityLabel(intensity)}
                  </span>
                </div>

                {/* 5-Segment Visual Progress Bar */}
                <div className="grid grid-cols-5 gap-1 my-2">
                  {[1, 2, 3, 4, 5].map((level) => {
                    const active = intensity >= level;
                    return (
                      <div
                        key={level}
                        className={`h-1.5 rounded-full transition-all ${
                          active
                            ? getIntensityColor(intensity).split(' ')[0]
                            : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>

                {/* Computer Vision Observation Note */}
                <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                  {au.description || 'No noticeable muscle activation detected.'}
                </p>
              </div>
            );
          })
        ) : (
          <div className="text-center py-6 text-xs text-slate-500">
            No action unit data recorded yet. Initiate an assessment to evaluate facial landmarks.
          </div>
        )}
      </div>
    </div>
  );
};
