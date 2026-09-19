import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ledger' | 'brick' | 'success' | 'warning' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[#4338CA] text-white hover:bg-[#3730A3] active:bg-[#312E81] focus-visible:ring-2 focus-visible:ring-[#4338CA]/30 shadow-xs',
  secondary:
    'bg-white text-[#14131F] border border-[#14131F]/15 hover:border-[#14131F]/30 hover:bg-[#FAFAF8] active:bg-[#F3F4F6] focus-visible:ring-2 focus-visible:ring-[#14131F]/15 shadow-xs',
  ghost:
    'bg-transparent text-[#14131F]/70 hover:text-[#14131F] hover:bg-[#14131F]/5 active:bg-[#14131F]/10 focus-visible:ring-2 focus-visible:ring-[#14131F]/15 border border-transparent',
  ledger:
    'bg-[#4338CA] text-white hover:bg-[#3730A3] active:bg-[#312E81] focus-visible:ring-2 focus-visible:ring-[#4338CA]/30 shadow-xs',
  brick:
    'bg-[#FB7185] text-white hover:bg-[#F43F5E] active:bg-[#E11D48] focus-visible:ring-2 focus-visible:ring-[#FB7185]/30 shadow-xs',
  success:
    'bg-[#15803D] text-white hover:bg-[#166534] active:bg-[#14532D] focus-visible:ring-2 focus-visible:ring-[#15803D]/30 shadow-xs',
  warning:
    'bg-[#EA580C] text-white hover:bg-[#C2410C] active:bg-[#9A3412] focus-visible:ring-2 focus-visible:ring-[#EA580C]/30 shadow-xs',
  destructive:
    'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] focus-visible:ring-2 focus-visible:ring-[#EF4444]/30 shadow-xs',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'text-[13.5px] px-3.5 py-1.5 gap-2 rounded-lg font-medium',
  md: 'text-[15px] px-4.5 py-2.5 gap-2 rounded-xl font-medium',
  lg: 'text-base px-5.5 py-3 gap-2.5 rounded-xl font-medium',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      className = '',
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={`inline-flex items-center justify-center font-sans font-medium whitespace-nowrap transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
