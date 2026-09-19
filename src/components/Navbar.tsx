import React, { useState } from 'react';
import { Menu, X, Landmark } from 'lucide-react';
import { Button } from './ui/Button';

interface NavbarProps {
  onSignInClick: () => void;
  onSignUpClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSignInClick, onSignUpClick }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-[#FAFAF8]/95 backdrop-blur-xs text-[#14131F] px-6 lg:px-12 py-3.5 border-b border-[#14131F]/8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Academic Insignia */}
        <a href="#" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-[#4338CA] flex items-center justify-center text-white shadow-xs">
            <Landmark className="w-4 h-4 text-white stroke-[2.2]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg sm:text-xl font-display font-bold tracking-tight text-[#14131F]">
              placementOS
            </span>
          </div>
        </a>

        {/* Center Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-sans font-medium text-[#14131F]/70">
          <a href="#showcase" className="hover:text-[#14131F] transition-colors">
            Showcase
          </a>
          <a href="#features" className="hover:text-[#14131F] transition-colors">
            Features
          </a>
          <a href="#process" className="hover:text-[#14131F] transition-colors">
            Process
          </a>
          <a href="#pricing" className="hover:text-[#14131F] transition-colors">
            Pricing
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="ghost"
            size="md"
            onClick={onSignInClick}
            className="text-[#14131F]/70 hover:text-[#14131F]"
          >
            Sign in
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onSignUpClick}
          >
            Get started
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-[#14131F] hover:text-[#14131F]/70 p-2 cursor-pointer transition-colors"
          aria-label="Toggle Menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden mt-3 pt-3 pb-5 border-t border-[#14131F]/8 flex flex-col gap-3 text-sm font-sans text-[#14131F]/70 text-left">
          <a
            href="#showcase"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-[#14131F] py-1 transition-colors"
          >
            Showcase
          </a>
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-[#14131F] py-1 transition-colors"
          >
            Features
          </a>
          <a
            href="#process"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-[#14131F] py-1 transition-colors"
          >
            Process
          </a>
          <a
            href="#pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="hover:text-[#14131F] py-1 transition-colors"
          >
            Pricing
          </a>
          <div className="pt-2 mt-1 border-t border-[#14131F]/8 flex flex-col gap-2">
            <Button
              variant="secondary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignInClick();
              }}
              className="w-full justify-center"
            >
              Sign in
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                setMobileMenuOpen(false);
                onSignUpClick();
              }}
              className="w-full justify-center"
            >
              Get started
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};

