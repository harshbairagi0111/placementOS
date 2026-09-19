import React from 'react';
import { Code2, Cpu, FileCheck, Award } from 'lucide-react';

export const SocialProof: React.FC = () => {
  const domains = [
    {
      icon: Code2,
      name: 'DSA & Algorithms',
      metric: '500+ Curated Problems',
      coverage: 'LeetCode & HackerRank Standard',
    },
    {
      icon: Cpu,
      name: 'System Design',
      metric: 'LLD & HLD Rubrics',
      coverage: 'Distributed Architecture & Scaling',
    },
    {
      icon: FileCheck,
      name: 'Resume Intelligence',
      metric: 'ATS Parser v3.2',
      coverage: 'Google XYZ Quantification Benchmarks',
    },
    {
      icon: Award,
      name: 'Verified Badges',
      metric: 'Tier-1 Certification',
      coverage: 'Shareable on LinkedIn & Portfolios',
    },
  ];

  return (
    <section className="w-full bg-white text-[#14131F] px-6 lg:px-12 py-8 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
          {domains.map((domain, idx) => {
            const IconComp = domain.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3.5 p-4 rounded-xl border border-[#14131F]/8 bg-[#FAFAF8] transition-all hover:border-[#14131F]/20"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-display font-semibold text-xs sm:text-sm text-[#14131F] truncate">
                    {domain.name}
                  </h4>
                  <p className="font-sans text-xs text-[#14131F]/90 font-medium mt-0.5">
                    {domain.metric}
                  </p>
                  <p className="font-sans text-[11px] text-[#14131F]/60 mt-0.5">
                    {domain.coverage}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
