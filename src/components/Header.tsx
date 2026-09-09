import React from 'react';
import {
  Activity,
  Volume2,
  VolumeX,
  Info,
  UserCheck,
  ShieldAlert,
  Sparkles,
  FileText,
} from 'lucide-react';
import { soundSystem } from '../utils/audioAlerts';

interface HeaderProps {
  category: 'Adult' | 'Pediatric' | 'Geriatric' | 'Non-Verbal / ICU';
  setCategory: (c: 'Adult' | 'Pediatric' | 'Geriatric' | 'Non-Verbal / ICU') => void;
  hasBaseline: boolean;
  clearBaseline: () => void;
  onOpenInfo: () => void;
  onOpenReport: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  category,
  setCategory,
  hasBaseline,
  clearBaseline,
  onOpenInfo,
  onOpenReport,
  historyCount,
}) => {
  const [soundEnabled, setSoundEnabled] = React.useState(soundSystem.isEnabled());

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundSystem.setEnabled(next);
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 lg:px-8 py-3.5 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Activity className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-slate-100 tracking-tight">
                AI Pain Assessment
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-cyan-950 text-cyan-400 border border-cyan-800/80 px-2 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                Gemini 3.8 Vision
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Facial Action Coding (FACS) & PSPI Computer Vision Severity Scoring
            </p>
          </div>
        </div>

        {/* Controls & Mode Switches */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Patient Category Dropdown */}
          <div id="patient-category-selector" className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-300">
            <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Cohort:</span>
            <select
              id="patient-cohort-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="Adult" className="bg-slate-900 text-slate-200">Adult Patient</option>
              <option value="Pediatric" className="bg-slate-900 text-slate-200">Pediatric (FLACC/Wong-Baker)</option>
              <option value="Geriatric" className="bg-slate-900 text-slate-200">Geriatric (Dementia/PACSLAC)</option>
              <option value="Non-Verbal / ICU" className="bg-slate-900 text-slate-200">Non-Verbal / ICU (CPOT)</option>
            </select>
          </div>

          {/* Baseline Indicator */}
          {hasBaseline && (
            <div id="baseline-status-badge" className="flex items-center gap-1.5 bg-emerald-950/70 border border-emerald-700/80 text-emerald-300 text-xs px-2.5 py-1 rounded-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Baseline Calibrated</span>
              <button
                id="btn-clear-baseline"
                onClick={clearBaseline}
                className="text-[11px] text-emerald-400 hover:text-emerald-200 underline ml-1 cursor-pointer"
                title="Reset neutral baseline"
              >
                Clear
              </button>
            </div>
          )}

          {/* Audio Chime Toggle */}
          <button
            id="btn-toggle-sound"
            onClick={toggleSound}
            className={`p-2 rounded-lg border text-xs flex items-center gap-1 transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                : 'bg-slate-800/40 border-slate-800 text-slate-500 hover:bg-slate-800'
            }`}
            title={soundEnabled ? 'Clinical audio alerts enabled' : 'Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Clinical Handover Report */}
          <button
            id="btn-open-report"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition-colors cursor-pointer"
            title="View assessment history and export clinical handover note"
          >
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Report Log ({historyCount})</span>
          </button>

          {/* FACS Scientific Info Modal */}
          <button
            id="btn-open-info"
            onClick={onOpenInfo}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Scientific FACS & PSPI Protocol Documentation"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
