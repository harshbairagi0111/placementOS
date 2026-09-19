import React from 'react';

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  metadata?: React.ReactNode;
  action?: React.ReactNode;
  isLast?: boolean;
}

/**
 * Hairline record row primitive for opportunities, applications, credentials, and skill lists.
 * Modern SaaS styling: crisp 1px hairline border, clear typography hierarchy.
 */
export const ListRow: React.FC<ListRowProps> = ({
  leading,
  title,
  subtitle,
  badge,
  metadata,
  action,
  isLast = false,
  className = '',
  onClick,
  ...props
}) => {
  return (
    <div
      onClick={onClick}
      className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 py-3.5 px-4 transition-colors duration-150 text-left ${
        !isLast ? 'border-b border-[#14131F]/8' : ''
      } ${onClick ? 'hover:bg-[#14131F]/[0.02] cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {/* Left-aligned Content */}
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {leading && <div className="shrink-0 mt-0.5 sm:mt-0">{leading}</div>}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-display font-medium text-[15px] sm:text-base text-[#14131F] group-hover:text-[#4338CA] transition-colors truncate">
              {title}
            </span>
            {badge && <span className="shrink-0">{badge}</span>}
          </div>
          {subtitle && (
            <div
              className={`font-sans text-[13.5px] text-[#14131F]/75 mt-0.5 leading-relaxed ${
                typeof subtitle === 'string' ? 'truncate' : ''
              }`}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Right Meta & Action */}
      {(metadata || action) && (
        <div className="flex items-center gap-4 shrink-0 sm:self-center self-start text-[13.5px] text-[#14131F]/70 font-sans">
          {metadata && <div>{metadata}</div>}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
};

export interface LedgerContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Card container framing list rows with a crisp hairline border on a pure white surface.
 */
export const LedgerContainer: React.FC<LedgerContainerProps> = ({
  header,
  footer,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`border border-[#14131F]/8 bg-white rounded-2xl divide-y divide-[#14131F]/8 overflow-hidden text-left shadow-xs ${className}`}
      {...props}
    >
      {header && (
        <div className="px-5 py-3.5 bg-[#14131F]/[0.02] border-b border-[#14131F]/8 text-xs font-semibold text-[#14131F] font-display uppercase tracking-wider">
          {header}
        </div>
      )}
      <div className="divide-y divide-[#14131F]/8">{children}</div>
      {footer && (
        <div className="px-5 py-3 bg-[#14131F]/[0.01] border-t border-[#14131F]/8 text-[13px] text-[#14131F]/70">
          {footer}
        </div>
      )}
    </div>
  );
};

export interface RecordCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Modern SaaS white card with hairline border.
 */
export const RecordCard: React.FC<RecordCardProps> = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`border border-[#14131F]/8 bg-white rounded-2xl p-6 text-left shadow-xs ${className}`}
      {...props}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-4 pb-4 mb-4 border-b border-[#14131F]/8">
          <div>
            {title && (
              <h3 className="font-display font-bold text-[17px] sm:text-[19px] text-[#14131F] leading-snug">
                {title}
              </h3>
            )}
            {subtitle && (
              <div className="font-sans text-[13.5px] sm:text-[14.5px] text-[#14131F]/75 mt-1 leading-normal">
                {subtitle}
              </div>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
};
