import React from 'react';
import { X, Sparkles, Check, ArrowRight } from 'lucide-react';

interface AnnouncementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStartedClick: () => void;
}

export const AnnouncementModal: React.FC<AnnouncementModalProps> = ({ isOpen, onClose, onGetStartedClick }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-2xl text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <span className="p-2 rounded-xl bg-[#FF5C28]/10 text-[#FF5C28] border border-[#FF5C28]/20">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <span className="text-xs font-bold text-[#FF5C28] uppercase tracking-wider">placementOS v2.0 Released</span>
            <h3 className="text-xl font-bold text-slate-900">What's New in Version 2.0</h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          We've completely overhauled our placement engine with AI real-time voice interview simulation and instant ATS resume optimization.
        </p>

        <div className="space-y-3 mb-8">
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Voice AI Technical & HR Interviews</p>
              <p className="text-[13px] text-slate-500">Simulate real technical rounds with instant voice feedback and scoring.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-600 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">Google XYZ Resume Rewriter</p>
              <p className="text-[13px] text-slate-500">Auto-convert your project experience into metric-driven bullet points.</p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-start gap-3">
            <div className="p-1 rounded-full bg-emerald-500/10 text-emerald-400 mt-0.5">
              <Check className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">MAANG & Top Startup Roadmaps</p>
              <p className="text-[13px] text-neutral-400">Handpicked DSA patterns, system design guides, and behavioral answers.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              onClose();
              onGetStartedClick();
            }}
            className="flex-1 bg-[#FF5C28] hover:bg-[#f04e1b] text-white font-medium text-sm py-3 rounded-full transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Try placementOS v2.0 Now</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
