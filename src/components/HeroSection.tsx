import React from 'react';
import { Play, CheckCircle2, Award, Zap, Code2, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface HeroSectionProps {
  onWatchDemoClick: () => void;
  onGetStartedClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onWatchDemoClick,
  onGetStartedClick,
}) => {
  return (
    <section className="relative w-full bg-[#FAFAF8] text-[#14131F] px-6 lg:px-12 pt-12 pb-16 md:pt-16 md:pb-24 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* Left-Aligned Copy Column */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          
          {/* Subtle Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#14131F]/10 text-xs font-medium text-[#14131F] mb-6">
            <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
            <span>Built specifically for engineering and college graduates</span>
          </div>

          {/* Headline in Space Grotesk */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-[#14131F] leading-[1.08] mb-6">
            Master your skills. <br />
            Ace your interviews. <br />
            <span className="text-[#4338CA]">Land your dream offer.</span>
          </h1>

          {/* Subhead in Inter */}
          <p className="font-sans text-[#14131F]/70 text-base sm:text-lg lg:text-xl leading-relaxed max-w-xl mb-8 font-normal">
            A comprehensive career acceleration platform for college students. Map skill gaps with diagnostic benchmarks, practice with voice-enabled AI technical interviewers, and apply directly to active campus hiring drives.
          </p>

          {/* Key Value Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl mb-8 text-xs sm:text-sm text-[#14131F]/80">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0" />
              <span>Real DSA & System Design</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0" />
              <span>Voice AI Mock Interviews</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#4338CA] shrink-0" />
              <span>Active Job Board</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStartedClick}
              className="px-6 py-3 text-sm sm:text-base font-medium"
            >
              Start preparation free
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={onWatchDemoClick}
              icon={<Play className="w-3.5 h-3.5 fill-current" />}
              className="px-5 py-3 text-sm sm:text-base font-medium"
            >
              Watch 2-min demo
            </Button>
          </div>

          {/* Recent placement metric ticker */}
          <div className="mt-8 pt-6 border-t border-[#14131F]/8 flex items-center gap-3 text-xs text-[#14131F]/65">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A3E635] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A3E635]"></span>
            </span>
            <span>
              <strong className="text-[#14131F] font-semibold">14,200+ students</strong> evaluated this semester across 180+ partner campuses
            </span>
          </div>
        </div>

        {/* Right Photo Column (Real Photography of Student, no gradient block) */}
        <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
          <div className="relative w-full max-w-md lg:max-w-none">
            
            {/* Primary Stock Photograph */}
            <div className="relative rounded-2xl overflow-hidden border border-[#14131F]/10 shadow-sm bg-white aspect-[4/5] sm:aspect-[3/3.8]">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop"
                alt="Students collaborating on tech projects and placement preparation"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#14131F]/40 via-transparent to-transparent pointer-events-none" />
              
              {/* Photo Caption Overlay */}
              <div className="absolute bottom-4 left-4 right-4 text-white text-xs">
                <span className="font-semibold block text-sm">Autonomous Coding & Interview Prep</span>
                <span className="text-white/80">Collaborative campus hackathons & live mock rounds</span>
              </div>
            </div>

            {/* Floating Live Metric Card - Top Left */}
            <div className="absolute -top-4 -left-4 sm:-left-6 bg-white border border-[#14131F]/10 rounded-xl p-3.5 shadow-sm text-left max-w-[210px] hidden sm:block animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-6 h-6 rounded-md bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center">
                  <Award className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-[#14131F] font-display">Readiness Score</span>
              </div>
              <div className="text-2xl font-bold font-display text-[#14131F]">94.8%</div>
              <p className="text-[11px] text-[#14131F]/60 mt-0.5">Top 5% percentile in SDE-1 Algorithms track</p>
            </div>

            {/* Floating Live Metric Card - Bottom Right */}
            <div className="absolute -bottom-4 -right-2 sm:-right-4 bg-white border border-[#14131F]/10 rounded-xl p-3.5 shadow-sm text-left max-w-[220px] hidden sm:block">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-medium text-[#14131F]/60">Live Mock Round</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-[#A3E635]/30 text-[#14131F] px-1.5 py-0.5 rounded">
                  Passed
                </span>
              </div>
              <div className="text-xs font-semibold text-[#14131F]">System Design: Rate Limiter</div>
              <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#4338CA] font-medium">
                <Sparkles className="w-3 h-3" />
                <span>AI Interviewer Feedback Logged</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
