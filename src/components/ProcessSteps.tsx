import React from 'react';
import { UserCheck, Target, Send, Trophy } from 'lucide-react';

interface Step {
  number: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
  tag: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Create your student account',
    description: 'Enter your university, branch, graduation year, and target role to initialize your placement profile.',
    icon: UserCheck,
    tag: 'Quick 1-min setup',
  },
  {
    number: '02',
    title: 'Assess skills & map gaps',
    description: 'Take the baseline aptitude diagnostic and submit your resume for automated ATS benchmark scoring.',
    icon: Target,
    tag: 'Skill Radar & ATS',
  },
  {
    number: '03',
    title: 'Apply to verified openings',
    description: 'Browse active internships and full-time drives curated for your batch. Apply directly with 1-click tracking.',
    icon: Send,
    tag: 'Campus Drives Board',
  },
  {
    number: '04',
    title: 'Track rounds & ace interviews',
    description: 'Simulate technical rounds with AI voice roleplay, read real company experiences, and secure your offer.',
    icon: Trophy,
    tag: 'Offer Secured',
  },
];

export const ProcessSteps: React.FC = () => {
  return (
    <section id="process" className="w-full bg-[#FAFAF8] text-[#14131F] py-20 px-6 lg:px-12 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#14131F]/10 text-xs font-medium text-[#14131F] mb-4">
            <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
            <span>Proven 4-stage placement path</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#14131F] leading-tight mb-4">
            From Day 1 preparation to your final offer letter
          </h2>
          <p className="font-sans text-[#14131F]/70 text-base sm:text-lg leading-relaxed">
            Follow a clear, sequential path designed to maximize your hiring readiness with zero guesswork.
          </p>
        </div>

        {/* 4 Sequential Steps Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          {STEPS.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.number}
                className="relative bg-white border border-[#14131F]/8 rounded-2xl p-6 flex flex-col justify-between transition-all duration-200 hover:border-[#14131F]/20"
              >
                <div>
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xl font-display font-bold text-[#4338CA]">
                      {step.number}
                    </span>
                    <div className="w-9 h-9 rounded-xl bg-[#4338CA]/8 text-[#4338CA] flex items-center justify-center">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base sm:text-lg font-display font-bold text-[#14131F] mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm font-sans text-[#14131F]/70 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Footer Tag */}
                <div className="mt-6 pt-4 border-t border-[#14131F]/8 flex items-center justify-between text-xs text-[#14131F]/60">
                  <span>Step {idx + 1} of 4</span>
                  <span className="font-medium text-[#4338CA]">{step.tag}</span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
