import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { Button } from './ui/Button';

interface PricingSectionProps {
  onSelectPlan: (planName: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({ onSelectPlan }) => {
  return (
    <section id="pricing" className="w-full bg-[#FAFAF8] text-[#14131F] py-20 px-6 lg:px-12 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-14 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#14131F]/10 text-xs font-medium text-[#14131F] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Transparent student plans</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#14131F] leading-tight mb-4">
            Invest in your placement journey
          </h2>
          <p className="font-sans text-[#14131F]/70 text-base sm:text-lg leading-relaxed">
            Free forever for core practice and campus job discovery. Upgrade when you need unlimited AI voice mocks and targeted company interview simulations.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch text-left">
          
          {/* Card 1: Student Free */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 hover:border-[#14131F]/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-display font-bold text-[#14131F]">Starter Free</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#14131F]/5 text-[#14131F]/70 font-medium">Free</span>
              </div>
              <p className="text-xs font-sans text-[#14131F]/60 mb-6">Core toolkit for daily placement preparation.</p>

              <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-[#14131F]/8">
                <span className="text-4xl font-display font-bold text-[#14131F]">₹0</span>
                <span className="text-xs text-[#14131F]/60 font-sans">/forever</span>
              </div>

              <ul className="space-y-3 mb-8 text-xs sm:text-sm font-sans text-[#14131F]/80">
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Resume ATS scoring (3 scans/mo)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Access to curated Opportunities Board</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Aptitude Arena (15 questions/day)</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Community Interview Experience Bank</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Verified achievement badges</span>
                </li>
              </ul>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onSelectPlan('Starter Free')}
              className="w-full"
            >
              Get started free
            </Button>
          </div>

          {/* Card 2: Student Pro (Highlighted) */}
          <div className="relative bg-white border-2 border-[#4338CA] rounded-2xl p-7 flex flex-col justify-between shadow-sm">
            {/* Top Pill */}
            <div className="absolute -top-3 left-6">
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#4338CA] text-white">
                Most Popular
              </span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2 mt-1">
                <h3 className="text-xl font-display font-bold text-[#14131F]">Placement Pro</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#A3E635]/30 text-[#14131F] font-semibold">Recommended</span>
              </div>
              <p className="text-xs font-sans text-[#14131F]/60 mb-6">Unlimited preparation runs for active placement drives.</p>

              <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-[#14131F]/8">
                <span className="text-4xl font-display font-bold text-[#14131F]">₹299</span>
                <span className="text-xs text-[#14131F]/60 font-sans">/month</span>
              </div>

              <ul className="space-y-3 mb-8 text-xs sm:text-sm font-sans text-[#14131F]/80">
                <li className="flex items-center gap-2.5 font-medium text-[#14131F]">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Everything in Starter Free</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Unlimited voice AI mock interviews</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Unlimited ATS resume scans & rewrites</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Instant job match alerts & priority apply</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Full aptitude solutions & formulas</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Targeted company question breakdowns</span>
                </li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={() => onSelectPlan('Placement Pro')}
              className="w-full bg-[#4338CA] hover:bg-[#3730A3]"
            >
              Start Placement Pro
            </Button>
          </div>

          {/* Card 3: Semester Pass */}
          <div className="bg-white border border-[#14131F]/8 rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 hover:border-[#14131F]/20">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-display font-bold text-[#14131F]">Semester Pass</h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FB7185]/15 text-[#14131F] font-semibold">Best Value</span>
              </div>
              <p className="text-xs font-sans text-[#14131F]/60 mb-6">One-time payment until your placement season ends.</p>

              <div className="flex items-baseline gap-1 mb-8 pb-6 border-b border-[#14131F]/8">
                <span className="text-4xl font-display font-bold text-[#14131F]">₹999</span>
                <span className="text-xs text-[#14131F]/60 font-sans">/full season</span>
              </div>

              <ul className="space-y-3 mb-8 text-xs sm:text-sm font-sans text-[#14131F]/80">
                <li className="flex items-center gap-2.5 font-medium text-[#14131F]">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>All Placement Pro features</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Valid for full 6 months through drive season</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>1-on-1 resume audit by senior alumni</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>FAANG & Tier-1 interview question decks</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="w-4 h-4 text-[#4338CA] shrink-0" />
                  <span>Priority technical support</span>
                </li>
              </ul>
            </div>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onSelectPlan('Semester Pass')}
              className="w-full"
            >
              Get Semester Pass
            </Button>
          </div>

        </div>

      </div>
    </section>
  );
};
