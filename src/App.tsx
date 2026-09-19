import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { SocialProof } from './components/SocialProof';
import { MetricsBar } from './components/MetricsBar';
import { ModuleRing } from './components/ModuleRing';
import { FeaturesGrid } from './components/FeaturesGrid';
import { ProcessSteps } from './components/ProcessSteps';
import { PricingSection } from './components/PricingSection';
import { CtaFooterSection } from './components/CtaFooterSection';
import { DemoModal } from './components/DemoModal';
import { GetStartedModal } from './components/GetStartedModal';
import { AnnouncementModal } from './components/AnnouncementModal';
import { StudentDashboard } from './components/dashboards/StudentDashboard';
import { IndustryDashboard } from './components/dashboards/IndustryDashboard';
import { AcademicianDashboard } from './components/dashboards/AcademicianDashboard';
import { InstitutionDashboard } from './components/dashboards/InstitutionDashboard';
import { RoleDashboardPlaceholder } from './components/dashboards/RoleDashboardPlaceholder';
import { AuthProvider, useAuth } from './context/AuthContext';

function MainApp() {
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [getStartedModalOpen, setGetStartedModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(true);

  // Real authentication from AuthContext
  const { isLoggedIn: authIsLoggedIn, userRole: authUserRole, user: authUser, logout: authLogout } = useAuth();

  // Observational polling for DB connection health every 5 seconds
  useEffect(() => {
    let isMounted = true;

    const checkDbHealth = async () => {
      try {
        const res = await fetch('/api/health/db');
        if (!res.ok) {
          if (isMounted) setIsDbConnected(false);
          return;
        }
        const data = await res.json().catch(() => null);
        if (isMounted) {
          setIsDbConnected(Boolean(data && data.connected));
        }
      } catch {
        if (isMounted) {
          setIsDbConnected(false);
        }
      }
    };

    // Initial check
    checkDbHealth();

    // Poll every 5 seconds
    const intervalId = setInterval(checkDbHealth, 5000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const openSignIn = () => {
    setAuthMode('signin');
    setGetStartedModalOpen(true);
  };

  const openSignUp = () => {
    setAuthMode('signup');
    setGetStartedModalOpen(true);
  };

  const handleLoginSuccess = () => {
    setGetStartedModalOpen(false);
  };

  const handleLogout = () => {
    if (authIsLoggedIn) {
      authLogout();
    }
  };

  const degradedModeBanner = !isDbConnected ? (
    <div
      id="degraded-mode-indicator"
      role="alert"
      className="sticky top-0 z-[100] w-full bg-amber-500 text-slate-950 px-4 py-2.5 text-center text-xs sm:text-sm font-semibold tracking-wide shadow-md flex items-center justify-center gap-2 border-b border-amber-600 animate-in fade-in duration-200"
    >
      <span>⚠</span>
      <span>
        Running in degraded mode — primary database unavailable. Live sessions continue; new signups and some saves are temporarily paused.
      </span>
    </div>
  ) : null;

  // If logged in, branch view based on user's authenticated role
  if (authIsLoggedIn) {
    if (authUserRole === 'student') {
      return (
        <div className="min-h-screen flex flex-col">
          {degradedModeBanner}
          <StudentDashboard
            onSwitchRole={() => {}}
            onLogout={handleLogout}
          />
        </div>
      );
    }

    if (authUserRole === 'industry') {
      return (
        <div className="min-h-screen flex flex-col">
          {degradedModeBanner}
          <IndustryDashboard
            onSwitchRole={() => {}}
            onLogout={handleLogout}
          />
        </div>
      );
    }

    if (authUserRole === 'academician') {
      return (
        <div className="min-h-screen flex flex-col">
          {degradedModeBanner}
          <AcademicianDashboard
            onSwitchRole={() => {}}
            onLogout={handleLogout}
          />
        </div>
      );
    }

    if (authUserRole === 'institution') {
      return (
        <div className="min-h-screen flex flex-col">
          {degradedModeBanner}
          <InstitutionDashboard
            onSwitchRole={() => {}}
            onLogout={handleLogout}
          />
        </div>
      );
    }

    // Role-based placeholder for any unmapped role
    return (
      <RoleDashboardPlaceholder
        role={authUserRole as any}
        user={authUser}
        onLogout={handleLogout}
        degradedModeBanner={degradedModeBanner}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#14131F] font-sans flex flex-col justify-between selection:bg-[#4338CA] selection:text-white">
      {degradedModeBanner}
      {/* Top Navbar */}
      <Navbar onSignInClick={openSignIn} onSignUpClick={openSignUp} />

      {/* Main Page Flow */}
      <main className="flex-1 flex flex-col">
        {/* 1. Hero Section */}
        <HeroSection
          onWatchDemoClick={() => setDemoModalOpen(true)}
          onGetStartedClick={openSignUp}
        />
        
        {/* 2. Company Social Proof */}
        <SocialProof />

        {/* 3. Metrics Stats Bar */}
        <MetricsBar />

        {/* 4. 3D Continuous Rotating Module Ring */}
        <div id="showcase">
          <ModuleRing />
        </div>

        {/* 5. Features Grid ("One platform, the entire journey") */}
        <FeaturesGrid />

        {/* 6. Step-by-Step Workflow ("From zero to offer in 4 steps") */}
        <div id="process">
          <ProcessSteps />
        </div>

        {/* 7. Pricing Section ("Simple, transparent pricing") */}
        <PricingSection onSelectPlan={openSignUp} />

        {/* 8. CTA Banner & Multi-Column Footer */}
        <CtaFooterSection onStartFreeClick={openSignUp} />
      </main>

      {/* Interactive Modals */}
      <DemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onGetStartedClick={openSignUp}
      />

      <GetStartedModal
        isOpen={getStartedModalOpen}
        onClose={() => setGetStartedModalOpen(false)}
        initialMode={authMode}
        onLoginSuccess={handleLoginSuccess}
      />

      <AnnouncementModal
        isOpen={announcementModalOpen}
        onClose={() => setAnnouncementModalOpen(false)}
        onGetStartedClick={openSignUp}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
