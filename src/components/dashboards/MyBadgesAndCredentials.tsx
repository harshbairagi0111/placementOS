import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Award, 
  Sparkles, 
  CheckCircle2, 
  Lock, 
  Share2, 
  Download, 
  Search, 
  ShieldCheck, 
  Flame, 
  Zap, 
  Trophy, 
  Star, 
  ExternalLink, 
  Calendar, 
  Check, 
  Copy, 
  FileText,
  Bookmark,
  TrendingUp,
  Cpu,
  Code2,
  Mic,
  GraduationCap,
  X,
  RotateCcw,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { Button, Badge, VerifiedSeal, SectionHeading, RecordCard } from '../ui';

interface BadgeItem {
  id: string;
  title: string;
  category: 'DSA & Algorithms' | 'AI Interview & Speech' | 'System Design' | 'Consistency & Community' | 'Micro-Credentials';
  description: string;
  icon: string;
  rarity: 'Legendary' | 'Epic' | 'Rare' | 'Common';
  unlocked: boolean;
  unlockedDate?: string;
  progressCurrent?: number;
  progressTarget?: number;
  credentialId?: string;
  skillsValidated?: string[];
  issuer?: string;
  comingSoon?: boolean;
}

const MASTER_BADGES: BadgeItem[] = [
  {
    id: 'badge-1',
    title: 'First Step',
    category: 'AI Interview & Speech',
    description: 'Completed your first AI Mock Interview simulation with instant speech assessment.',
    icon: '🎯',
    rarity: 'Common',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 1,
    skillsValidated: ['Interview Practice', 'First Simulation', 'AI Assessment'],
    issuer: 'placementOS AI Evaluation Engine',
    comingSoon: false,
  },
  {
    id: 'badge-2',
    title: 'Interview Master',
    category: 'AI Interview & Speech',
    description: 'Achieved an overall interview score of 85% or higher in a full mock drill.',
    icon: '🏆',
    rarity: 'Epic',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 85,
    skillsValidated: ['Overall Excellence', 'STAR Method', 'Technical Delivery'],
    issuer: 'placementOS Evaluation Board',
    comingSoon: false,
  },
  {
    id: 'badge-3',
    title: 'AI Voice Mock Pro',
    category: 'AI Interview & Speech',
    description: 'Completed 5 full AI Voice Interview simulations with top tier evaluation.',
    icon: '🎙️',
    rarity: 'Epic',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 5,
    skillsValidated: ['Voice Communication', 'STAR Method', 'Executive Presence'],
    issuer: 'placementOS AI Evaluation Engine',
    comingSoon: false,
  },
  {
    id: 'badge-4',
    title: 'Roadmap Architect',
    category: 'System Design',
    description: 'Generated your first personalized AI Career Preparation Roadmap.',
    icon: '🗺️',
    rarity: 'Rare',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 1,
    skillsValidated: ['Career Planning', 'Preparation Strategy', 'Skill Target'],
    issuer: 'placementOS Career AI',
    comingSoon: false,
  },
  {
    id: 'badge-6',
    title: '14-Day Streak Warrior',
    category: 'Consistency & Community',
    description: 'Maintained an unbroken daily practice streak for 14 straight days.',
    icon: '🔥',
    rarity: 'Epic',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 14,
    credentialId: 'CRED-STRK-9921',
    skillsValidated: ['Consistency', 'Daily Discipline', 'Practice Habits'],
    issuer: 'placementOS AI Engine',
    comingSoon: true,
  },
  {
    id: 'badge-7',
    title: '100 Questions Solved',
    category: 'DSA & Algorithms',
    description: 'Solved over 100 curated Data Structures & Algorithm problems with high test accuracy.',
    icon: '⚡',
    rarity: 'Legendary',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 100,
    credentialId: 'CRED-DSA-100',
    skillsValidated: ['Data Structures', 'Algorithmic Efficiency', 'Test Pass Accuracy'],
    issuer: 'placementOS Automated Judge',
    comingSoon: false,
  },
  {
    id: 'badge-8',
    title: 'Full-Stack SDE-1 Certified Micro-Credential',
    category: 'Micro-Credentials',
    description: 'Verified micro-credential validating React, Node.js REST APIs, PostgreSQL indexing, and Docker.',
    icon: '🎓',
    rarity: 'Legendary',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 1,
    credentialId: 'CRED-FS-SDE1-CERT',
    skillsValidated: ['Full-Stack Architecture', 'PostgreSQL', 'Docker Containerization', 'RESTful APIs'],
    issuer: 'placementOS Academic & Placement Board',
    comingSoon: true,
  },
  {
    id: 'badge-9',
    title: 'Distributed Caching & Redis Specialist',
    category: 'Micro-Credentials',
    description: 'Certified expertise in Redis rate limiters, token buckets, and pub-sub architectures.',
    icon: '🛡️',
    rarity: 'Epic',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 1,
    credentialId: 'CRED-REDIS-SPEC',
    skillsValidated: ['Redis Caching', 'Lua Scripting', 'Rate Limiting', 'Low Latency System Design'],
    issuer: 'placementOS System Design Guild',
    comingSoon: true,
  },
  {
    id: 'badge-10',
    title: 'System Design Architect',
    category: 'System Design',
    description: 'Master Rate Limiters, Distributed Caching & Kafka Queues in the AI Simulator.',
    icon: '🏛️',
    rarity: 'Legendary',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 10,
    skillsValidated: ['Distributed Systems', 'Kafka Queues', 'Load Balancers'],
    issuer: 'placementOS Architecture Board',
    comingSoon: true,
  },
  {
    id: 'badge-11',
    title: 'Night Owl Coder',
    category: 'Consistency & Community',
    description: 'Completed late-night practice drills between 10 PM and 2 AM.',
    icon: '🌙',
    rarity: 'Common',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 5,
    skillsValidated: ['Focus Under Pressure', 'Late Night Problem Solving'],
    issuer: 'placementOS Activity Log',
    comingSoon: true,
  },
  {
    id: 'badge-12',
    title: 'Google Tier Candidate',
    category: 'System Design',
    description: 'Reach 90%+ readiness score specifically benchmarked for Google L3 SDE roles.',
    icon: '🌐',
    rarity: 'Legendary',
    unlocked: false,
    progressCurrent: 0,
    progressTarget: 90,
    skillsValidated: ['Google Hiring Bar', 'Algorithmic Depth', 'Scale System Design'],
    issuer: 'placementOS Predictive Engine',
    comingSoon: false,
  }
];

interface MyBadgesAndCredentialsProps {
  studentName?: string;
}

export const MyBadgesAndCredentials: React.FC<MyBadgesAndCredentialsProps> = ({
  studentName = 'Aarav Sharma'
}) => {
  const authContext = useAuth();
  const token = authContext?.token;
  const user = authContext?.user;

  const [badgesList, setBadgesList] = useState<BadgeItem[]>(MASTER_BADGES);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unlocked' | 'locked' | 'credentials'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCredential, setSelectedCredential] = useState<BadgeItem | null>(null);
  const [copiedId, setCopiedId] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const [badgesRes, codingRes, readinessRes] = await Promise.allSettled([
        fetch('/api/badges/me', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/students/me/coding-stats', { headers }).then((r) => (r.ok ? r.json() : null)),
        fetch('/api/students/me/company-readiness', { headers }).then((r) => (r.ok ? r.json() : null)),
      ]);

      const badgesData = badgesRes.status === 'fulfilled' ? badgesRes.value : null;
      const codingData = codingRes.status === 'fulfilled' ? codingRes.value : null;
      const readinessData = readinessRes.status === 'fulfilled' ? readinessRes.value : null;

      const realProblemsSolved =
        typeof codingData?.problemsSolved === 'number' ? codingData.problemsSolved : 0;

      let realGoogleMatchScore = 0;
      if (readinessData && Array.isArray(readinessData.companies)) {
        const googleEntry = readinessData.companies.find(
          (c: any) => c.company?.toLowerCase() === 'google'
        );
        if (googleEntry && typeof googleEntry.matchScore === 'number') {
          realGoogleMatchScore = googleEntry.matchScore;
        }
      }

      const earnedMap = new Map<string, any>();
      if (badgesData && Array.isArray(badgesData.badges)) {
        badgesData.badges.forEach((b: any) => {
          if (b.title) {
            earnedMap.set(b.title.toLowerCase().trim(), b);
          }
        });
      }

      setBadgesList((prev) => {
        const updated = prev.map((item) => {
          if (item.comingSoon) {
            return {
              ...item,
              unlocked: false,
              progressCurrent: 0,
            };
          }

          if (item.id === 'badge-7') {
            const isEarned =
              realProblemsSolved >= 100 || earnedMap.has(item.title.toLowerCase().trim());
            return {
              ...item,
              progressCurrent: realProblemsSolved,
              progressTarget: 100,
              unlocked: isEarned,
              unlockedDate: isEarned
                ? earnedMap.get(item.title.toLowerCase().trim())?.earnedAt ||
                  item.unlockedDate ||
                  new Date().toISOString().split('T')[0]
                : undefined,
            };
          }

          if (item.id === 'badge-12') {
            const isEarned =
              realGoogleMatchScore >= 90 || earnedMap.has(item.title.toLowerCase().trim());
            return {
              ...item,
              progressCurrent: realGoogleMatchScore,
              progressTarget: 90,
              unlocked: isEarned,
              unlockedDate: isEarned
                ? earnedMap.get(item.title.toLowerCase().trim())?.earnedAt ||
                  item.unlockedDate ||
                  new Date().toISOString().split('T')[0]
                : undefined,
            };
          }

          const earnedDoc = earnedMap.get(item.title.toLowerCase().trim());
          if (earnedDoc) {
            return {
              ...item,
              unlocked: true,
              unlockedDate: earnedDoc.earnedAt || earnedDoc.createdAt?.split('T')[0] || '2026-07-28',
              progressCurrent: item.progressTarget || 1,
              credentialId: item.credentialId || `CRED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
            };
          }
          return item;
        });

        if (badgesData && Array.isArray(badgesData.badges)) {
          badgesData.badges.forEach((b: any) => {
            const titleLower = (b.title || '').toLowerCase().trim();
            const alreadyExists = updated.some((u) => u.title.toLowerCase().trim() === titleLower);
            if (!alreadyExists && b.title) {
              updated.push({
                id: b._id || `badge-${Date.now()}`,
                title: b.title,
                category: 'AI Interview & Speech',
                description: b.description || 'Achievement Badge',
                icon: b.icon || '🏅',
                rarity: 'Epic',
                unlocked: true,
                unlockedDate: b.earnedAt || '2026-07-28',
                credentialId: `CRED-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
                skillsValidated: ['Milestone Achieved', 'Competency Verification'],
                issuer: 'placementOS AI Engine',
                comingSoon: false,
              });
            }
          });
        }

        return updated;
      });
    } catch (err) {
      console.warn('Error fetching badges & stats in MyBadgesAndCredentials:', err);
      setFetchError('Could not synchronize live achievements. Displaying cached records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [token]);

  const activeStudentName = user?.name || studentName;

  const unlockedCount = badgesList.filter((b) => b.unlocked && !b.comingSoon).length;
  const totalCount = badgesList.length;
  const availableCount = badgesList.filter((b) => !b.comingSoon).length;
  const unlockedPct = availableCount > 0 ? Math.round((unlockedCount / availableCount) * 100) : 0;
  const totalXp = badgesList
    .filter((b) => b.unlocked && !b.comingSoon)
    .reduce((acc, b) => {
      return acc + (b.rarity === 'Legendary' ? 500 : b.rarity === 'Epic' ? 300 : b.rarity === 'Rare' ? 150 : 50);
    }, 0);
  const certifiedMicroCredentials = badgesList.filter(
    (b) => b.unlocked && !b.comingSoon && b.category === 'Micro-Credentials'
  ).length;

  // Filtered Badges
  const filteredBadges = badgesList.filter((badge) => {
    const matchesSearch = badge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          badge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          badge.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || badge.category === filterCategory;

    let matchesStatus = true;
    if (statusFilter === 'unlocked') matchesStatus = badge.unlocked;
    if (statusFilter === 'locked') matchesStatus = !badge.unlocked;
    if (statusFilter === 'credentials') matchesStatus = badge.category === 'Micro-Credentials';

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterCategory !== 'all' ||
    statusFilter !== 'all';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterCategory('all');
    setStatusFilter('all');
  };

  const handleCopyCredential = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadCertificate = (cred: BadgeItem) => {
    try {
      const certHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>placementOS Credential - ${cred.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #FAFAF8; color: #14131F; margin: 0; padding: 40px; display: flex; justify-content: center; align-items: center; min-height: 90vh; }
    .cert-card { background: #fff; border: 2px solid #14131F; border-radius: 20px; padding: 48px; max-width: 720px; width: 100%; box-shadow: 0 10px 30px rgba(0,0,0,0.05); text-align: center; }
    .brand { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #14131F; margin-bottom: 8px; }
    .badge-mark { font-size: 52px; margin: 16px 0; }
    .cert-title { font-size: 28px; font-weight: 700; color: #4338CA; margin: 12px 0 8px; }
    .recipient { font-size: 24px; font-weight: 700; color: #14131F; border-bottom: 2px solid #A3E635; display: inline-block; padding-bottom: 4px; margin: 16px 0; }
    .desc { font-size: 14px; color: rgba(20,19,31,0.7); max-width: 520px; margin: 0 auto 24px; line-height: 1.6; }
    .meta { border-top: 1px solid rgba(20,19,31,0.1); padding-top: 20px; margin-top: 24px; display: flex; justify-content: space-between; font-size: 12px; color: rgba(20,19,31,0.6); text-align: left; }
    .seal { background: #A3E635; color: #14131F; font-weight: 700; font-size: 12px; padding: 6px 14px; border-radius: 999px; display: inline-block; margin-bottom: 16px; }
  </style>
</head>
<body>
  <div class="cert-card">
    <div class="brand">placementOS</div>
    <div class="seal">✓ VERIFIED CREDENTIAL</div>
    <div class="badge-mark">${cred.icon}</div>
    <div style="font-size: 13px; color: rgba(20,19,31,0.6);">This certifies that</div>
    <div class="recipient">${activeStudentName}</div>
    <div style="font-size: 13px; color: rgba(20,19,31,0.6);">has fulfilled all verification requirements for</div>
    <div class="cert-title">${cred.title}</div>
    <div class="desc">${cred.description}</div>
    <div class="meta">
      <div><strong>Credential ID:</strong> ${cred.credentialId || 'CRED-VAL-8821'}</div>
      <div><strong>Issued by:</strong> ${cred.issuer || 'placementOS Evaluation Board'}</div>
      <div><strong>Date:</strong> ${cred.unlockedDate || new Date().toISOString().split('T')[0]}</div>
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([certHtml], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `placementOS-Certificate-${cred.credentialId || cred.id}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Error generating certificate download:', err);
    }
  };

  const getRarityBadgeVariant = (rarity: string): 'verified' | 'positive' | 'warning' | 'neutral' => {
    if (rarity === 'Legendary') return 'verified';
    if (rarity === 'Epic') return 'positive';
    if (rarity === 'Rare') return 'warning';
    return 'neutral';
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr.split('T')[0];
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr.split('T')[0];
    }
  };

  return (
    <div className="space-y-6 text-left font-sans">
      
      {/* HEADER BANNER & HIGHLIGHT METRICS */}
      <div className="p-6 sm:p-7 bg-white border border-[#14131F]/8 rounded-2xl space-y-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#14131F]/8 pb-5">
          <div className="space-y-1">
            <SectionHeading
              level="h1"
              title="Badges & Credentials"
              subtitle={`Verified competency achievements and official micro-credentials for ${activeStudentName}.`}
              badge={
                <Badge variant="verified" size="sm" icon={<Award className="w-3.5 h-3.5 text-[#4338CA]" />}>
                  Achievement Matrix
                </Badge>
              }
            />
          </div>

          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#4338CA]/10 text-[#4338CA] border border-[#4338CA]/20 select-none">
              <Trophy className="w-3.5 h-3.5 text-[#4338CA]" />
              Level 5 Candidate
            </span>

            <Button
              size="sm"
              variant="secondary"
              onClick={fetchAllData}
              disabled={loading}
              title="Sync latest badges"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            />
          </div>
        </div>

        {/* TOP QUICK METRICS BAR */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5">
            <span className="text-xs text-[#14131F]/60 font-sans block">Badges Unlocked</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#14131F]">{unlockedCount} / {totalCount}</span>
              <span className="text-xs text-[#4338CA] font-semibold">{unlockedPct}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#4338CA] rounded-full transition-all duration-300" style={{ width: `${unlockedPct}%` }} />
            </div>
          </div>

          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5">
            <span className="text-xs text-[#14131F]/60 font-sans block">Achievement XP</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#14131F]">{totalXp} XP</span>
              <span className="text-xs text-[#14131F]/60 font-medium">Rank #8</span>
            </div>
            <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#4338CA] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, (totalXp / 2500) * 100)}%` }} />
            </div>
          </div>

          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5">
            <span className="text-xs text-[#14131F]/60 font-sans block">Micro-Credentials</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#14131F]">{certifiedMicroCredentials} Certified</span>
              <span className="text-xs text-[#4338CA] font-medium">Industry Standard</span>
            </div>
            <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#4338CA] rounded-full transition-all duration-300" style={{ width: `${Math.min(100, certifiedMicroCredentials * 33)}%` }} />
            </div>
          </div>

          <div className="p-4 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 space-y-1.5">
            <span className="text-xs text-[#14131F]/60 font-sans block">Practice Streak</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-display font-bold text-[#14131F]">14 Days</span>
              <span className="text-xs text-[#14131F] font-semibold flex items-center gap-1 bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40 px-2 py-0.5 rounded-full select-none">
                <Flame className="w-3 h-3 text-[#14131F]" /> Active
              </span>
            </div>
            <div className="w-full h-1.5 bg-[#14131F]/8 rounded-full overflow-hidden">
              <div className="h-full bg-[#A3E635] rounded-full transition-all duration-300" style={{ width: '100%' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ERROR NOTICE WITH RETRY */}
      {fetchError && (
        <div className="p-4 bg-[#FB7185]/10 border border-[#FB7185]/30 rounded-2xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-sans">
          <div className="flex items-center gap-2.5 text-[#FB7185]">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#FB7185]" />
            <span className="font-medium">{fetchError}</span>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={fetchAllData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Retry Sync
          </Button>
        </div>
      )}

      {/* FILTER, SEARCH AND TAB CONTROLS */}
      <div className="p-5 sm:p-6 bg-white border border-[#14131F]/8 rounded-2xl space-y-4 font-sans shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-[#14131F]/8 pb-4">
          
          {/* Status Tab Filters (PlacementOS Segmented Pill Control) */}
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#FAFAF8] rounded-xl border border-[#14131F]/8 shrink-0">
            {[
              { id: 'all', label: 'All Badges', count: totalCount },
              { id: 'unlocked', label: 'Unlocked', count: unlockedCount },
              { id: 'locked', label: 'In Progress', count: totalCount - unlockedCount },
              { id: 'credentials', label: 'Micro-Credentials', count: badgesList.filter(b => b.category === 'Micro-Credentials').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#14131F] shadow-xs border border-[#14131F]/10'
                    : 'text-[#14131F]/60 hover:text-[#14131F]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    statusFilter === tab.id
                      ? 'bg-[#4338CA]/10 text-[#4338CA]'
                      : 'bg-[#14131F]/5 text-[#14131F]/60'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar & Reset */}
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#14131F]/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search badges, skills, credentials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#FAFAF8] border border-[#14131F]/12 rounded-xl pl-9 pr-8 py-2 text-xs text-[#14131F] outline-none focus:border-[#4338CA] focus:bg-white placeholder:text-[#14131F]/40 font-sans transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#14131F]/40 hover:text-[#14131F] cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {hasActiveFilters && (
              <Button
                size="sm"
                variant="secondary"
                onClick={handleResetFilters}
                icon={<RotateCcw className="w-3.5 h-3.5" />}
                title="Reset all filters"
              >
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-sans no-scrollbar">
          <span className="text-[#14131F]/60 font-medium text-xs shrink-0 mr-1 flex items-center gap-1.5">
            <span>Category:</span>
          </span>
          {[
            'all',
            'DSA & Algorithms',
            'AI Interview & Speech',
            'System Design',
            'Consistency & Community',
            'Micro-Credentials'
          ].map((cat) => {
            const isSelected = filterCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all shrink-0 border select-none ${
                  isSelected
                    ? 'bg-[#4338CA] text-white border-[#4338CA] shadow-xs font-semibold'
                    : 'bg-[#FAFAF8] text-[#14131F]/70 hover:text-[#14131F] border-[#14131F]/10 hover:border-[#14131F]/25'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* LOADING SKELETON */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="p-6 bg-white border border-[#14131F]/8 rounded-2xl space-y-4 animate-pulse shadow-xs"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 bg-[#14131F]/10 rounded-xl" />
                  <div className="h-5 w-16 bg-[#14131F]/10 rounded-full" />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-32 bg-[#14131F]/10 rounded" />
                  <div className="h-3 w-48 bg-[#14131F]/8 rounded" />
                </div>
                <div className="h-10 w-full bg-[#14131F]/5 rounded-xl pt-2" />
              </div>
            ))}
          </div>
        )}

        {/* BADGES & CREDENTIALS GRID — Distinct High-Value Card Treatment */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-1">
            {filteredBadges.map((badge) => {
              const isEarned = badge.unlocked;
              const isMicroCred = badge.category === 'Micro-Credentials';

              return (
                <div
                  key={badge.id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 text-left ${
                    isEarned
                      ? 'bg-white border-[#14131F]/10 hover:border-[#4338CA]/35 shadow-xs'
                      : badge.comingSoon
                      ? 'bg-[#FAFAF8] border-[#14131F]/8 opacity-75'
                      : 'bg-[#FAFAF8] border-[#14131F]/8 hover:border-[#14131F]/20'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Visual Mark + Status Verification Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 transition-transform ${
                          isEarned
                            ? 'bg-white border border-[#14131F]/12 shadow-2xs'
                            : 'bg-white border border-[#14131F]/8 opacity-75'
                        }`}
                      >
                        {badge.icon}
                      </div>
                      
                      <div className="flex flex-col items-end gap-1.5">
                        {isEarned ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40 select-none">
                            <Check className="w-3 h-3 stroke-[3]" /> Verified
                          </span>
                        ) : badge.comingSoon ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#14131F]/5 text-[#14131F]/60 border border-[#14131F]/8 select-none">
                            <Lock className="w-2.5 h-2.5 text-[#14131F]/40" /> Planned
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#14131F]/5 text-[#14131F]/65 border border-[#14131F]/8 select-none">
                            <Lock className="w-3 h-3 text-[#14131F]/40" /> In Progress
                          </span>
                        )}

                        <Badge variant={getRarityBadgeVariant(badge.rarity)} size="sm">
                          {badge.rarity}
                        </Badge>
                      </div>
                    </div>

                    {/* Middle: Title, Category & Description */}
                    <div className="space-y-1">
                      <h3 className="font-display font-bold text-[#14131F] text-base leading-snug">
                        {badge.title}
                      </h3>
                      <div className="text-[11px] font-medium text-[#4338CA]">
                        {badge.category}
                      </div>
                      <p className="text-xs text-[#14131F]/65 font-sans leading-relaxed pt-0.5">
                        {badge.description}
                      </p>
                    </div>

                    {/* Issuer note for Micro-Credentials */}
                    {isMicroCred && badge.issuer && (
                      <div className="flex items-center gap-1.5 text-[11px] text-[#14131F]/60 font-sans pt-0.5">
                        <GraduationCap className="w-3 h-3 text-[#4338CA] shrink-0" />
                        <span className="truncate">{badge.issuer}</span>
                      </div>
                    )}

                    {/* Validated Competencies Tags */}
                    {badge.skillsValidated && badge.skillsValidated.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {badge.skillsValidated.map((skill, sIdx) => (
                          <span
                            key={sIdx}
                            className={`text-[11px] px-2 py-0.5 rounded-md font-sans font-medium ${
                              isEarned
                                ? 'bg-[#14131F]/5 text-[#14131F]/75 border border-[#14131F]/5'
                                : 'bg-[#14131F]/5 text-[#14131F]/60'
                            }`}
                          >
                            ✓ {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Footer State */}
                  {isEarned ? (
                    <div className="pt-3 border-t border-[#14131F]/8 space-y-2.5 text-xs font-sans">
                      <div className="flex items-center justify-between text-[#14131F]/60 text-[11px]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-[#14131F]/40" />
                          <span>Earned {formatDate(badge.unlockedDate)}</span>
                        </span>
                        {badge.credentialId && (
                          <span className="font-mono text-[10px] text-[#14131F]/70 font-semibold truncate max-w-[120px]">
                            {badge.credentialId}
                          </span>
                        )}
                      </div>

                      <Button
                        variant={isMicroCred ? 'primary' : 'secondary'}
                        size="sm"
                        className="w-full"
                        onClick={() => setSelectedCredential(badge)}
                        icon={isMicroCred ? <ShieldCheck className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                      >
                        {isMicroCred ? 'View Official Certificate' : 'View Credential Details'}
                      </Button>
                    </div>
                  ) : badge.comingSoon ? (
                    <div className="pt-3 border-t border-[#14131F]/8 space-y-1.5 text-xs font-sans">
                      <div className="flex items-center justify-between text-[#14131F]/60">
                        <span className="flex items-center gap-1 text-[11px]">
                          <Lock className="w-3 h-3 text-[#14131F]/40" /> Automatic Tracking
                        </span>
                        <span className="text-[11px] font-medium text-[#4338CA]">Upcoming</span>
                      </div>
                    </div>
                  ) : (
                    <div className="pt-3 border-t border-[#14131F]/8 space-y-2 text-xs font-sans">
                      <div className="flex justify-between items-center text-[#14131F]/70 font-medium text-xs">
                        <span className="flex items-center gap-1 text-[11px] text-[#14131F]/60">
                          <Lock className="w-3 h-3 text-[#14131F]/40" /> Unlock Criteria
                        </span>
                        <span className="text-[#14131F] font-semibold text-xs">
                          {badge.progressCurrent || 0} / {badge.progressTarget || 1}
                        </span>
                      </div>
                      <div className="w-full bg-[#14131F]/8 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-[#4338CA] h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.round((((badge.progressCurrent || 0) / (badge.progressTarget || 1)) * 100))
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {/* Clean Invitation Empty State */}
            {filteredBadges.length === 0 && (
              <div className="col-span-full p-10 sm:p-12 text-center bg-white rounded-2xl border border-[#14131F]/8 shadow-xs space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[#FAFAF8] border border-[#14131F]/10 text-[#4338CA] flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 max-w-md mx-auto">
                  <h4 className="text-base font-display font-bold text-[#14131F]">
                    {statusFilter === 'unlocked' && unlockedCount === 0
                      ? 'No Unlocked Badges Yet'
                      : 'No Matching Badges Found'}
                  </h4>
                  <p className="text-xs text-[#14131F]/60 font-sans leading-relaxed">
                    {statusFilter === 'unlocked' && unlockedCount === 0
                      ? 'Complete an AI Mock Interview simulation, practice curated DSA challenges, or build your career roadmap to unlock your first verified badge.'
                      : 'No badges or credentials match your active filter settings. Reset your search criteria to view all available achievements.'}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-3">
                  {statusFilter === 'unlocked' && unlockedCount === 0 ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setStatusFilter('locked')}
                      icon={<Trophy className="w-3.5 h-3.5" />}
                    >
                      View Available In-Progress Badges
                    </Button>
                  ) : (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleResetFilters}
                      icon={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reset All Filters
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: OFFICIAL MICRO-CREDENTIAL / BADGE CERTIFICATE VIEW */}
      {selectedCredential && (
        <div className="fixed inset-0 z-50 bg-[#14131F]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#14131F]/10 p-6 sm:p-8 space-y-6 shadow-xl relative overflow-hidden font-sans">
            
            {/* Modal Top Close */}
            <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#4338CA]" />
                <h3 className="text-lg font-display font-bold text-[#14131F]">
                  {selectedCredential.category === 'Micro-Credentials' ? 'Official Micro-Credential' : 'Verified Badge Certificate'}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCredential(null)}
                className="p-1.5 rounded-lg text-[#14131F]/50 hover:text-[#14131F] hover:bg-[#14131F]/5 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Certificate Body */}
            <div className="p-6 sm:p-8 bg-[#FAFAF8] rounded-xl border border-[#14131F]/10 text-[#14131F] space-y-6 relative">
              <div className="flex items-center justify-between border-b border-[#14131F]/8 pb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#4338CA] flex items-center justify-center text-white font-display font-bold text-base">
                    <GraduationCap className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-display font-bold text-lg text-[#14131F]">placementOS</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#A3E635]/25 text-[#14131F] border border-[#A3E635]/40 select-none">
                  <Check className="w-3 h-3 stroke-[3]" /> Verified Credential
                </span>
              </div>

              <div className="text-center space-y-3 py-2">
                <div className="text-3xl mx-auto w-16 h-16 rounded-2xl bg-white border border-[#14131F]/10 flex items-center justify-center shadow-xs">
                  {selectedCredential.icon}
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-[#14131F]/60 font-sans">This certifies that</p>
                  <h2 className="text-2xl sm:text-3xl font-display font-bold text-[#14131F]">{activeStudentName}</h2>
                  <p className="text-xs text-[#14131F]/60 font-sans">has successfully met all performance benchmarks for</p>
                </div>

                <h3 className="text-xl sm:text-2xl font-display font-bold text-[#4338CA]">{selectedCredential.title}</h3>
                <p className="text-xs text-[#14131F]/65 max-w-lg mx-auto leading-relaxed font-sans">{selectedCredential.description}</p>
              </div>

              {/* Competencies & Issuance ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#14131F]/8 text-xs font-sans">
                <div>
                  <span className="text-[#14131F]/60 block text-xs font-semibold">Validated Competencies</span>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {selectedCredential.skillsValidated?.map((s, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-md bg-[#4338CA]/10 text-[#4338CA] text-xs font-medium">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="sm:text-right space-y-1">
                  <span className="text-[#14131F]/60 block text-xs font-semibold">Verification ID</span>
                  <p className="text-[#14131F] font-mono font-semibold text-sm">{selectedCredential.credentialId || 'CRED-VAL-8821'}</p>
                  <p className="text-[#14131F]/60 text-[11px] font-sans">
                    Issued {formatDate(selectedCredential.unlockedDate)} by {selectedCredential.issuer || 'placementOS Evaluation Engine'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs pt-1 font-sans">
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopyCredential(selectedCredential.credentialId || 'CRED-VAL-8821')}
                  icon={copiedId ? <Check className="w-3.5 h-3.5 text-[#14131F]" /> : <Copy className="w-3.5 h-3.5" />}
                >
                  {copiedId ? 'Copied to Clipboard' : 'Copy Credential ID'}
                </Button>

                {downloadSuccess && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#14131F] bg-[#A3E635]/25 border border-[#A3E635]/40 px-2.5 py-1 rounded-lg animate-fade-in">
                    <Check className="w-3 h-3 stroke-[3]" /> Certificate Downloaded
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedCredential(null)}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadCertificate(selectedCredential)}
                  icon={<Download className="w-3.5 h-3.5" />}
                >
                  Download Certificate
                </Button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
