import React from 'react';
import { Mic, Briefcase, BrainCircuit, Users, Check, Sparkles } from 'lucide-react';

interface FeatureItem {
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  bullets: string[];
  imageSrc: string;
  imageAlt: string;
  badgeText: string;
  imageOnRight?: boolean;
}

const FEATURE_PILLARS: FeatureItem[] = [
  {
    tag: 'Simulated AI Interviews',
    tagColor: 'text-[#4338CA] bg-[#4338CA]/10',
    title: 'Practice realistic technical and behavioral rounds with instant AI feedback',
    description: 'Stop dreading technical interviews. Practice system design, DSA coding logic, and HR behavioral questions with an intelligent conversational interviewer that adapts questions dynamically based on your code and explanations.',
    bullets: [
      'Voice-enabled conversational rounds with real-time speech-to-text',
      'Instant rubric breakdown across communication, correctness, and problem-solving',
      'Audio playback and model answer generation for every prompt',
    ],
    imageSrc: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Student practicing mock technical interview with laptop and headphones',
    badgeText: '96% confidence improvement',
    imageOnRight: true,
  },
  {
    tag: 'Opportunities & Drives',
    tagColor: 'text-[#4338CA] bg-[#4338CA]/10',
    title: 'Curated student job and internship board with instant application tracking',
    description: 'Access verified openings matching your graduation year, branch, and target package. Track every submission status from application received to technical round and final offer letter.',
    bullets: [
      'Filter by Full-time, Summer Internship, or Apprenticeship',
      'Immediate visibility into roles you have already applied to',
      'Verified CTC packages, required CGPA cutoffs, and direct recruiter contact notes',
    ],
    imageSrc: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'College students reviewing career opportunities and job offers together',
    badgeText: '300+ active campus drives',
    imageOnRight: false,
  },
  {
    tag: 'Diagnostics & Roadmaps',
    tagColor: 'text-[#4338CA] bg-[#4338CA]/10',
    title: 'Identify your precise skill gaps with quantitative diagnostics',
    description: 'Take timed assessment tests across Quantitative Aptitude, Logical Reasoning, and Core CS Fundamentals. Receive a personalized week-by-week roadmap targeted to the companies you want to crack.',
    bullets: [
      'Curated question bank with detailed step-by-step solutions and formula sheets',
      'Percentile rankings comparing your score against peers across partner universities',
      'Algorithmic skill radar identifying your weakest topics before company tests',
    ],
    imageSrc: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Engineer working through analytical coding challenge on laptop',
    badgeText: 'Adaptive difficulty engine',
    imageOnRight: true,
  },
  {
    tag: 'Community Intelligence',
    tagColor: 'text-[#FB7185] bg-[#FB7185]/10',
    title: 'Learn from verified interview experiences shared by students who got hired',
    description: 'Read first-hand accounts of on-campus and off-campus recruitment rounds at top tech companies, product startups, and consultancies. Know the exact coding questions asked, interview duration, and insider advice.',
    bullets: [
      'Searchable archives by company name, CTC tier, and engineering discipline',
      'Earn shareable verified achievement badges for your LinkedIn profile',
      'Crowdsourced salary breakdowns and round-by-round interview stages',
    ],
    imageSrc: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1200&auto=format&fit=crop',
    imageAlt: 'Students and alumni sharing career experiences and placement guidance',
    badgeText: '1,400+ verified interview stories',
    imageOnRight: false,
  },
];

export const FeaturesGrid: React.FC = () => {
  return (
    <section id="features" className="w-full bg-[#FAFAF8] text-[#14131F] py-20 px-6 lg:px-12 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-16 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#14131F]/10 text-xs font-medium text-[#14131F] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#4338CA]" />
            <span>Built for the full placement lifecycle</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight text-[#14131F] leading-tight mb-4">
            Everything you need to go from preparation to placement
          </h2>
          <p className="font-sans text-[#14131F]/70 text-base sm:text-lg leading-relaxed">
            Four interconnected pillars engineered to eliminate uncertainty and build verified readiness across every stage of your job hunt.
          </p>
        </div>

        {/* Editorial Alternating Pillars */}
        <div className="space-y-16 lg:space-y-24">
          {FEATURE_PILLARS.map((pillar, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
                pillar.imageOnRight ? '' : 'lg:flex-row-reverse'
              }`}
            >
              {/* Text Description Column */}
              <div className={`lg:col-span-6 flex flex-col text-left ${pillar.imageOnRight ? 'lg:order-1' : 'lg:order-2'}`}>
                <div className="inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-md text-xs font-semibold mb-4 tracking-wide font-sans bg-white border border-[#14131F]/10 text-[#4338CA]">
                  {pillar.tag}
                </div>

                <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#14131F] tracking-tight leading-snug mb-4">
                  {pillar.title}
                </h3>

                <p className="font-sans text-[#14131F]/70 text-sm sm:text-base leading-relaxed mb-6">
                  {pillar.description}
                </p>

                <ul className="space-y-3 font-sans text-xs sm:text-sm text-[#14131F]/80">
                  {pillar.bullets.map((bullet, bIdx) => (
                    <li key={bIdx} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-[#4338CA]/10 text-[#4338CA] flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 stroke-[2.5]" />
                      </div>
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Photo Column */}
              <div className={`lg:col-span-6 ${pillar.imageOnRight ? 'lg:order-2' : 'lg:order-1'}`}>
                <div className="relative rounded-2xl overflow-hidden border border-[#14131F]/10 bg-white aspect-[16/11] shadow-sm group">
                  <img
                    src={pillar.imageSrc}
                    alt={pillar.imageAlt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Real Photo Floating Badge */}
                  <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-[#14131F]/10 px-3 py-1.5 rounded-lg text-xs font-medium text-[#14131F] flex items-center gap-2 shadow-xs">
                    <span className="w-2 h-2 rounded-full bg-[#A3E635]" />
                    <span>{pillar.badgeText}</span>
                  </div>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
