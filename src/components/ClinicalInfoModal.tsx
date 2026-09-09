import React from 'react';
import { X, BookOpen, CheckCircle, ShieldAlert, Cpu, Sparkles } from 'lucide-react';

interface ClinicalInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClinicalInfoModal: React.FC<ClinicalInfoModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-800 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">
                FACS & PSPI Pain Telemetry Protocol
              </h2>
              <p className="text-xs text-slate-400">
                Biomedical computer vision foundation for non-verbal pain quantification
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 leading-relaxed">
          {/* Section 1: PSPI Formula */}
          <div className="bg-slate-950/90 border border-slate-800 p-4 rounded-xl">
            <h3 className="text-sm font-bold text-cyan-300 mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              The Prkachin & Solomon Pain Intensity (PSPI) Metric
            </h3>
            <p className="text-slate-300 mb-3">
              The PSPI is the gold standard scientific algorithm mapping Facial Action Coding System (FACS) action units directly to clinical pain intensity:
            </p>
            <div className="bg-slate-900 p-3 rounded-lg border border-slate-700/80 font-mono text-cyan-200 text-center text-xs tracking-wide">
              Pain = AU4 + max(AU6, AU7) + max(AU9, AU10) + AU43
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Where AU4 represents Brow Lowering, AU6/7 represents Orbital Tightening, AU9/10 represents Levator / Nose-Lip Wrinkling, and AU43 represents Eye Closure/Squint. Each unit is scored 0 to 5 for a total metric of 0 to 16.
            </p>
          </div>

          {/* Section 2: Core Action Units Table */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2.5">
              Core Facial Action Units (FACS) Monitored
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                <div className="font-mono font-bold text-cyan-400 text-xs">AU4 • Brow Lowerer</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Corrugator supercilii & depressor supercilii. Pulls eyebrows down and medially, generating vertical forehead furrows.
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                <div className="font-mono font-bold text-cyan-400 text-xs">AU6/7 • Orbital Tighteners</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Orbicularis oculi (pars orbitalis & palpebralis). Raises cheeks, narrows eye aperture, and deepens infraorbital folds.
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                <div className="font-mono font-bold text-cyan-400 text-xs">AU9/10 • Midface Levator</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Levator labii superioris & nasalis. Wrinkles the nasal bridge, deepens the nasolabial sulcus, and elevates the upper lip.
                </div>
              </div>
              <div className="bg-slate-950/70 border border-slate-800/80 p-3 rounded-xl">
                <div className="font-mono font-bold text-cyan-400 text-xs">AU25/26/27 • Oral Grimace</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Risorius & masseter tension. Horizontal lip elongation, parted teeth, or jaw clamping associated with high nociceptive distress.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Clinical Cohort Applications */}
          <div>
            <h3 className="text-sm font-bold text-slate-200 mb-2">
              Clinical Indications & Use Cases
            </h3>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300">
              <li>
                <strong className="text-slate-100">Intensive Care & Non-Verbal Patients:</strong> Continuous automated monitoring for intubated or sedated ICU patients (CPOT / BPS correlation).
              </li>
              <li>
                <strong className="text-slate-100">Geriatric & Dementia Care:</strong> Detection of pain in patients with advanced cognitive impairment who cannot articulate Numeric Rating Scales (PACSLAC framework).
              </li>
              <li>
                <strong className="text-slate-100">Pediatric Assessment:</strong> Validated non-intrusive observation correlating with FLACC and Wong-Baker FACES scales.
              </li>
              <li>
                <strong className="text-slate-100">Post-Operative & Physical Therapy:</strong> Objective tracking before and after analgesic delivery or mobility exercises.
              </li>
            </ul>
          </div>

          {/* Clinical Disclaimer */}
          <div className="bg-amber-950/40 border border-amber-800/70 p-3.5 rounded-xl text-amber-300 text-[11px] flex items-start gap-2.5">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Clinical Device Note:</strong> This application serves as an AI clinical decision support tool and research prototype. Assessments should complement professional nursing evaluation, patient self-reports, and multidimensional physiological monitoring.
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
