import React from 'react';
import { FacialRegionDetail } from '../types';
import { Layers, CheckCircle, AlertCircle } from 'lucide-react';

interface FacialRegionsGridProps {
  regions?: {
    browAndForehead: FacialRegionDetail;
    orbitalAndEyes: FacialRegionDetail;
    noseAndCheeks: FacialRegionDetail;
    mouthAndJaw: FacialRegionDetail;
  };
}

export const FacialRegionsGrid: React.FC<FacialRegionsGridProps> = ({ regions }) => {
  if (!regions) return null;

  const quadrantList = [
    {
      title: 'Forehead & Glabella',
      subtitle: 'AU4 Corrugator / Brow Furrow',
      data: regions.browAndForehead,
    },
    {
      title: 'Periorbital & Eyes',
      subtitle: 'AU6/7 Orbicularis / Squeeze',
      data: regions.orbitalAndEyes,
    },
    {
      title: 'Midface & Nasolabial',
      subtitle: 'AU9/10 Levator / Nose Wrinkle',
      data: regions.noseAndCheeks,
    },
    {
      title: 'Perioral & Jaw',
      subtitle: 'AU25/26 Masseter / Grimace',
      data: regions.mouthAndJaw,
    },
  ];

  const getTensionBadge = (tension: string) => {
    switch (tension?.toLowerCase()) {
      case 'extreme':
      case 'severe':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'moderate':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'slight':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Anatomical Facial Quadrants
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Regional tension distribution and localized micro-expressions
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quadrantList.map((q) => (
          <div
            key={q.title}
            className="bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-bold text-slate-200">{q.title}</span>
                <span
                  className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded border ${getTensionBadge(
                    q.data?.tension || 'Relaxed'
                  )}`}
                >
                  {q.data?.tension || 'Relaxed'}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mb-2">{q.subtitle}</p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {q.data?.observations || 'Musculature appears at ease.'}
              </p>
            </div>

            <div className="mt-3 pt-2.5 border-t border-slate-900 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Tension Index:</span>
              <span className="font-mono font-bold text-cyan-400">
                {q.data?.score ?? 0} / 10
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
