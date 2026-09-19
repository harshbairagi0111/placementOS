import React from 'react';

export type HeadingLevel = 'display' | 'h1' | 'h2' | 'h3';

export interface SectionHeadingProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  level?: HeadingLevel;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  divider?: boolean;
}

const headingStyles: Record<HeadingLevel, string> = {
  display: 'text-3xl sm:text-4xl md:text-5xl font-display font-bold tracking-tight text-[#14131F] leading-[1.15]',
  h1: 'text-[28px] sm:text-3xl lg:text-[32px] font-display font-bold tracking-tight text-[#14131F] leading-tight',
  h2: 'text-[21px] sm:text-2xl font-display font-bold tracking-tight text-[#14131F] leading-snug',
  h3: 'text-[18px] sm:text-xl font-display font-semibold text-[#14131F] leading-snug',
};

/**
 * SectionHeading component reflecting modern SaaS typography.
 * Defaults strictly to left-aligned hierarchy with Space Grotesk display headings.
 */
export const SectionHeading: React.FC<SectionHeadingProps> = ({
  level = 'h2',
  title,
  subtitle,
  badge,
  action,
  divider = false,
  className = '',
  ...props
}) => {
  const HeadingTag = level === 'display' || level === 'h1' ? 'h1' : level === 'h2' ? 'h2' : 'h3';

  return (
    <div
      className={`text-left ${divider ? 'pb-4 border-b border-[#14131F]/8 mb-6' : ''} ${className}`}
      {...props}
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
        <div className="flex items-center gap-3 flex-wrap">
          <HeadingTag className={headingStyles[level]}>{title}</HeadingTag>
          {badge && <span className="shrink-0">{badge}</span>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      {subtitle && (
        <div className="font-sans text-sm sm:text-base text-[#14131F]/70 mt-2 leading-relaxed max-w-3xl">
          {subtitle}
        </div>
      )}
    </div>
  );
};
