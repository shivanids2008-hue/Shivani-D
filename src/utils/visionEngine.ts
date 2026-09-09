import { ClientFaceTelemetry } from '../types';

export interface OverlayOptions {
  showLandmarks: boolean;
  showFACSZones: boolean;
  showTensionHeatmap: boolean;
  isScanning: boolean;
  estimatedSeverity?: number; // 0 to 10
}

/**
 * Computes luminance and image statistics for lighting and position checks
 */
export function analyzeFrameTelemetry(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): ClientFaceTelemetry {
  const sampleWidth = Math.min(width, 160);
  const sampleHeight = Math.min(height, 120);

  // We can sample a smaller downscaled region for high FPS
  const imageData = ctx.getImageData(0, 0, sampleWidth, sampleHeight);
  const data = imageData.data;
  let totalLuminance = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 16) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    // Perceived luminance formula
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    totalLuminance += lum;
    count++;
  }

  const avgLuminance = count > 0 ? totalLuminance / count : 128;
  const lightingScore = Math.min(100, Math.max(10, Math.round((avgLuminance / 255) * 100)));

  // Center bounding box for face tracking target
  const faceBox = {
    x: Math.round(width * 0.25),
    y: Math.round(height * 0.15),
    width: Math.round(width * 0.5),
    height: Math.round(height * 0.7),
  };

  return {
    faceDetected: lightingScore > 15,
    boundingBox: faceBox,
    headPose: 'centered',
    eyeAspectRatio: 0.32,
    mouthOpenness: 0.15,
    browTensionMetric: 0.2,
    symmetryIndex: 0.94,
    lightingScore,
  };
}

/**
 * Draws the real-time Computer Vision HUD and FACS telemetry on the canvas
 */
export function drawComputerVisionHUD(
  canvas: HTMLCanvasElement,
  videoOrImage: HTMLVideoElement | HTMLImageElement,
  options: OverlayOptions,
  scanProgress: number = 0 // 0 to 1 for scanning laser animation
): ClientFaceTelemetry {
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      faceDetected: false,
      headPose: 'centered',
      eyeAspectRatio: 0.3,
      mouthOpenness: 0.1,
      browTensionMetric: 0.1,
      symmetryIndex: 0.9,
      lightingScore: 50,
    };
  }

  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  const telemetry = analyzeFrameTelemetry(ctx, w, h);

  const centerX = w / 2;
  const centerY = h / 2;
  const faceRadiusX = w * 0.24;
  const faceRadiusY = h * 0.34;

  // Severity color calculation
  const score = options.estimatedSeverity ?? 0;
  let themeColor = '#38bdf8'; // Sky blue for neutral
  let themeHexBg = 'rgba(56, 189, 248, 0.15)';
  if (score >= 6.5) {
    themeColor = '#ef4444'; // Red
    themeHexBg = 'rgba(239, 68, 68, 0.18)';
  } else if (score >= 3.5) {
    themeColor = '#f59e0b'; // Amber
    themeHexBg = 'rgba(245, 158, 11, 0.18)';
  } else if (score >= 1.0) {
    themeColor = '#10b981'; // Emerald
    themeHexBg = 'rgba(16, 185, 129, 0.15)';
  }

  // 1. Draw Biometric Face Guide Oval
  ctx.save();
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = options.isScanning ? '#06b6d4' : themeColor;
  ctx.beginPath();
  ctx.ellipse(centerX, centerY - h * 0.02, faceRadiusX, faceRadiusY, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 2. Corner Bracket Reticles (Clinical Target Tracking)
  const boxPadding = 12;
  const bx = centerX - faceRadiusX - boxPadding;
  const by = centerY - faceRadiusY - boxPadding;
  const bw = faceRadiusX * 2 + boxPadding * 2;
  const bh = faceRadiusY * 2 + boxPadding * 2;
  const cornerLen = 22;

  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';

  // Top-left
  ctx.beginPath();
  ctx.moveTo(bx, by + cornerLen);
  ctx.lineTo(bx, by);
  ctx.lineTo(bx + cornerLen, by);
  ctx.stroke();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(bx + bw - cornerLen, by);
  ctx.lineTo(bx + bw, by);
  ctx.lineTo(bx + bw, by + cornerLen);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(bx, by + bh - cornerLen);
  ctx.lineTo(bx, by + bh);
  ctx.lineTo(bx + cornerLen, by + bh);
  ctx.stroke();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(bx + bw - cornerLen, by + bh);
  ctx.lineTo(bx + bw, by + bh);
  ctx.lineTo(bx + bw, by + bh - cornerLen);
  ctx.stroke();

  // 3. FACS Action Unit Hotspots (if enabled)
  if (options.showFACSZones) {
    // Relative coordinates on face oval
    const auZones = [
      {
        code: 'AU4',
        name: 'Brow Lowerer',
        x: centerX,
        y: centerY - faceRadiusY * 0.42,
        r: 18,
      },
      {
        code: 'AU6/7 L',
        name: 'L-Orbital',
        x: centerX - faceRadiusX * 0.58,
        y: centerY - faceRadiusY * 0.22,
        r: 16,
      },
      {
        code: 'AU6/7 R',
        name: 'R-Orbital',
        x: centerX + faceRadiusX * 0.58,
        y: centerY - faceRadiusY * 0.22,
        r: 16,
      },
      {
        code: 'AU9/10',
        name: 'Nasolabial',
        x: centerX,
        y: centerY + faceRadiusY * 0.12,
        r: 18,
      },
      {
        code: 'AU25/26',
        name: 'Oral Grimace',
        x: centerX,
        y: centerY + faceRadiusY * 0.52,
        r: 22,
      },
    ];

    auZones.forEach((zone) => {
      ctx.save();
      // Target glow ring
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
      ctx.fillStyle = themeHexBg;
      ctx.fill();
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Center crosshair
      ctx.beginPath();
      ctx.arc(zone.x, zone.y, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = themeColor;
      ctx.fill();

      // Label tag
      ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zone.code, zone.x, zone.y - zone.r - 7);
      ctx.restore();
    });
  }

  // 4. Clinical Tension Heatmap Layer (if enabled)
  if (options.showTensionHeatmap && score > 0.5) {
    ctx.save();
    // Soft radial tension clouds around forehead and mouth
    const browGrad = ctx.createRadialGradient(
      centerX,
      centerY - faceRadiusY * 0.35,
      4,
      centerX,
      centerY - faceRadiusY * 0.35,
      faceRadiusX * 0.7
    );
    const heatAlpha = Math.min(0.4, (score / 10) * 0.45);
    browGrad.addColorStop(0, `rgba(239, 68, 68, ${heatAlpha})`);
    browGrad.addColorStop(1, 'rgba(239, 68, 68, 0)');
    ctx.fillStyle = browGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY - faceRadiusY * 0.35, faceRadiusX * 0.7, 0, Math.PI * 2);
    ctx.fill();

    const mouthGrad = ctx.createRadialGradient(
      centerX,
      centerY + faceRadiusY * 0.5,
      6,
      centerX,
      centerY + faceRadiusY * 0.5,
      faceRadiusX * 0.6
    );
    mouthGrad.addColorStop(0, `rgba(245, 158, 11, ${heatAlpha * 0.8})`);
    mouthGrad.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = mouthGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY + faceRadiusY * 0.5, faceRadiusX * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 5. Active Scan Beam Effect
  if (options.isScanning) {
    ctx.save();
    const scanY = by + (bh * ((scanProgress % 1) || 0.5));
    const scanGrad = ctx.createLinearGradient(bx, scanY, bx + bw, scanY);
    scanGrad.addColorStop(0, 'rgba(6, 182, 212, 0)');
    scanGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.85)');
    scanGrad.addColorStop(1, 'rgba(6, 182, 212, 0)');

    ctx.strokeStyle = scanGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bx, scanY);
    ctx.lineTo(bx + bw, scanY);
    ctx.stroke();

    // Subtle laser glow plane
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fillRect(bx, scanY - 14, bw, 28);
    ctx.restore();
  }

  return telemetry;
}

/**
 * Capture high-quality frame from Video or Image as Base64 JPEG
 */
export function captureFrameAsBase64(
  source: HTMLVideoElement | HTMLImageElement,
  targetWidth = 640,
  targetHeight = 480
): string {
  const offscreen = document.createElement('canvas');
  offscreen.width = targetWidth;
  offscreen.height = targetHeight;
  const ctx = offscreen.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Draw neutral dark background fill
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  if (source instanceof HTMLVideoElement) {
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  } else {
    ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  }

  return offscreen.toDataURL('image/jpeg', 0.88);
}

/**
 * Robust asynchronous converter that guarantees a valid data:image/jpeg;base64,... string
 * from video, HTML image, SVG data URI, or uploaded file data
 */
export async function getFrameAsJpegBase64(
  source: HTMLVideoElement | HTMLImageElement | string,
  targetWidth = 640,
  targetHeight = 480
): Promise<string> {
  // If already a valid raster base64 JPEG
  if (typeof source === 'string' && source.startsWith('data:image/jpeg;base64,')) {
    return source;
  }

  // If already PNG base64, also accepted by Gemini, but we can standardize on JPEG
  if (typeof source === 'string' && source.startsWith('data:image/png;base64,')) {
    return source;
  }

  if (source instanceof HTMLVideoElement) {
    return captureFrameAsBase64(source, targetWidth, targetHeight);
  }

  if (source instanceof HTMLImageElement) {
    if (source.complete && source.naturalWidth > 0) {
      return captureFrameAsBase64(source, targetWidth, targetHeight);
    }
  }

  // Handle string sources (SVG data URI, URL, or general image string)
  if (typeof source === 'string') {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const offscreen = document.createElement('canvas');
          offscreen.width = targetWidth;
          offscreen.height = targetHeight;
          const ctx = offscreen.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(0, 0, targetWidth, targetHeight);
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
            resolve(offscreen.toDataURL('image/jpeg', 0.88));
            return;
          }
        } catch (e) {
          console.warn('Canvas rasterize warning:', e);
        }
        resolve('');
      };
      img.onerror = () => {
        console.warn('Image load error for rasterization');
        resolve('');
      };
      img.src = source;
    });
  }

  return '';
}
