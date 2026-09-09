import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { CameraVisionHUD } from './components/CameraVisionHUD';
import { PainGauge } from './components/PainGauge';
import { ActionUnitsPanel } from './components/ActionUnitsPanel';
import { FacialRegionsGrid } from './components/FacialRegionsGrid';
import { ClinicalNotesCard } from './components/ClinicalNotesCard';
import { PainTimeline } from './components/PainTimeline';
import { ClinicalInfoModal } from './components/ClinicalInfoModal';
import { ClinicalReportModal } from './components/ClinicalReportModal';
import { PainAssessmentResult } from './types';
import { soundSystem } from './utils/audioAlerts';
import { AlertCircle, Activity, Sparkles, CheckCircle2 } from 'lucide-react';
import { CLINICAL_PRESETS } from './data/clinicalCases';
import { getFrameAsJpegBase64 } from './utils/visionEngine';

export default function App() {
  const [currentAssessment, setCurrentAssessment] = useState<PainAssessmentResult | null>(null);
  const [baselineAssessment, setBaselineAssessment] = useState<PainAssessmentResult | null>(null);
  const [history, setHistory] = useState<PainAssessmentResult[]>([]);
  const [category, setCategory] = useState<'Adult' | 'Pediatric' | 'Geriatric' | 'Non-Verbal / ICU'>('Adult');
  const [isAssessing, setIsAssessing] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [baselineNotification, setBaselineNotification] = useState<string | null>(null);

  // Perform pain assessment via server Gemini API
  const handleAssess = async (imageData: string, isAuto: boolean = false) => {
    if (isAssessing) return;

    try {
      setIsAssessing(true);
      setApiError(null);
      if (!isAuto) {
        soundSystem.playScanSound();
      }

      const response = await fetch('/api/assess-pain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageData,
          baselineImage: baselineAssessment?.snapshotThumbnail,
          context: {
            category,
            previousScore: currentAssessment?.overallPainScore,
            mode: isAuto ? 'Continuous Monitoring' : 'Manual Examination',
          },
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Evaluation failed with status ${response.status}`);
      }

      const data: PainAssessmentResult = await response.json();
      data.snapshotThumbnail = imageData;
      data.patientContext = {
        category,
        mode: isAuto ? 'Continuous Monitoring' : 'Manual Exam',
      };

      setCurrentAssessment(data);
      setHistory((prev) => [data, ...prev.slice(0, 29)]);

      // Audio feedback based on severity threshold
      if (data.overallPainScore >= 6.5) {
        soundSystem.playPainAlert();
      } else {
        soundSystem.playSuccessChime();
      }
    } catch (err: any) {
      console.error('Pain assessment failed:', err);
      setApiError(err.message || 'Failed to complete AI pain assessment');
    } finally {
      setIsAssessing(false);
    }
  };

  // Calibrate neutral baseline
  const handleSetBaseline = async (imageData: string) => {
    try {
      setIsAssessing(true);
      setBaselineNotification(null);
      setApiError(null);

      const response = await fetch('/api/assess-pain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          context: {
            category,
            mode: 'Baseline Calibration',
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Could not calibrate baseline image');
      }

      const data: PainAssessmentResult = await response.json();
      data.snapshotThumbnail = imageData;
      setBaselineAssessment(data);
      setBaselineNotification('Neutral baseline calibrated successfully! Subsequent scores will track relative changes.');
      setTimeout(() => setBaselineNotification(null), 5000);
    } catch (err: any) {
      setApiError(err.message || 'Failed to calibrate baseline');
    } finally {
      setIsAssessing(false);
    }
  };

  const clearBaseline = () => {
    setBaselineAssessment(null);
    setBaselineNotification('Neutral baseline cleared.');
    setTimeout(() => setBaselineNotification(null), 3000);
  };

  // Initial seed assessment so the dashboard is immediately rich and active on launch
  useEffect(() => {
    let isMounted = true;
    const initSeed = async () => {
      try {
        const preset = CLINICAL_PRESETS[2]; // Moderate Physical Therapy Strain
        const jpeg = await getFrameAsJpegBase64(preset.svgDataUri, 640, 480);
        if (jpeg && isMounted) {
          await handleAssess(jpeg, true);
        }
      } catch (err) {
        console.warn('Initial seed assessment error:', err);
      }
    };
    initSeed();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30">
      {/* App Header */}
      <Header
        category={category}
        setCategory={setCategory}
        hasBaseline={Boolean(baselineAssessment)}
        clearBaseline={clearBaseline}
        onOpenInfo={() => setIsInfoModalOpen(true)}
        onOpenReport={() => setIsReportModalOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Baseline Notification Pill */}
        {baselineNotification && (
          <div className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 px-4 py-2.5 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{baselineNotification}</span>
            </div>
            <button
              onClick={() => setBaselineNotification(null)}
              className="text-emerald-400 hover:text-emerald-200 text-xs font-bold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div className="bg-rose-950/80 border border-rose-800/90 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{apiError}</span>
            </div>
            <button
              onClick={() => setApiError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs font-semibold ml-2 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Two-Column Clinical Assessment Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (Webcam HUD & Continuous Telemetry) - 6 or 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <CameraVisionHUD
              onAssess={handleAssess}
              onSetBaseline={handleSetBaseline}
              isAssessing={isAssessing}
              estimatedSeverity={currentAssessment?.overallPainScore}
              hasBaseline={Boolean(baselineAssessment)}
            />

            {/* Trajectory Timeline & Historical Log */}
            <PainTimeline
              history={history}
              activeId={currentAssessment?.id}
              onSelectAssessment={(item) => setCurrentAssessment(item)}
            />
          </div>

          {/* Right Column (Severity Score, FACS Breakdown, Regions, Notes) - 5 or 6 cols */}
          <div className="lg:col-span-5 space-y-6">
            {/* Real-time Severity Score Gauge */}
            <PainGauge
              assessment={currentAssessment}
              baselineAssessment={baselineAssessment}
              isAssessing={isAssessing}
            />

            {/* Clinical Interpretation & Nursing Action */}
            <ClinicalNotesCard assessment={currentAssessment} />

            {/* Anatomical Regions Quadrant Grid */}
            <FacialRegionsGrid regions={currentAssessment?.facialRegions} />

            {/* FACS Action Units Intensity */}
            <ActionUnitsPanel actionUnits={currentAssessment?.actionUnits || []} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>AI Pain Assessment • Computer Vision FACS & PSPI Protocol</span>
          </div>
          <div>Powered by Google Gemini 3.8 Flash Vision Model</div>
        </div>
      </footer>

      {/* Modals */}
      <ClinicalInfoModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
      />

      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        history={history}
        category={category}
      />
    </div>
  );
}
