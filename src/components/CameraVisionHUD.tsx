import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  Scan,
  RefreshCw,
  Upload,
  Play,
  Square,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { drawComputerVisionHUD, captureFrameAsBase64, getFrameAsJpegBase64 } from '../utils/visionEngine';
import { CLINICAL_PRESETS, ClinicalCasePreset } from '../data/clinicalCases';
import { ClientFaceTelemetry } from '../types';

interface CameraVisionHUDProps {
  onAssess: (imageData: string, isAuto?: boolean) => Promise<void>;
  onSetBaseline: (imageData: string) => void;
  isAssessing: boolean;
  estimatedSeverity?: number;
  hasBaseline: boolean;
}

export const CameraVisionHUD: React.FC<CameraVisionHUDProps> = ({
  onAssess,
  onSetBaseline,
  isAssessing,
  estimatedSeverity = 0,
  hasBaseline,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activePreset, setActivePreset] = useState<ClinicalCasePreset | null>(null);
  const [uploadedImageSrc, setUploadedImageSrc] = useState<string | null>(null);

  // HUD layer toggles
  const [showFACSZones, setShowFACSZones] = useState<boolean>(true);
  const [showTensionHeatmap, setShowTensionHeatmap] = useState<boolean>(true);
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);

  // Auto-scan interval (0 = Off, 5000 = 5s, 10000 = 10s)
  const [autoScanInterval, setAutoScanInterval] = useState<number>(0);
  const autoScanTimerRef = useRef<any>(null);

  const [telemetry, setTelemetry] = useState<ClientFaceTelemetry | null>(null);
  const scanProgressRef = useRef<number>(0);
  const animationFrameIdRef = useRef<number>(0);

  // Start webcam
  const startCamera = async () => {
    try {
      setCameraError(null);
      setActivePreset(null);
      setUploadedImageSrc(null);

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera access issue:', err);
      setCameraError(
        'Webcam access unavailable or permission was not granted. You can use our built-in Clinical Presets or upload patient photos below.'
      );
      setCameraActive(false);
      // Fallback to clinical preset 4 (Severe Acute Flare) so user immediately has live data to assess
      if (!activePreset && !uploadedImageSrc) {
        selectPreset(CLINICAL_PRESETS[2]); // Moderate strain preset
      }
    }
  };

  // Stop webcam
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setAutoScanInterval(0);
  };

  // Switch to clinical preset
  const selectPreset = async (preset: ClinicalCasePreset, triggerAssess: boolean = true) => {
    stopCamera();
    setActivePreset(preset);
    setUploadedImageSrc(null);
    if (triggerAssess) {
      try {
        const jpeg = await getFrameAsJpegBase64(preset.svgDataUri, 640, 480);
        if (jpeg) {
          onAssess(jpeg, false);
        }
      } catch (err) {
        console.warn('Preset auto-assess error:', err);
      }
    }
  };

  // Handle manual file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const result = event.target?.result as string;
      stopCamera();
      setActivePreset(null);
      setUploadedImageSrc(result);
      if (result) {
        try {
          const jpeg = await getFrameAsJpegBase64(result, 640, 480);
          if (jpeg) {
            onAssess(jpeg, false);
          }
        } catch (err) {
          console.warn('Uploaded image assessment error:', err);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Capture current visible frame as base64 JPEG
  const getCurrentFrame = useCallback(async (): Promise<string | null> => {
    if (cameraActive && videoRef.current && videoRef.current.readyState >= 2) {
      return getFrameAsJpegBase64(videoRef.current, 640, 480);
    }
    const staticEl = document.getElementById('static-vision-source') as HTMLImageElement | null;
    if (staticEl && staticEl.complete && staticEl.naturalWidth > 0) {
      const jpeg = await getFrameAsJpegBase64(staticEl, 640, 480);
      if (jpeg) return jpeg;
    }
    if (activePreset) {
      return getFrameAsJpegBase64(activePreset.svgDataUri, 640, 480);
    }
    if (uploadedImageSrc) {
      return getFrameAsJpegBase64(uploadedImageSrc, 640, 480);
    }
    return null;
  }, [cameraActive, activePreset, uploadedImageSrc]);

  // Execute manual assessment
  const handleManualAssessment = async () => {
    const frame = await getCurrentFrame();
    if (frame) {
      await onAssess(frame, false);
    }
  };

  // Set neutral baseline
  const handleSetBaseline = async () => {
    const frame = await getCurrentFrame();
    if (frame) {
      onSetBaseline(frame);
    }
  };

  // Auto-scan timer effect
  useEffect(() => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
    }

    if (autoScanInterval > 0) {
      autoScanTimerRef.current = setInterval(async () => {
        if (!isAssessing) {
          const frame = await getCurrentFrame();
          if (frame) {
            onAssess(frame, true);
          }
        }
      }, autoScanInterval);
    }

    return () => {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
      }
    };
  }, [autoScanInterval, isAssessing, getCurrentFrame, onAssess]);

  // Real-time animation loop for canvas telemetry HUD
  useEffect(() => {
    let active = true;

    const renderLoop = () => {
      if (!active) return;

      const canvas = canvasRef.current;
      if (canvas) {
        if (isAssessing) {
          scanProgressRef.current = (scanProgressRef.current + 0.035) % 1.0;
        }

        const source = cameraActive
          ? videoRef.current
          : (document.getElementById('static-vision-source') as HTMLImageElement | null);

        if (source) {
          const telem = drawComputerVisionHUD(
            canvas,
            source as any,
            {
              showFACSZones,
              showTensionHeatmap,
              showLandmarks,
              isScanning: isAssessing,
              estimatedSeverity,
            },
            scanProgressRef.current
          );
          setTelemetry(telem);
        }
      }

      animationFrameIdRef.current = requestAnimationFrame(renderLoop);
    };

    renderLoop();

    return () => {
      active = false;
      cancelAnimationFrame(animationFrameIdRef.current);
    };
  }, [cameraActive, activePreset, uploadedImageSrc, showFACSZones, showTensionHeatmap, showLandmarks, isAssessing, estimatedSeverity]);

  // Auto-start camera on mount, fallback to preset if unpermitted
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
      {/* HUD Header Bar */}
      <div className="bg-slate-950/80 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span
              className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                cameraActive ? 'bg-emerald-400' : 'bg-cyan-400'
              }`}
            />
            <span
              className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                cameraActive ? 'bg-emerald-500' : 'bg-cyan-500'
              }`}
            />
          </span>
          <span className="text-xs font-semibold text-slate-200 tracking-wide">
            {cameraActive
              ? 'LIVE OPTICAL SENSOR'
              : activePreset
              ? `CASE SIMULATION: ${activePreset.name}`
              : 'STATIC CLINICAL FRAME'}
          </span>
          {isAssessing && (
            <span className="text-[10px] font-bold uppercase bg-cyan-900/60 text-cyan-300 border border-cyan-700/80 px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
              <Scan className="w-3 h-3 animate-spin" />
              Scanning FACS Units...
            </span>
          )}
        </div>

        {/* HUD Layer Controls */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setShowFACSZones(!showFACSZones)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              showFACSZones ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle FACS Action Unit Hotspot Circles"
          >
            FACS Markers
          </button>
          <button
            onClick={() => setShowTensionHeatmap(!showTensionHeatmap)}
            className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              showTensionHeatmap ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'text-slate-500 hover:text-slate-300'
            }`}
            title="Toggle Facial Musculature Tension Heatmap"
          >
            Tension Map
          </button>
        </div>
      </div>

      {/* Main Vision Stage & Canvas Overlay */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Real Live Video Feed */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className={`absolute inset-0 w-full h-full object-cover transform -scale-x-100 ${
            cameraActive ? 'block' : 'hidden'
          }`}
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth || 640;
              canvasRef.current.height = videoRef.current.videoHeight || 480;
            }
          }}
        />

        {/* Simulated Preset or Uploaded Image */}
        {(!cameraActive && (activePreset || uploadedImageSrc)) && (
          <img
            id="static-vision-source"
            src={activePreset ? activePreset.svgDataUri : (uploadedImageSrc || '')}
            alt="Clinical Assessment Source"
            className="absolute inset-0 w-full h-full object-contain bg-slate-950"
            onLoad={() => {
              if (canvasRef.current) {
                canvasRef.current.width = 640;
                canvasRef.current.height = 480;
              }
            }}
          />
        )}

        {/* Live Computer Vision Canvas HUD Overlay */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
        />

        {/* Camera Permission Alert Banner (if error) */}
        {cameraError && !activePreset && !uploadedImageSrc && (
          <div className="absolute inset-x-4 top-4 z-20 bg-slate-900/95 border border-amber-500/40 p-3.5 rounded-xl shadow-2xl backdrop-blur-sm text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span>Webcam Inactive</span>
            </div>
            <p className="text-xs text-slate-300 max-w-md mx-auto mb-3">
              {cameraError}
            </p>
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={startCamera}
                className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                Retry Camera
              </button>
              <button
                onClick={() => selectPreset(CLINICAL_PRESETS[1])}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-cyan-400" />
                Load Sample Patient
              </button>
            </div>
          </div>
        )}

        {/* Top-Right Telemetry Badge */}
        <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 px-2.5 py-1 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-2">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>Light: {telemetry ? `${telemetry.lightingScore}%` : '75%'}</span>
            <span className="text-slate-600">|</span>
            <span className="text-emerald-400">FPS: 30</span>
          </div>
        </div>

        {/* Bottom Alignment Guidance Hint */}
        <div className="absolute bottom-3 inset-x-0 z-20 flex justify-center pointer-events-none">
          <div className="bg-slate-950/75 backdrop-blur-md border border-slate-800/70 text-[11px] text-slate-300 px-3 py-1 rounded-full shadow-lg">
            Position patient face inside the biometric reticle for optimal FACS extraction
          </div>
        </div>
      </div>

      {/* Camera & Diagnostic Action Toolbar */}
      <div className="p-3.5 bg-slate-950 border-t border-slate-800/90 flex flex-col gap-3">
        {/* Primary Row: Primary Scan & Auto-Scan Interval */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            {/* Main Trigger Button */}
            <button
              id="btn-assess-pain-now"
              onClick={handleManualAssessment}
              disabled={isAssessing}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
                isAssessing
                  ? 'bg-cyan-700/60 text-cyan-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/25 active:scale-98'
              }`}
            >
              <Scan className={`w-4 h-4 ${isAssessing ? 'animate-spin' : ''}`} />
              <span>{isAssessing ? 'Evaluating Expression...' : 'Assess Pain Now'}</span>
            </button>

            {/* Set Baseline Button */}
            <button
              id="btn-calibrate-baseline"
              onClick={handleSetBaseline}
              disabled={isAssessing}
              className={`px-3 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors cursor-pointer ${
                hasBaseline
                  ? 'bg-slate-900 border-emerald-700/60 text-emerald-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title="Record current resting expression as calibrated zero-pain baseline"
            >
              <CheckCircle2 className={`w-3.5 h-3.5 ${hasBaseline ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>{hasBaseline ? 'Update Baseline' : 'Calibrate Baseline'}</span>
            </button>
          </div>

          {/* Continuous Auto-Monitoring Selector */}
          <div id="auto-scan-selector" className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400 font-medium">Auto-Scan:</span>
            <div className="flex items-center gap-1">
              {[
                { label: 'Off', val: 0 },
                { label: '4s', val: 4000 },
                { label: '8s', val: 8000 },
              ].map((item) => (
                <button
                  key={item.label}
                  id={`btn-autoscan-${item.label.toLowerCase()}`}
                  onClick={() => setAutoScanInterval(item.val)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors cursor-pointer ${
                    autoScanInterval === item.val
                      ? 'bg-cyan-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Secondary Row: Input Sources (Webcam, Clinical Presets, File Upload) */}
        <div className="pt-2 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Camera On/Off Toggle */}
          <div className="flex items-center gap-2">
            {cameraActive ? (
              <button
                onClick={stopCamera}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <CameraOff className="w-3.5 h-3.5 text-rose-400" />
                <span>Pause Camera</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5 text-emerald-400" />
                <span>Activate Camera</span>
              </button>
            )}

            {/* Custom File Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 flex items-center gap-1.5 cursor-pointer"
              title="Upload patient photo or clinical frame"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Upload Photo</span>
            </button>
          </div>

          {/* Quick Presets Picker */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Test Presets:</span>
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-xs">
              {CLINICAL_PRESETS.map((preset) => {
                const isSelected = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => selectPreset(preset)}
                    className={`px-2 py-0.5 rounded text-[11px] whitespace-nowrap font-medium transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-900 text-cyan-200 border border-cyan-700'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                    title={preset.subtitle}
                  >
                    {preset.name.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
