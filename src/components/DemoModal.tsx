import React, { useState } from 'react';
import { X, Play, Pause, RotateCcw, Sparkles, CheckCircle2, TrendingUp, Users, Zap, Bot } from 'lucide-react';

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStartedClick: () => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({ isOpen, onClose, onGetStartedClick }) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'pipeline' | 'insights' | 'automation'>('pipeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#FF5C28]" />
            <span className="font-semibold text-sm text-slate-800">placementOS Platform Walkthrough</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video / Interactive Canvas Simulator */}
        <div className="p-6 overflow-y-auto space-y-6">
          <div className="relative aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between p-6 text-white">
            
            {/* Top Bar inside Demo Canvas */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-800 text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#FF5C28]" /> Live Simulation
                </span>
                <span className="text-xs text-slate-400">AI Interview Engine</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveTab('pipeline')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${activeTab === 'pipeline' ? 'bg-[#FF5C28] text-white font-medium' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  Mock Round
                </button>
                <button 
                  onClick={() => setActiveTab('insights')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${activeTab === 'insights' ? 'bg-[#FF5C28] text-white font-medium' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  Feedback
                </button>
                <button 
                  onClick={() => setActiveTab('automation')}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${activeTab === 'automation' ? 'bg-[#FF5C28] text-white font-medium' : 'bg-slate-800 text-slate-300 hover:text-white'}`}
                >
                  ATS Score
                </button>
              </div>
            </div>

            {/* Dynamic Content depending on Tab */}
            <div className="my-auto py-4">
              {activeTab === 'pipeline' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80">
                    <p className="text-xs text-neutral-500 mb-1">DSA Readiness Score</p>
                    <p className="text-2xl font-semibold text-white">92 / 100</p>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" /> Top 5% of candidates
                    </p>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80">
                    <p className="text-xs text-neutral-500 mb-1">Mock Rounds Completed</p>
                    <p className="text-2xl font-semibold text-white">18 Rounds</p>
                    <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Real-time AI voice response
                    </p>
                  </div>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80">
                    <p className="text-xs text-neutral-500 mb-1">Target Companies</p>
                    <p className="text-2xl font-semibold text-white">Google & Amazon</p>
                    <p className="text-xs text-neutral-400 mt-1">96% Offer probability</p>
                  </div>
                </div>
              )}

              {activeTab === 'insights' && (
                <div className="bg-neutral-950 p-5 rounded-2xl border border-neutral-800 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-[#FF5C28] font-medium">
                    <Bot className="w-4 h-4" /> placementOS AI Interviewer Assessment
                  </div>
                  <p className="text-sm text-neutral-200">
                    "Great explanation on System Design for distributed caching! To reach Google L4 bar, emphasize cache invalidation strategies (write-through vs write-behind) in your next response."
                  </p>
                  <div className="flex gap-2 pt-1">
                    <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300">Topic: Distributed Caching</span>
                    <span className="text-xs px-2.5 py-1 rounded-md bg-neutral-800 text-neutral-300">Clarity: 95%</span>
                  </div>
                </div>
              )}

              {activeTab === 'automation' && (
                <div className="space-y-2">
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-neutral-200 font-medium">Resume parsed: ATS compatibility score increased from 68% to 94%</span>
                    </div>
                    <span className="text-neutral-500">Just now</span>
                  </div>
                  <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="text-neutral-200 font-medium">Generated 15 high-impact bullet points using Google XYZ formula</span>
                    </div>
                    <span className="text-neutral-500">5 mins ago</span>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-white cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
                </button>
                <button 
                  onClick={() => setIsPlaying(true)}
                  className="text-neutral-400 hover:text-white p-1 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <span className="text-xs text-neutral-400">01:42 / 02:30</span>
              </div>
              <span className="text-xs text-neutral-400 hidden sm:inline">Press Space to toggle play</span>
            </div>

          </div>

          {/* Key Value Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <h4 className="text-sm font-medium text-white mb-1">Company-Specific Question Bank</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">Practice real questions asked at top tech companies in past 6 months.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <h4 className="text-sm font-medium text-white mb-1">3.2x Higher Selection Rate</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">AI voice feedback highlights filler words, coding speed, and communication gaps.</p>
            </div>
            <div className="p-4 rounded-2xl bg-neutral-900/50 border border-neutral-800">
              <h4 className="text-sm font-medium text-white mb-1">Zero-Stress Roadmaps</h4>
              <p className="text-xs text-neutral-400 leading-relaxed">Structured daily plans for DSA, System Design, and Behavioral rounds.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-800 bg-neutral-900/40">
          <p className="text-xs text-neutral-400">Ready to crack your dream placement?</p>
          <button
            onClick={() => {
              onClose();
              onGetStartedClick();
            }}
            className="bg-[#FF5C28] hover:bg-[#f04e1b] text-white font-medium text-sm px-5 py-2.5 rounded-full transition-all cursor-pointer"
          >
            Start Free Practice
          </button>
        </div>

      </div>
    </div>
  );
};
