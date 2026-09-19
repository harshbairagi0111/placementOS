import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Code2, FileText, Bot, Compass, Award, BarChart3 } from 'lucide-react';
import { SectionHeading } from './ui/SectionHeading';
import { Badge } from './ui/Badge';

interface ModuleCard {
  id: string;
  badge: string;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}

const MODULES: ModuleCard[] = [
  {
    id: 'portfolio',
    badge: 'Portfolio Verification',
    title: 'Code Portfolio',
    description: 'GitHub repositories, live deployments, and code complexity parsed into demonstrable project records.',
    icon: Code2,
  },
  {
    id: 'resume',
    badge: 'ATS Screening Engine',
    title: 'Resume Intelligence',
    description: 'Scored against Google XYZ impact formulas and enterprise applicant tracking parameters.',
    icon: FileText,
  },
  {
    id: 'interview',
    badge: 'Voice Simulation',
    title: 'Mock Interview Lab',
    description: 'AI-driven technical deep-dives on DSA, system architecture, and behavioral communication.',
    icon: Bot,
  },
  {
    id: 'roadmaps',
    badge: 'Preparation Plan',
    title: 'Targeted Roadmaps',
    description: 'A structured, week-by-week curriculum calibrated to target technical hiring bars.',
    icon: Compass,
  },
  {
    id: 'skills',
    badge: 'Competency Ledger',
    title: 'Skill Gap Analysis',
    description: 'Benchmark individual algorithmic and design proficiencies against institutional hiring standards.',
    icon: Award,
  },
  {
    id: 'company',
    badge: 'Role Intelligence',
    title: 'Company Assessment',
    description: 'Synthesized interview logs, past question frequency, and tailored assessment rubrics.',
    icon: BarChart3,
  },
];

export const ModuleRing: React.FC = () => {
  const [rotation, setRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startXRef = useRef(0);
  const currentRotationRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  const numCards = MODULES.length;
  const angleStep = 360 / numCards;

  // Continuous rotation loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (!isDragging && !isHovered) {
        setRotation((prev) => (prev - (10 * delta) / 1000) % 360);
      }

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isDragging, isHovered]);

  const handlePrev = () => {
    setRotation((prev) => prev + angleStep);
  };

  const handleNext = () => {
    setRotation((prev) => prev - angleStep);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startXRef.current = e.clientX;
    currentRotationRef.current = rotation;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - startXRef.current;
    setRotation(currentRotationRef.current + deltaX * 0.3);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    startXRef.current = e.touches[0].clientX;
    currentRotationRef.current = rotation;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const deltaX = e.touches[0].clientX - startXRef.current;
    setRotation(currentRotationRef.current + deltaX * 0.4);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (Math.abs(e.deltaX) > 10) {
      setRotation((prev) => prev - e.deltaX * 0.15);
    }
  };

  return (
    <section id="showcase" className="w-full bg-[#FAFAF8] text-[#14131F] py-20 px-6 lg:px-12 relative overflow-hidden select-none border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto mb-10 text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#14131F]/10 text-xs font-medium text-[#14131F] mb-4">
          <span className="w-2 h-2 rounded-full bg-[#4338CA]" />
          <span>Interactive module showcase</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-bold tracking-tight text-[#14131F] mb-2">
          Modular Career Preparation Engine
        </h2>
        <p className="font-sans text-[#14131F]/70 text-sm sm:text-base">
          Explore the integrated modules built to evaluate, prepare, and verify your engineering readiness.
        </p>
      </div>

      {/* 3D Carousel Stage */}
      <div 
        className="relative max-w-5xl mx-auto h-[380px] sm:h-[420px] flex items-center justify-center cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          handleMouseUp();
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        
        {/* Left Navigation Arrow */}
        <button
          onClick={handlePrev}
          aria-label="Previous Module"
          className="absolute left-2 sm:left-4 z-30 w-10 h-10 rounded-xl bg-white border border-[#14131F]/15 hover:border-[#14131F]/40 text-[#14131F] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Right Navigation Arrow */}
        <button
          onClick={handleNext}
          aria-label="Next Module"
          className="absolute right-2 sm:right-4 z-30 w-10 h-10 rounded-xl bg-white border border-[#14131F]/15 hover:border-[#14131F]/40 text-[#14131F] flex items-center justify-center transition-all cursor-pointer shadow-xs"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        {/* 3D Ring Container */}
        <div 
          className="w-full h-full relative flex items-center justify-center"
          style={{ perspective: '1000px' }}
        >
          <div
            className="w-full h-full relative flex items-center justify-center"
            style={{
              transformStyle: 'preserve-3d',
              transform: `rotateY(${rotation}deg)`,
            }}
          >
            {MODULES.map((item, index) => {
              const cardAngle = index * angleStep;
              const totalAngle = (cardAngle + rotation) % 360;
              const normalizedAngle = (totalAngle + 360) % 360;
              const isFront = normalizedAngle < 45 || normalizedAngle > 315;
              const opacity = isFront ? 1 : normalizedAngle > 120 && normalizedAngle < 240 ? 0.3 : 0.75;

              const IconComponent = item.icon;

              return (
                <div
                  key={item.id}
                  className="absolute w-[250px] sm:w-[290px] h-[330px] sm:h-[360px] rounded-2xl p-6 bg-white border border-[#14131F]/10 shadow-sm flex flex-col justify-between transition-opacity duration-300 pointer-events-auto text-left"
                  style={{
                    transform: `rotateY(${cardAngle}deg) translateZ(320px)`,
                    backfaceVisibility: 'visible',
                    opacity: opacity,
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#4338CA]/8 text-[#4338CA]">
                        {item.badge}
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-[#4338CA]/8 text-[#4338CA] flex items-center justify-center">
                        <IconComponent className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Title in Space Grotesk */}
                    <h3 className="text-xl sm:text-2xl font-display font-bold text-[#14131F] tracking-tight mb-2.5">
                      {item.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs sm:text-sm font-sans text-[#14131F]/70 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Bottom Indicator */}
                  <div className="pt-3 border-t border-[#14131F]/8 flex items-center justify-between text-xs font-sans text-[#14131F]/50">
                    <span>Module {index + 1} of {MODULES.length}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Bottom Hint */}
      <p className="text-left max-w-7xl mx-auto text-xs font-sans text-[#14131F]/50 mt-6">
        Swipe, drag, or use arrows to explore interactive prep modules.
      </p>
    </section>
  );
};

