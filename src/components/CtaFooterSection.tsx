import React from 'react';
import { GraduationCap, Linkedin, Twitter, Github, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';

interface CtaFooterSectionProps {
  onStartFreeClick: () => void;
}

export const CtaFooterSection: React.FC<CtaFooterSectionProps> = ({ onStartFreeClick }) => {
  return (
    <section className="w-full bg-[#FAFAF8] text-[#14131F] pt-12 pb-16 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* Modern SaaS CTA Banner Box */}
        <div className="w-full rounded-2xl bg-[#14131F] text-white p-8 sm:p-12 md:p-16 text-left sm:text-center flex flex-col items-start sm:items-center justify-center mb-16 relative overflow-hidden">
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-medium text-white mb-6">
            <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
            <span>Join 54,000+ ambitious students</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-white mb-4 max-w-2xl leading-tight">
            Ready to secure your campus placement offer?
          </h2>
          
          <p className="font-sans text-white/70 text-sm sm:text-base max-w-lg mx-auto font-normal mb-8 leading-relaxed">
            Diagnose your algorithmic skills, practice realistic AI technical interviews, and apply to top internships and full-time hiring drives today.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={onStartFreeClick}
              className="bg-[#4338CA] hover:bg-[#3730A3] text-white font-medium text-sm sm:text-base px-8 py-3 rounded-xl"
            >
              Start preparation free
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
              Immediate access to practice arena
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#A3E635]" />
              Works on mobile and desktop
            </span>
          </div>

        </div>

        {/* Multi-Column Footer */}
        <footer className="w-full grid grid-cols-1 md:grid-cols-12 gap-10 pt-8 text-left border-t border-[#14131F]/8">
          
          {/* Brand Info */}
          <div className="md:col-span-5 flex flex-col items-start gap-4 pr-0 md:pr-8">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#4338CA] flex items-center justify-center text-white">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-display font-bold tracking-tight text-[#14131F]">
                placementOS
              </span>
            </a>

            <p className="text-xs sm:text-sm font-sans text-[#14131F]/65 font-normal leading-relaxed max-w-sm">
              Comprehensive campus placement acceleration platform empowering engineering students with diagnostic testing, voice AI interviews, and verified hiring opportunities.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-2 mt-1">
              <a
                href="#linkedin"
                className="w-8 h-8 rounded-lg border border-[#14131F]/10 flex items-center justify-center text-[#14131F]/60 hover:text-[#14131F] hover:border-[#14131F]/30 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
              <a
                href="#twitter"
                className="w-8 h-8 rounded-lg border border-[#14131F]/10 flex items-center justify-center text-[#14131F]/60 hover:text-[#14131F] hover:border-[#14131F]/30 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="#github"
                className="w-8 h-8 rounded-lg border border-[#14131F]/10 flex items-center justify-center text-[#14131F]/60 hover:text-[#14131F] hover:border-[#14131F]/30 transition-colors"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-semibold text-[#14131F] font-display uppercase tracking-wider">
              Platform
            </span>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#14131F]/70">
              <a href="#features" className="hover:text-[#4338CA] transition-colors">Opportunities Board</a>
              <a href="#features" className="hover:text-[#4338CA] transition-colors">AI Mock Interviews</a>
              <a href="#features" className="hover:text-[#4338CA] transition-colors">Aptitude Arena</a>
              <a href="#features" className="hover:text-[#4338CA] transition-colors">ATS Resume Scanner</a>
            </div>
          </div>

          {/* Resources */}
          <div className="md:col-span-2 flex flex-col gap-3">
            <span className="text-xs font-semibold text-[#14131F] font-display uppercase tracking-wider">
              Preparation
            </span>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#14131F]/70">
              <a href="#process" className="hover:text-[#4338CA] transition-colors">Interview Stories</a>
              <a href="#process" className="hover:text-[#4338CA] transition-colors">DSA Problem Radar</a>
              <a href="#process" className="hover:text-[#4338CA] transition-colors">System Design Rubric</a>
              <a href="#pricing" className="hover:text-[#4338CA] transition-colors">Placement Roadmap</a>
            </div>
          </div>

          {/* Legal / Institutional */}
          <div className="md:col-span-3 flex flex-col gap-3">
            <span className="text-xs font-semibold text-[#14131F] font-display uppercase tracking-wider">
              Students & Campuses
            </span>
            <div className="flex flex-col gap-2 text-xs sm:text-sm text-[#14131F]/70">
              <span className="text-xs text-[#14131F]/60 leading-relaxed">
                Partnered with 180+ engineering institutions and autonomous universities across India.
              </span>
              <div className="pt-2 text-[11px] text-[#14131F]/45">
                © {new Date().getFullYear()} placementOS. All rights reserved.
              </div>
            </div>
          </div>

        </footer>

      </div>
    </section>
  );
};
