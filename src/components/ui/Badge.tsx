import React from 'react';
import { Check, Award, ShieldCheck } from 'lucide-react';

export type BadgeVariant = 'verified' | 'positive' | 'success' | 'warning' | 'neutral' | 'muted';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  // Verified / Primary accent state (#4338CA)
  verified:
    'bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 font-semibold',
  // Positive / Growth accent state (#A3E635)
  positive:
    'bg-[#A3E635]/20 text-[#14131F] border border-[#A3E635]/40 font-semibold',
  // Success state (clean emerald green)
  success:
    'bg-emerald-50 text-emerald-700 border border-emerald-200/80 font-semibold',
  // Warning / Warm accent state (#FB7185)
  warning:
    'bg-[#FB7185]/15 text-[#14131F] border border-[#FB7185]/35 font-medium',
  // Neutral state
  neutral:
    'bg-[#14131F]/5 text-[#14131F] border border-[#14131F]/15 font-medium',
  // Muted / Secondary state
  muted:
    'bg-[#14131F]/[0.05] text-[#14131F]/75 border border-[#14131F]/15 font-medium',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'text-[12px] sm:text-[12.5px] px-2.5 py-0.5 gap-1.5 rounded-full font-medium',
  md: 'text-[13px] sm:text-[13.5px] px-3 py-1 gap-1.5 rounded-full font-medium',
};

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  children,
  ...props
}) => {
  return (
    <span
      className={`inline-flex items-center whitespace-nowrap font-sans tracking-normal transition-colors select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon ? (
        <span className="shrink-0">{icon}</span>
      ) : variant === 'verified' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA] shrink-0" aria-hidden="true" />
      ) : variant === 'positive' ? (
        <span className="w-1.5 h-1.5 rounded-full bg-[#65A30D] shrink-0" aria-hidden="true" />
      ) : null}
      <span>{children}</span>
    </span>
  );
};

export interface VerifiedSealProps extends React.HTMLAttributes<HTMLSpanElement> {
  size?: 'sm' | 'md' | 'lg';
  iconType?: 'dot' | 'check' | 'shield' | 'award';
  label?: React.ReactNode;
}

export const VerifiedSeal: React.FC<VerifiedSealProps> = ({
  size = 'md',
  iconType = 'check',
  label = 'Verified',
  className = '',
  ...props
}) => {
  const sizeMap = {
    sm: 'text-[11px] px-2 py-0.5 gap-1 rounded-full',
    md: 'text-xs px-2.5 py-0.5 gap-1.5 rounded-full',
    lg: 'text-sm px-3 py-1 gap-2 rounded-full',
  };

  const iconMap = {
    dot: <span className="w-1.5 h-1.5 rounded-full bg-[#4338CA] shrink-0" aria-hidden="true" />,
    check: <Check className="w-3 h-3 text-[#4338CA] shrink-0 stroke-[2.5]" />,
    shield: <ShieldCheck className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />,
    award: <Award className="w-3.5 h-3.5 text-[#4338CA] shrink-0" />,
  };

  return (
    <span
      className={`inline-flex items-center font-sans font-semibold tracking-tight bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/25 whitespace-nowrap select-none ${sizeMap[size]} ${className}`}
      {...props}
    >
      {iconMap[iconType]}
      <span>{label}</span>
    </span>
  );
};
