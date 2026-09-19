import React, { useState, useEffect } from 'react';
import { Menu, X, PanelLeftClose, LucideIcon } from 'lucide-react';

export interface DashboardShellProps {
  portalName?: string;
  portalSubtitle: string;
  portalIcon: LucideIcon;
  currentModuleName: string;
  renderSearch?: () => React.ReactNode;
  renderNavList: (onItemClick?: () => void) => React.ReactNode;
  renderSidebarBottom?: () => React.ReactNode;
  headerBadges?: React.ReactNode;
  headerActions?: React.ReactNode;
  mobileNavStrip?: React.ReactNode;
  children: React.ReactNode;
  // Optional controlled state
  isSidebarOpen?: boolean;
  onSidebarToggle?: (isOpen: boolean) => void;
  className?: string;
}

/**
 * Shared Dashboard Shell for all PlacementOS portals:
 * - Student Portal
 * - Industry Portal
 * - Academician Portal
 * - Institution & TPO Portal
 *
 * Features:
 * 1. Collapsed by default on desktop to maximize main content workspace.
 * 2. Header menu button [☰] to toggle open/close with smooth slide transitions.
 * 3. Expands main dashboard layout to full available width (up to 1720px/1920px) without empty dead margins.
 * 4. Refined high-readability typography, crisp visual contrast, and responsive drawer on smaller viewports.
 */
export const DashboardShell: React.FC<DashboardShellProps> = ({
  portalName = 'placementOS',
  portalSubtitle,
  portalIcon: PortalIcon,
  currentModuleName,
  renderSearch,
  renderNavList,
  renderSidebarBottom,
  headerBadges,
  headerActions,
  mobileNavStrip,
  children,
  isSidebarOpen: controlledIsOpen,
  onSidebarToggle,
  className = '',
}) => {
  // Default to collapsed on desktop and mobile
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (next: boolean | ((prev: boolean) => boolean)) => {
    const computed = typeof next === 'function' ? next(isOpen) : next;
    if (controlledIsOpen === undefined) {
      setInternalIsOpen(computed);
    }
    onSidebarToggle?.(computed);
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  // Close sidebar on Esc key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleNavClick = () => {
    // On small screens, close the drawer when a navigation item is selected
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <div className={`min-h-screen bg-[#FAFAF8] text-[#14131F] font-sans flex flex-col relative ${className}`}>
      {/* ================= MOBILE / TABLET OVERLAY BACKDROP ================= */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-[#14131F]/35 backdrop-blur-xs z-40 transition-opacity animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ================= SLIDE-OUT SIDEBAR (DESKTOP & MOBILE) ================= */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 xl:w-72 bg-white border-r border-[#14131F]/10 z-40 flex flex-col justify-between transition-transform duration-300 ease-in-out overflow-y-auto ${
          isOpen ? 'translate-x-0 shadow-2xl lg:shadow-md' : '-translate-x-full pointer-events-none'
        }`}
        aria-label="Portal Navigation"
      >
        <div className="flex flex-col">
          {/* Brand Header & Close Button */}
          <div className="p-4 sm:p-5 border-b border-[#14131F]/8 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-xs shrink-0">
                <PortalIcon className="w-4.5 h-4.5 text-white" />
              </div>
              <div className="truncate text-left">
                <span className="font-display font-bold text-base text-[#14131F] tracking-tight block truncate">
                  {portalName}
                </span>
                <span className="block text-[11px] text-[#4338CA] font-semibold tracking-wider uppercase truncate">
                  {portalSubtitle}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-xl border border-[#14131F]/10 hover:bg-[#14131F]/5 text-[#14131F]/60 hover:text-[#14131F] transition-colors cursor-pointer shrink-0 ml-2"
              title="Collapse navigation"
              aria-label="Collapse navigation"
            >
              <PanelLeftClose className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Optional Search */}
          {renderSearch && renderSearch()}

          {/* Nav List */}
          {renderNavList(handleNavClick)}
        </div>

        {/* Bottom Area (Tenant / Readiness / Profile) */}
        {renderSidebarBottom && <div>{renderSidebarBottom()}</div>}
      </aside>

      {/* ================= MAIN CONTENT WRAPPER ================= */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all duration-300 ease-in-out ${
          isOpen ? 'lg:pl-64 xl:pl-72' : 'pl-0'
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-30 w-full bg-white/95 backdrop-blur-md border-b border-[#14131F]/8 px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3 shadow-2xs">
          {/* Left: Sidebar Toggle + Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={toggleSidebar}
              className="p-2 sm:p-2.5 rounded-xl border border-[#14131F]/12 hover:border-[#4338CA]/30 text-[#14131F] hover:text-[#4338CA] hover:bg-[#4338CA]/5 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-2xs group"
              title={isOpen ? 'Collapse navigation' : 'Expand navigation'}
              aria-label={isOpen ? 'Collapse navigation' : 'Expand navigation'}
            >
              <Menu className="w-5 h-5 text-[#14131F] group-hover:text-[#4338CA] transition-colors" />
            </button>

            {/* Breadcrumb Hierarchy */}
            <div className="flex items-center gap-2 text-sm sm:text-[15px] font-sans truncate text-left">
              <span className="hidden sm:inline text-[#14131F]/60 font-medium">{portalName}</span>
              <span className="hidden sm:inline text-[#14131F]/30">/</span>
              <span className="hidden md:inline text-[#14131F]/60 font-medium">{portalSubtitle}</span>
              <span className="hidden md:inline text-[#14131F]/30">/</span>
              <span className="font-display font-bold text-base text-[#14131F] truncate">
                {currentModuleName}
              </span>
            </div>
          </div>

          {/* Right: Status Badges & Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {headerBadges}
            {headerActions}
          </div>
        </header>

        {/* Optional Mobile Horizontal Quick-Tab Strip */}
        {mobileNavStrip && (
          <div className="lg:hidden w-full bg-white border-b border-[#14131F]/8 px-4 overflow-x-auto no-scrollbar">
            {mobileNavStrip}
          </div>
        )}

        {/* Full-width Responsive Main Content Canvas */}
        <main className="flex-1 w-full max-w-[1720px] 2xl:max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 md:py-8 space-y-8 text-left">
          {children}
        </main>
      </div>
    </div>
  );
};
