export type SeverityLevel = 'None' | 'Mild' | 'Moderate' | 'Severe' | 'Very Severe';

export type ActionUnitCode = 'AU4' | 'AU6' | 'AU7' | 'AU9' | 'AU10' | 'AU25' | 'AU43';

export interface ActionUnitAssessment {
  code: ActionUnitCode | string;
  name: string;
  intensity: number; // 0 to 5
  detected: boolean;
  description: string;
}

export interface FacialRegionDetail {
  tension: 'Relaxed' | 'Slight' | 'Moderate' | 'Severe' | 'Extreme';
  score: number; // 0 - 10
  observations: string;
}

export interface PainAssessmentResult {
  id: string;
  timestamp: number;
  overallPainScore: number; // 0.0 to 10.0
  severityLevel: SeverityLevel;
  confidence: number; // 0 - 100%
  pspiFormulaScore: number; // 0 - 16
  actionUnits: ActionUnitAssessment[];
  facialRegions: {
    browAndForehead: FacialRegionDetail;
    orbitalAndEyes: FacialRegionDetail;
    noseAndCheeks: FacialRegionDetail;
    mouthAndJaw: FacialRegionDetail;
  };
  clinicalInterpretation: string;
  differentialFromBaseline?: string;
  riskFlag: 'normal' | 'attention' | 'critical';
  recommendedAction: string;
  imageQuality: {
    lighting: 'good' | 'low' | 'glare';
    faceAlignment: 'optimal' | 'partial' | 'angled';
    confidenceImpact?: string;
  };
  snapshotThumbnail?: string;
  patientContext?: {
    category: 'Adult' | 'Pediatric' | 'Geriatric' | 'Non-Verbal / ICU';
    mode: 'Continuous Monitoring' | 'Manual Exam' | 'Post-Procedure';
  };
}

export interface AssessmentTimelinePoint {
  timestamp: number;
  score: number;
  severity: SeverityLevel;
  id: string;
}

export interface ClientFaceTelemetry {
  faceDetected: boolean;
  boundingBox?: { x: number; y: number; width: number; height: number };
  headPose: 'centered' | 'turned_left' | 'turned_right' | 'tilted';
  eyeAspectRatio: number; // blink / squint detection
  mouthOpenness: number; // mouth opening tension
  browTensionMetric: number; // eyebrow contraction metric
  symmetryIndex: number; // 0 to 1
  lightingScore: number; // 0 to 100
}
