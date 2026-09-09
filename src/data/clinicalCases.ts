export interface ClinicalCasePreset {
  id: string;
  name: string;
  subtitle: string;
  category: 'Adult' | 'Pediatric' | 'Geriatric' | 'Non-Verbal / ICU';
  expectedPainRange: string;
  description: string;
  svgDataUri: string;
}

// Generate stylized SVG data URIs with distinct facial muscle contractions for FACS testing
function createFaceSvg(options: {
  browFurrow: number; // 0 to 5
  eyeSquint: number; // 0 to 5
  noseWrinkle: number; // 0 to 5
  mouthGrimace: number; // 0 to 5
  skinTone: string;
  hairStyle?: string;
  title: string;
}): string {
  const { browFurrow, eyeSquint, noseWrinkle, mouthGrimace, skinTone, title } = options;

  // Eyebrow paths based on furrow level
  // Normal: (110, 155) -> (170, 150)
  // Furrowed: inner ends drop sharply towards nose bridge (170, 170)
  const leftBrowInnerY = 150 + browFurrow * 4;
  const leftBrowOuterY = 155 - browFurrow * 1.5;
  const rightBrowInnerY = 150 + browFurrow * 4;
  const rightBrowOuterY = 155 - browFurrow * 1.5;

  // Eye openings: 14px down to 3px for high squint
  const eyeRy = Math.max(2.5, 14 - eyeSquint * 2.2);

  // Mouth path
  // Neutral: d="M 140 280 Q 200 285 260 280"
  // Grimace: stretched sideways, lips pulled back, teeth visible
  const mouthWidth = 110 + mouthGrimace * 8;
  const mouthY = 278 + mouthGrimace * 2;
  const mouthOpening = mouthGrimace > 1 ? mouthGrimace * 3.5 : 2;

  // Glabella vertical frown creases between eyebrows
  const frownCreases =
    browFurrow > 1.5
      ? `<line x1="195" y1="${leftBrowInnerY - 18}" x2="195" y2="${leftBrowInnerY + 6}" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" opacity="${0.2 + browFurrow * 0.15}"/>
         <line x1="205" y1="${rightBrowInnerY - 18}" x2="205" y2="${rightBrowInnerY + 6}" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" opacity="${0.2 + browFurrow * 0.15}"/>`
      : '';

  // Crow's feet wrinkles (AU6/7)
  const crowsFeet =
    eyeSquint > 1.5
      ? `<path d="M 90 185 L 75 180 M 90 190 L 70 192 M 90 195 L 75 202" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" opacity="${eyeSquint * 0.18}"/>
         <path d="M 310 185 L 325 180 M 310 190 L 330 192 M 310 195 L 325 202" stroke="#78350f" stroke-width="1.8" stroke-linecap="round" opacity="${eyeSquint * 0.18}"/>`
      : '';

  // Nasolabial fold creases (AU9/10)
  const nasolabial =
    noseWrinkle > 1
      ? `<path d="M 165 240 Q 150 265 145 295" stroke="#78350f" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="${noseWrinkle * 0.16}"/>
         <path d="M 235 240 Q 250 265 255 295" stroke="#78350f" stroke-width="2.2" stroke-linecap="round" fill="none" opacity="${noseWrinkle * 0.16}"/>`
      : '';

  // Nose root wrinkles (AU9)
  const noseRootWrinkles =
    noseWrinkle > 2
      ? `<line x1="192" y1="218" x2="208" y2="218" stroke="#78350f" stroke-width="2" stroke-linecap="round" opacity="${noseWrinkle * 0.18}"/>
         <line x1="194" y1="224" x2="206" y2="224" stroke="#78350f" stroke-width="2" stroke-linecap="round" opacity="${noseWrinkle * 0.18}"/>`
      : '';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 440" width="400" height="440">
    <rect width="100%" height="100%" fill="#0f172a"/>
    <!-- Head Base -->
    <ellipse cx="200" cy="220" rx="120" ry="145" fill="${skinTone}"/>
    <!-- Hair outline -->
    <path d="M 85 190 C 80 100, 320 100, 315 190 C 290 120, 110 120, 85 190 Z" fill="#1e293b"/>
    <!-- Ears -->
    <ellipse cx="78" cy="220" rx="12" ry="24" fill="${skinTone}"/>
    <ellipse cx="322" cy="220" rx="12" ry="24" fill="${skinTone}"/>
    
    <!-- Forehead Wrinkles if intense brow lowering -->
    ${browFurrow >= 3 ? '<path d="M 140 125 Q 200 120 260 125" stroke="#78350f" stroke-width="2" fill="none" opacity="0.4"/>' : ''}
    ${browFurrow >= 4 ? '<path d="M 150 112 Q 200 108 250 112" stroke="#78350f" stroke-width="1.8" fill="none" opacity="0.35"/>' : ''}
    
    <!-- Eyebrows (AU4 Brow Furrow) -->
    <path d="M 115 ${leftBrowOuterY} Q 145 ${leftBrowOuterY - 8} 185 ${leftBrowInnerY}" stroke="#1e293b" stroke-width="7" stroke-linecap="round" fill="none"/>
    <path d="M 285 ${rightBrowOuterY} Q 255 ${rightBrowOuterY - 8} 215 ${rightBrowInnerY}" stroke="#1e293b" stroke-width="7" stroke-linecap="round" fill="none"/>
    ${frownCreases}

    <!-- Eyes (AU6 / AU7 / AU43 Orbital tightener) -->
    <ellipse cx="145" cy="190" rx="20" ry="${eyeRy}" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
    <ellipse cx="255" cy="190" rx="20" ry="${eyeRy}" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
    <!-- Iris & Pupil -->
    <circle cx="145" cy="190" r="${Math.min(8, eyeRy)}" fill="#3b82f6"/>
    <circle cx="145" cy="190" r="${Math.min(4, eyeRy * 0.6)}" fill="#0f172a"/>
    <circle cx="255" cy="190" r="${Math.min(8, eyeRy)}" fill="#3b82f6"/>
    <circle cx="255" cy="190" r="${Math.min(4, eyeRy * 0.6)}" fill="#0f172a"/>
    ${crowsFeet}

    <!-- Nose & Root Wrinkles (AU9 / AU10) -->
    <path d="M 200 190 L 194 245 L 208 245" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    ${noseRootWrinkles}
    ${nasolabial}

    <!-- Mouth / Grimace (AU25 / AU26 / AU27) -->
    ${
      mouthGrimace > 1
        ? `<ellipse cx="200" cy="${mouthY}" rx="${mouthWidth / 2}" ry="${mouthOpening}" fill="#450a0a" stroke="#7f1d1d" stroke-width="2"/>
           <!-- Teeth / Clench indicator -->
           <rect x="${200 - mouthWidth / 2.5}" y="${mouthY - mouthOpening / 2}" width="${(mouthWidth / 2.5) * 2}" height="${mouthOpening * 0.8}" fill="#f8fafc" rx="2"/>`
        : `<path d="M ${200 - mouthWidth / 2} ${mouthY} Q 200 ${mouthY + 4} ${200 + mouthWidth / 2} ${mouthY}" stroke="#78350f" stroke-width="4" stroke-linecap="round" fill="none"/>`
    }

    <!-- Clinical Annotation Overlay -->
    <rect x="15" y="15" width="370" height="32" rx="8" fill="#1e293b" opacity="0.85"/>
    <text x="25" y="36" fill="#38bdf8" font-family="sans-serif" font-size="13" font-weight="600">${title}</text>
    <text x="375" y="36" fill="#94a3b8" font-family="sans-serif" font-size="11" text-anchor="end">FACS / PSPI Model</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const CLINICAL_PRESETS: ClinicalCasePreset[] = [
  {
    id: 'case_neutral',
    name: 'Resting Baseline (Neutral)',
    subtitle: 'Calibrated reference with zero facial muscle contraction',
    category: 'Adult',
    expectedPainRange: '0.0 - 0.3 (No Pain)',
    description: 'Completely relaxed facial musculature. Glabella smooth, orbital sphincter relaxed, lips gently closed without tension.',
    svgDataUri: createFaceSvg({
      browFurrow: 0,
      eyeSquint: 0,
      noseWrinkle: 0,
      mouthGrimace: 0,
      skinTone: '#fde68a',
      title: 'Preset 1: Resting Baseline (No Pain)',
    }),
  },
  {
    id: 'case_mild',
    name: 'Mild Post-Operative Discomfort',
    subtitle: 'Early surgical recovery or slight ache',
    category: 'Adult',
    expectedPainRange: '1.5 - 2.8 (Mild Pain)',
    description: 'Subtle corrugator tension with slight brow lowering (AU4 trace), minimal orbital narrowing, mouth in neutral position.',
    svgDataUri: createFaceSvg({
      browFurrow: 1.5,
      eyeSquint: 1.2,
      noseWrinkle: 0.5,
      mouthGrimace: 0.8,
      skinTone: '#fed7aa',
      title: 'Preset 2: Mild Discomfort (Score ~2.2)',
    }),
  },
  {
    id: 'case_moderate',
    name: 'Moderate Physical Therapy Strain',
    subtitle: 'Active joint movement or orthopedic rehabilitation',
    category: 'Adult',
    expectedPainRange: '4.5 - 5.8 (Moderate Pain)',
    description: 'Noticeable brow contraction forming vertical glabella creases (AU4=3), clear orbital lid tightening (AU7=2), and deepened nasolabial folds.',
    svgDataUri: createFaceSvg({
      browFurrow: 3.2,
      eyeSquint: 2.8,
      noseWrinkle: 2.5,
      mouthGrimace: 2.2,
      skinTone: '#fecdd3',
      title: 'Preset 3: Moderate Strain (Score ~5.2)',
    }),
  },
  {
    id: 'case_severe',
    name: 'Severe Acute Flare-Up',
    subtitle: 'Marked clinical distress / acute visceral pain',
    category: 'Non-Verbal / ICU',
    expectedPainRange: '7.0 - 8.2 (Severe Pain)',
    description: 'High-intensity brow furrowing, deep eyelid squinting with prominent crow’s feet (AU6/7=4), nose root wrinkling, and horizontal lip retraction with exposed teeth.',
    svgDataUri: createFaceSvg({
      browFurrow: 4.5,
      eyeSquint: 4.2,
      noseWrinkle: 3.8,
      mouthGrimace: 3.9,
      skinTone: '#fda4af',
      title: 'Preset 4: Severe Pain Flare (Score ~7.8)',
    }),
  },
  {
    id: 'case_pediatric',
    name: 'Pediatric Distress / Grimace',
    subtitle: 'FLACC / Wong-Baker non-verbal facial cues',
    category: 'Pediatric',
    expectedPainRange: '6.0 - 7.5 (Significant Pain)',
    description: 'Tightly closed or squeezed eyes, marked forehead furrow, open mouth cry grimace with squarish oral aperture.',
    svgDataUri: createFaceSvg({
      browFurrow: 4.0,
      eyeSquint: 4.6,
      noseWrinkle: 3.5,
      mouthGrimace: 4.2,
      skinTone: '#fed7aa',
      title: 'Preset 5: Pediatric Grimace (Score ~7.1)',
    }),
  },
];
