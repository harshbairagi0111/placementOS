/**
 * PlacementOS Deterministic Skill Gap & Industry Match Engine
 * SIH 2026 Problem Statement 26044
 *
 * Deterministically evaluates a student's assessed skill profile against
 * job postings and industry role requirements without relying on LLM hallucination.
 */

import {
  toCanonicalSkill,
  getCanonicalSkillName,
  calculateProficiencyLevel,
  ProficiencyLevel,
  SkillCategory,
  PROFICIENCY_THRESHOLDS,
} from './skillCatalog';
import { IProfileSkillEntry } from '../models/StudentSkillProfile';

export type SkillImportance = 'required' | 'recommended' | 'optional';
export type SkillGapStatus = 'STRONG' | 'NEEDS_IMPROVEMENT' | 'GAP' | 'NOT_ASSESSED';
export type PriorityLevel = 'High Priority' | 'Medium Priority' | 'Low Priority';

export interface RawSkillRequirement {
  skill: string;
  importance?: SkillImportance | string;
  minimumLevel?: number;
  weight?: number;
}

export interface NormalizedSkillRequirement {
  skill: string;             // Canonical name, e.g. "React", "JavaScript"
  skillId: string;           // Canonical id, e.g. "react"
  category: SkillCategory;   // 'technical' | 'soft'
  importance: SkillImportance;
  minimumLevel: number;      // 0 - 100, default 70 for required, 60 for recommended, 50 for optional
  weight: number;            // 2.0 for required, 1.0 for recommended, 0.5 for optional
}

export interface SkillGapItem {
  skill: string;
  skillId: string;
  category: SkillCategory;
  importance: SkillImportance;
  requiredLevel: number;
  requiredMinimumLevel: number;      // backward compatibility alias
  studentScore: number | null;
  studentProficiency: ProficiencyLevel | 'Unassessed';
  status: SkillGapStatus;
  gap: number;                       // requiredLevel - (studentScore || 0)
  gapDelta: number;                  // backward compatibility alias
  weight: number;
  priority?: PriorityLevel;
  recommendation: string;
}

export interface RoleMatchResult {
  matchPercentage: number | null;    // 0 - 100, or null if no requirements configured
  hasRequirements: boolean;
  totalRequirements: number;
  assessedRequirementsCount: number;
  strengths: SkillGapItem[];         // status === 'STRONG'
  matchedSkills: SkillGapItem[];     // backward compatibility alias
  needsImprovement: SkillGapItem[];  // status === 'NEEDS_IMPROVEMENT'
  improvementSkills: SkillGapItem[]; // backward compatibility alias
  gaps: SkillGapItem[];              // status === 'GAP'
  missingSkills: SkillGapItem[];     // backward compatibility alias
  notAssessed: SkillGapItem[];       // status === 'NOT_ASSESSED'
  notAssessedSkills: SkillGapItem[]; // backward compatibility alias
  prioritySkills: SkillGapItem[];    // ordered by deterministic urgency
  priorityImprovements: SkillGapItem[]; // backward compatibility alias
  message?: string;
}

export interface IndustryRoleDefinition {
  id: string;
  title: string;
  industry: string;
  description: string;
  requirements: NormalizedSkillRequirement[];
}

/**
 * Centralized Single Source of Truth for Skill Gap and Proficiency Thresholds
 * (PlacementOS SIH 2026 Problem Statement 26044)
 */
export const SKILL_GAP_THRESHOLDS = {
  REQUIRED_LEVEL_DEFAULT: 70,
  RECOMMENDED_LEVEL_DEFAULT: 60,
  OPTIONAL_LEVEL_DEFAULT: 50,
  NEEDS_IMPROVEMENT_MIN_SCORE: 50,
  NEEDS_IMPROVEMENT_MAX_GAP: 20,
  STRONG_MIN_SCORE: 70,
  WEIGHT_REQUIRED: 2.0,
  WEIGHT_RECOMMENDED: 1.0,
  WEIGHT_OPTIONAL: 0.5,
} as const;

/**
 * Centralized configurable gap thresholds (backward compatible wrapper)
 */
export const GAP_THRESHOLDS = {
  closeGapDelta: SKILL_GAP_THRESHOLDS.NEEDS_IMPROVEMENT_MAX_GAP,
  defaultRequiredMinLevel: SKILL_GAP_THRESHOLDS.REQUIRED_LEVEL_DEFAULT,
  defaultRecommendedMinLevel: SKILL_GAP_THRESHOLDS.RECOMMENDED_LEVEL_DEFAULT,
  defaultOptionalMinLevel: SKILL_GAP_THRESHOLDS.OPTIONAL_LEVEL_DEFAULT,
  weights: {
    required: SKILL_GAP_THRESHOLDS.WEIGHT_REQUIRED,
    recommended: SKILL_GAP_THRESHOLDS.WEIGHT_RECOMMENDED,
    optional: SKILL_GAP_THRESHOLDS.WEIGHT_OPTIONAL,
  },
};

/**
 * Deterministically classifies a student's skill status based on score and required benchmark level.
 *
 * Rules:
 * - If student has no assessed score -> "NOT_ASSESSED"
 * - gap = requiredLevel - studentScore
 * - if gap <= 0 (studentScore >= requiredLevel) -> "STRONG"
 * - else if studentScore >= NEEDS_IMPROVEMENT_MIN_SCORE (50) AND gap <= NEEDS_IMPROVEMENT_MAX_GAP (20) -> "NEEDS_IMPROVEMENT"
 * - else -> "GAP"
 */
export function classifySkillStatus(
  studentScore: number | null | undefined,
  requiredLevel: number = SKILL_GAP_THRESHOLDS.REQUIRED_LEVEL_DEFAULT
): { status: SkillGapStatus; gap: number } {
  if (
    studentScore === null ||
    studentScore === undefined ||
    typeof studentScore !== 'number' ||
    isNaN(studentScore)
  ) {
    return { status: 'NOT_ASSESSED', gap: requiredLevel };
  }

  const score = Math.max(0, Math.min(100, Math.round(studentScore)));
  const gap = requiredLevel - score;

  if (gap <= 0) {
    return { status: 'STRONG', gap: Math.min(0, gap) };
  }

  if (
    score >= SKILL_GAP_THRESHOLDS.NEEDS_IMPROVEMENT_MIN_SCORE &&
    gap <= SKILL_GAP_THRESHOLDS.NEEDS_IMPROVEMENT_MAX_GAP
  ) {
    return { status: 'NEEDS_IMPROVEMENT', gap };
  }

  return { status: 'GAP', gap };
}

/**
 * Normalizes any skill requirement (string or object) into a canonical structure.
 */
export function normalizeSkillRequirement(
  raw: string | RawSkillRequirement | any
): NormalizedSkillRequirement {
  let skillName = '';
  let importance: SkillImportance = 'required';
  let minimumLevel: number | undefined;
  let customWeight: number | undefined;

  if (typeof raw === 'string') {
    skillName = raw;
  } else if (raw && typeof raw === 'object') {
    skillName = raw.skill || raw.name || raw.skillName || '';
    const rawImportance = raw.importance || raw.priority || raw.type;
    if (rawImportance) {
      const imp = String(rawImportance).toLowerCase();
      if (imp === 'recommended' || imp === 'medium') importance = 'recommended';
      else if (imp === 'optional' || imp === 'low') importance = 'optional';
      else importance = 'required';
    }
    const rawMinLevel = raw.minimumLevel ?? raw.minLevel ?? raw.requiredLevel ?? raw.level;
    if (typeof rawMinLevel === 'number' && !isNaN(rawMinLevel)) {
      minimumLevel = Math.max(0, Math.min(100, Math.round(rawMinLevel)));
    }
    if (typeof raw.weight === 'number' && !isNaN(raw.weight) && raw.weight > 0) {
      customWeight = raw.weight;
    }
  }

  const canonical = toCanonicalSkill(skillName);

  // Set default minimumLevel based on importance if not specified
  if (typeof minimumLevel !== 'number') {
    if (importance === 'required') {
      minimumLevel = SKILL_GAP_THRESHOLDS.REQUIRED_LEVEL_DEFAULT;
    } else if (importance === 'recommended') {
      minimumLevel = SKILL_GAP_THRESHOLDS.RECOMMENDED_LEVEL_DEFAULT;
    } else {
      minimumLevel = SKILL_GAP_THRESHOLDS.OPTIONAL_LEVEL_DEFAULT;
    }
  }

  const weight = customWeight ?? GAP_THRESHOLDS.weights[importance];

  return {
    skill: canonical.name,
    skillId: canonical.id,
    category: canonical.category,
    importance,
    minimumLevel,
    weight,
  };
}

/**
 * Consolidates duplicate skill requirements across raw entries or aliases.
 *
 * Example:
 * Job requires ["JavaScript", "JS", "Javascript"]
 * -> Consolidated into a single canonical requirement "JavaScript".
 * If multiple entries have different importance or minimum levels:
 * - Preserves highest importance: required > recommended > optional
 * - Preserves highest minimumLevel: max(minLevels)
 * - Assigns highest weight
 * - Never double-counts
 */
export function consolidateSkillRequirements(
  rawRequirements: Array<string | RawSkillRequirement | any>
): NormalizedSkillRequirement[] {
  if (!rawRequirements || !Array.isArray(rawRequirements)) return [];

  const importanceRank: Record<SkillImportance, number> = {
    required: 3,
    recommended: 2,
    optional: 1,
  };

  const map = new Map<string, NormalizedSkillRequirement>();

  for (const raw of rawRequirements) {
    if (!raw) continue;
    const norm = normalizeSkillRequirement(raw);
    const key = norm.skillId.toLowerCase();

    const existing = map.get(key);
    if (!existing) {
      map.set(key, norm);
    } else {
      // Duplicate skill encountered
      let finalImportance = existing.importance;
      if (importanceRank[norm.importance] > importanceRank[existing.importance]) {
        finalImportance = norm.importance;
      }

      const finalMinLevel = Math.max(existing.minimumLevel, norm.minimumLevel);
      const finalWeight = Math.max(
        existing.weight,
        norm.weight,
        GAP_THRESHOLDS.weights[finalImportance]
      );

      map.set(key, {
        skill: existing.skill,
        skillId: existing.skillId,
        category: existing.category,
        importance: finalImportance,
        minimumLevel: finalMinLevel,
        weight: finalWeight,
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Evaluates a single skill gap deterministically.
 */
export function calculateSkillGap(
  studentSkill: IProfileSkillEntry | null | undefined,
  requirement: NormalizedSkillRequirement
): SkillGapItem {
  const reqMin = requirement.minimumLevel;
  const rawScore =
    studentSkill && typeof studentSkill.score === 'number' && !isNaN(studentSkill.score)
      ? Math.max(0, Math.min(100, Math.round(studentSkill.score)))
      : null;

  const { status, gap } = classifySkillStatus(rawScore, reqMin);

  const proficiency =
    rawScore !== null
      ? (studentSkill?.proficiencyLevel || calculateProficiencyLevel(rawScore))
      : 'Unassessed';

  let recommendation = '';
  if (status === 'STRONG') {
    recommendation = `Verified strength (${rawScore}% vs ${reqMin}% required). Qualified for recruiter interview rounds.`;
  } else if (status === 'NEEDS_IMPROVEMENT') {
    recommendation = `Within qualifying reach (${rawScore}% vs ${reqMin}% required, gap ${gap}%). Complete targeted practice modules to qualify.`;
  } else if (status === 'GAP') {
    recommendation = `Substantial gap (${rawScore !== null ? `${rawScore}%` : '0%'} vs ${reqMin}% required, gap ${gap}%). Foundational coursework and dedicated test practice needed.`;
  } else {
    recommendation = `Unassessed competency. Take the ${requirement.category === 'technical' ? 'Technical' : 'Soft Skills'} diagnostic assessment to benchmark ${requirement.skill}.`;
  }

  return {
    skill: requirement.skill,
    skillId: requirement.skillId,
    category: requirement.category,
    importance: requirement.importance,
    requiredLevel: reqMin,
    requiredMinimumLevel: reqMin,
    studentScore: rawScore,
    studentProficiency: proficiency,
    status,
    gap,
    gapDelta: gap,
    weight: requirement.weight,
    recommendation,
  };
}

/**
 * Deterministically ranks priority for skill gap remediation:
 * 1. Required + GAP
 * 2. Required + NEEDS_IMPROVEMENT
 * 3. Recommended + GAP
 * 4. Recommended + NEEDS_IMPROVEMENT
 * 5. Not assessed required skills
 * 6. Not assessed recommended skills / Optional
 *
 * Within the same rank, sorted by gap descending (largest gap first), then alphabetical tiebreaker.
 */
export function getPriorityRank(item: SkillGapItem): number {
  if (item.importance === 'required' && item.status === 'GAP') return 1;
  if (item.importance === 'required' && item.status === 'NEEDS_IMPROVEMENT') return 2;
  if (item.importance === 'recommended' && item.status === 'GAP') return 3;
  if (item.importance === 'recommended' && item.status === 'NEEDS_IMPROVEMENT') return 4;
  if (item.importance === 'required' && item.status === 'NOT_ASSESSED') return 5;
  if (item.importance === 'recommended' && item.status === 'NOT_ASSESSED') return 6;
  if (item.status === 'GAP') return 7;
  if (item.status === 'NEEDS_IMPROVEMENT') return 8;
  return 9;
}

/**
 * Calculates overall match percentage and detailed breakdown against a job role.
 *
 * Deterministic weighted formula:
 * Each requirement has weight w_i (Required = 2.0, Recommended = 1.0, Optional = 0.5)
 * Score ratio = min(1.0, studentScore / minimumLevel). Unassessed = 0.
 * Overall match % = (Sum(w_i * ratio) / Sum(w_i)) * 100
 */
export function calculateRoleMatch(
  profileSkills: IProfileSkillEntry[] = [],
  rawRequirements: Array<string | RawSkillRequirement | any> = []
): RoleMatchResult {
  const consolidated = consolidateSkillRequirements(rawRequirements);

  // Edge Case A: Role or job posting has no skill requirements configured
  if (consolidated.length === 0) {
    return {
      matchPercentage: null,
      hasRequirements: false,
      totalRequirements: 0,
      assessedRequirementsCount: 0,
      strengths: [],
      matchedSkills: [],
      needsImprovement: [],
      improvementSkills: [],
      gaps: [],
      missingSkills: [],
      notAssessed: [],
      notAssessedSkills: [],
      prioritySkills: [],
      priorityImprovements: [],
      message: 'No skill requirements configured for this opportunity.',
    };
  }

  // Index student's assessed skills by canonical name and canonical ID for O(1) lookup
  const studentSkillMap = new Map<string, IProfileSkillEntry>();
  for (const s of profileSkills) {
    const canonical = toCanonicalSkill(s.skill);
    studentSkillMap.set(canonical.name.toLowerCase(), s);
    studentSkillMap.set(canonical.id.toLowerCase(), s);
  }

  const strengths: SkillGapItem[] = [];
  const needsImprovement: SkillGapItem[] = [];
  const gaps: SkillGapItem[] = [];
  const notAssessed: SkillGapItem[] = [];

  let weightedScoreSum = 0;
  let totalWeightSum = 0;
  let assessedCount = 0;

  for (const req of consolidated) {
    // Lookup student skill by canonical name or ID
    const studentEntry =
      studentSkillMap.get(req.skill.toLowerCase()) ||
      studentSkillMap.get(req.skillId.toLowerCase());

    const gapItem = calculateSkillGap(studentEntry, req);

    if (gapItem.studentScore !== null) {
      assessedCount += 1;
      const ratio = Math.min(1.0, gapItem.studentScore / req.minimumLevel);
      weightedScoreSum += req.weight * ratio;
    } else {
      // Unassessed counts as 0 ratio
      weightedScoreSum += 0;
    }
    totalWeightSum += req.weight;

    if (gapItem.status === 'STRONG') {
      strengths.push(gapItem);
    } else if (gapItem.status === 'NEEDS_IMPROVEMENT') {
      needsImprovement.push(gapItem);
    } else if (gapItem.status === 'GAP') {
      gaps.push(gapItem);
    } else {
      notAssessed.push(gapItem);
    }
  }

  // Edge Case B & C: Student has no assessed skills, or zero weighted score
  const matchPercentage =
    assessedCount === 0
      ? 0
      : totalWeightSum > 0
      ? Math.round((weightedScoreSum / totalWeightSum) * 100)
      : 0;

  // Build ranked priority improvements deterministically according to Section 11
  const actionableItems = [...gaps, ...needsImprovement, ...notAssessed];

  const prioritySkills = actionableItems.map((item) => {
    const rank = getPriorityRank(item);
    let priority: PriorityLevel = 'Low Priority';
    if (rank <= 2) {
      priority = 'High Priority';
    } else if (rank <= 5) {
      priority = 'Medium Priority';
    } else {
      priority = 'Low Priority';
    }

    return {
      ...item,
      priority,
    };
  });

  // Strict deterministic ordering:
  // 1. Priority rank
  // 2. Gap severity (largest gap first)
  // 3. Alphabetical tiebreaker
  prioritySkills.sort((a, b) => {
    const rankA = getPriorityRank(a);
    const rankB = getPriorityRank(b);
    if (rankA !== rankB) return rankA - rankB;
    if (b.gap !== a.gap) return b.gap - a.gap;
    return a.skill.localeCompare(b.skill);
  });

  const message =
    assessedCount === 0
      ? 'Complete a skill assessment to generate your skill profile.'
      : undefined;

  return {
    matchPercentage,
    hasRequirements: true,
    totalRequirements: consolidated.length,
    assessedRequirementsCount: assessedCount,
    strengths,
    matchedSkills: strengths,
    needsImprovement,
    improvementSkills: needsImprovement,
    gaps,
    missingSkills: gaps,
    notAssessed,
    notAssessedSkills: notAssessed,
    prioritySkills,
    priorityImprovements: prioritySkills,
    message,
  };
}

/**
 * Standard Industry Roles with benchmark requirements (SIH Problem Statement 26044).
 * Provides immediate benchmarking even before campus recruiters publish individual job postings.
 */
export const INDUSTRY_ROLES: IndustryRoleDefinition[] = [
  {
    id: 'frontend_developer',
    title: 'Frontend Developer',
    industry: 'IT / Software',
    description: 'Builds responsive, high-performance web user interfaces using modern frameworks, state management, and accessible styling.',
    requirements: [
      normalizeSkillRequirement({ skill: 'JavaScript', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'React', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'HTML/CSS', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Git/GitHub', importance: 'required', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'REST APIs', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Programming Fundamentals', importance: 'recommended', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'recommended', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Communication', importance: 'optional', minimumLevel: 65 }),
    ],
  },
  {
    id: 'backend_developer',
    title: 'Backend Developer',
    industry: 'IT / Software',
    description: 'Designs scalable server-side systems, RESTful microservices, relational/NoSQL schemas, and secure API architectures.',
    requirements: [
      normalizeSkillRequirement({ skill: 'Node.js', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'SQL', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'REST APIs', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Database Management', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Data Structures & Algorithms', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'MongoDB', importance: 'recommended', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'Git/GitHub', importance: 'recommended', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'System Design', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'recommended', minimumLevel: 70 }),
    ],
  },
  {
    id: 'fullstack_developer',
    title: 'Full Stack Developer',
    industry: 'IT / Software',
    description: 'End-to-end web engineering covering browser interfaces, server runtimes, distributed databases, and cloud deployments.',
    requirements: [
      normalizeSkillRequirement({ skill: 'JavaScript', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'React', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Node.js', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'SQL', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'REST APIs', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Git/GitHub', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Database Management', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'System Design', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'recommended', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Teamwork', importance: 'optional', minimumLevel: 65 }),
    ],
  },
  {
    id: 'software_engineer_sde',
    title: 'Software Development Engineer (SDE / Core)',
    industry: 'IT / Software',
    description: 'Core product engineering focusing on algorithmic efficiency, object-oriented design, OS internals, and systems programming.',
    requirements: [
      normalizeSkillRequirement({ skill: 'Data Structures & Algorithms', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'Programming Fundamentals', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'Object-Oriented Programming', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'SQL', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Operating Systems', importance: 'required', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Computer Networks', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'System Design', importance: 'recommended', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'recommended', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'Communication', importance: 'optional', minimumLevel: 65 }),
    ],
  },
  {
    id: 'data_engineer',
    title: 'Data Engineer / Analyst',
    industry: 'IT / Software',
    description: 'Architects data pipelines, warehousing queries, ETL workflows, and statistical modeling with relational and NoSQL databases.',
    requirements: [
      normalizeSkillRequirement({ skill: 'Python', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'SQL', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'Database Management', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Data Structures & Algorithms', importance: 'recommended', minimumLevel: 65 }),
      normalizeSkillRequirement({ skill: 'Cloud Fundamentals', importance: 'recommended', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'Critical Thinking', importance: 'optional', minimumLevel: 65 }),
    ],
  },
  {
    id: 'devops_cloud_engineer',
    title: 'DevOps & Cloud Systems Engineer',
    industry: 'IT / Software',
    description: 'Focuses on CI/CD pipelines, containerization, cloud infrastructure, network protocols, and high availability systems.',
    requirements: [
      normalizeSkillRequirement({ skill: 'Cloud Fundamentals', importance: 'required', minimumLevel: 75 }),
      normalizeSkillRequirement({ skill: 'Operating Systems', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Computer Networks', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Git/GitHub', importance: 'required', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Python', importance: 'recommended', minimumLevel: 60 }),
      normalizeSkillRequirement({ skill: 'Problem Solving', importance: 'recommended', minimumLevel: 70 }),
      normalizeSkillRequirement({ skill: 'Time Management', importance: 'optional', minimumLevel: 65 }),
    ],
  },
];

/**
 * Finds the closest matching industry role definition by role name or returns default SDE.
 */
export function getIndustryRoleByName(roleName: string = ''): IndustryRoleDefinition {
  if (!roleName) return INDUSTRY_ROLES[0];

  const clean = roleName.trim().toLowerCase();

  // Try exact id or title match
  for (const role of INDUSTRY_ROLES) {
    if (role.id === clean || role.title.toLowerCase() === clean) {
      return role;
    }
  }

  // Try substring match
  for (const role of INDUSTRY_ROLES) {
    if (clean.includes('frontend') || clean.includes('ui') || clean.includes('web')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'frontend_developer') || INDUSTRY_ROLES[0];
    }
    if (clean.includes('backend') || clean.includes('node') || clean.includes('server')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'backend_developer') || INDUSTRY_ROLES[1];
    }
    if (clean.includes('full') || clean.includes('stack')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'fullstack_developer') || INDUSTRY_ROLES[2];
    }
    if (clean.includes('data') || clean.includes('analyst') || clean.includes('ml')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'data_engineer') || INDUSTRY_ROLES[4];
    }
    if (clean.includes('devops') || clean.includes('cloud') || clean.includes('infra')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'devops_cloud_engineer') || INDUSTRY_ROLES[5];
    }
    if (clean.includes('sde') || clean.includes('software') || clean.includes('engineer')) {
      return INDUSTRY_ROLES.find((r) => r.id === 'software_engineer_sde') || INDUSTRY_ROLES[3];
    }
  }

  return INDUSTRY_ROLES[0];
}

/**
 * ============================================================================
 * Centralized Job & Internship Recommendation Engine (PlacementOS FIX #3)
 * Reuses calculateRoleMatch and canonical taxonomy without secondary algorithms.
 * ============================================================================
 */

export type MatchCategory =
  | 'HIGH_MATCH'
  | 'GOOD_MATCH'
  | 'POTENTIAL_MATCH'
  | 'LOW_MATCH'
  | 'NOT_CONFIGURED';

export const MATCH_CATEGORY_THRESHOLDS = {
  HIGH_MATCH: 80,
  GOOD_MATCH: 65,
  POTENTIAL_MATCH: 50,
} as const;

export const MATCH_CATEGORY_LABELS: Record<MatchCategory, string> = {
  HIGH_MATCH: 'High Match',
  GOOD_MATCH: 'Good Match',
  POTENTIAL_MATCH: 'Potential Match',
  LOW_MATCH: 'Low Match',
  NOT_CONFIGURED: 'Requirements Not Configured',
};

/**
 * Classifies an opportunity match percentage into standardized presentation categories.
 */
export function getMatchCategory(matchPercentage: number | null): MatchCategory {
  if (matchPercentage === null) return 'NOT_CONFIGURED';
  if (matchPercentage >= MATCH_CATEGORY_THRESHOLDS.HIGH_MATCH) return 'HIGH_MATCH';
  if (matchPercentage >= MATCH_CATEGORY_THRESHOLDS.GOOD_MATCH) return 'GOOD_MATCH';
  if (matchPercentage >= MATCH_CATEGORY_THRESHOLDS.POTENTIAL_MATCH) return 'POTENTIAL_MATCH';
  return 'LOW_MATCH';
}

/**
 * Checks if a candidate's targetRole aligns with an opportunity title/description.
 * Used strictly as a tiebreaker and relevance signal — NEVER overrides skill match.
 */
export function isRoleRelevant(
  targetRole: string | undefined | null,
  opportunityTitle: string = '',
  opportunityDescription: string = ''
): boolean {
  if (!targetRole || !targetRole.trim() || !opportunityTitle) return false;
  const cleanTarget = targetRole.trim().toLowerCase();
  const cleanTitle = opportunityTitle.trim().toLowerCase();

  if (cleanTitle.includes(cleanTarget) || cleanTarget.includes(cleanTitle)) {
    return true;
  }

  const stopWords = new Set(['and', 'for', 'the', 'with', 'intern', 'trainee', 'engineer', 'developer', 'associate']);
  const tokens = cleanTarget
    .split(/[\s/,\-_]+/)
    .filter((t) => t.length > 2 && !stopWords.has(t));

  if (tokens.length === 0) {
    // If targetRole only contains generic tokens like "developer"
    return cleanTitle.includes(cleanTarget);
  }

  const matchInTitle = tokens.some((token) => cleanTitle.includes(token));
  if (matchInTitle) return true;

  const cleanDesc = (opportunityDescription || '').toLowerCase();
  const matchCountInDesc = tokens.filter((token) => cleanDesc.includes(token)).length;
  return matchCountInDesc >= 2;
}

/**
 * Deterministically generates an explainable recommendation narrative from actual matching data.
 * Zero LLM hallucination: derived strictly from verified strengths, gaps, and assessment states.
 */
export function generateRecommendationExplanation(
  matchResult: RoleMatchResult,
  options?: {
    targetRole?: string | null;
    opportunityTitle?: string;
    hasAssessedSkills?: boolean;
  }
): string {
  if (!matchResult.hasRequirements) {
    return 'Skill requirements not configured for this opportunity.';
  }

  if (options?.hasAssessedSkills === false || matchResult.assessedRequirementsCount === 0) {
    return 'Complete your skill assessment to get personalized job and internship recommendations.';
  }

  const strengths = matchResult.strengths || [];
  const needsImp = matchResult.needsImprovement || [];
  const gaps = matchResult.gaps || [];
  const notAssessed = matchResult.notAssessed || [];
  const pct = matchResult.matchPercentage ?? 0;

  const formatSkills = (list: SkillGapItem[], max: number = 3): string => {
    const names = list.slice(0, max).map((item) => item.skill);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} and ${names[2]}`;
  };

  if (pct >= 80) {
    if (strengths.length > 0) {
      return `Recommended because your ${formatSkills(strengths)} skills match the core requirements of this role.`;
    }
    return 'Recommended because your overall assessed competencies strongly match the requirements of this role.';
  }

  if (pct >= 65) {
    if (strengths.length > 0 && (needsImp.length > 0 || gaps.length > 0)) {
      const improveSkills = needsImp.length > 0 ? needsImp : gaps;
      return `Your profile matches the core requirements, but you should improve ${formatSkills(improveSkills)}.`;
    }
    if (strengths.length > 0) {
      return `Good match with your assessed skills in ${formatSkills(strengths)}.`;
    }
    if (notAssessed.length > 0) {
      return `Complete assessments for ${formatSkills(notAssessed)} to improve the accuracy of this match.`;
    }
    return 'Good overall match against benchmark role requirements.';
  }

  if (pct >= 50) {
    if (notAssessed.length >= 2 && strengths.length <= 1) {
      return `Complete assessments for ${formatSkills(notAssessed)} to improve the accuracy of this match.`;
    }
    const toImprove = [...needsImp, ...gaps];
    if (toImprove.length > 0) {
      return `Potential match. Improving your ${formatSkills(toImprove)} skills will boost your candidacy for this role.`;
    }
    return 'Potential match based on current foundational competencies.';
  }

  // pct < 50
  if (notAssessed.length > 0 && strengths.length === 0 && needsImp.length === 0) {
    return `Complete assessments for ${formatSkills(notAssessed)} to improve the accuracy of this match.`;
  }
  const majorGaps = [...gaps, ...needsImp];
  if (majorGaps.length > 0) {
    return `Currently low match due to foundational gaps in ${formatSkills(majorGaps)}. Target these skills to qualify.`;
  }
  return 'Significant skill development needed to meet the requirements of this opportunity.';
}

export interface OpportunityRecommendation {
  opportunityId: string;
  id: string; // alias
  title: string;
  company: string;
  type: 'Job' | 'Internship' | 'Apprenticeship';
  opportunityType: 'Job' | 'Internship' | 'Apprenticeship';
  location?: string;
  ctc?: string;
  stipend?: string;
  duration?: string;
  description?: string;
  cutoffPct?: number;
  openPositions?: number;
  status?: string;
  createdAt?: Date | string;
  requiredSkills?: any[];
  applicantsCount?: number;

  // Matching metrics calculated strictly via calculateRoleMatch
  matchPercentage: number | null;
  hasRequirements: boolean;
  matchCategory: MatchCategory;
  matchCategoryLabel: string;
  totalRequirements: number;
  assessedRequirementsCount: number;

  // Scoped breakdown
  strengths: string[];
  needsImprovement: string[];
  gaps: string[];
  notAssessed: string[];
  prioritySkills: string[];
  detailedBreakdown: SkillGapItem[];

  // Deterministic narrative & ranking signals
  explanation: string;
  targetRoleMatch: boolean;
  requiredSkillsCoverageRatio: number; // tie-breaker: ratio of satisfied required skills
  requiredStrongCount: number;

  // Application state
  alreadyApplied: boolean;
  applicationStatus: string;
  appliedAt?: string | Date;
}

/**
 * Evaluates an opportunity against the student's assessed skill profile.
 * Delegates all math to calculateRoleMatch — NO secondary matching formula.
 */
export function evaluateOpportunityRecommendation(
  studentAssessedSkills: IProfileSkillEntry[],
  opportunity: any,
  options?: {
    targetRole?: string | null;
    application?: any;
    hasAssessedSkills?: boolean;
  }
): OpportunityRecommendation {
  const oppId = String(opportunity._id || opportunity.id || '');
  const rawRequirements = Array.isArray(opportunity.requiredSkills) ? opportunity.requiredSkills : [];

  // Centralized evaluation
  const matchResult = calculateRoleMatch(studentAssessedSkills, rawRequirements);

  const matchCategory = getMatchCategory(matchResult.matchPercentage);
  const matchCategoryLabel = MATCH_CATEGORY_LABELS[matchCategory];

  // Detailed breakdown combines all classified requirement items
  const detailedBreakdown = [
    ...matchResult.strengths,
    ...matchResult.needsImprovement,
    ...matchResult.gaps,
    ...matchResult.notAssessed,
  ];

  // Tie-breaker metrics: coverage among REQUIRED skills
  const requiredItems = detailedBreakdown.filter((item) => item.importance === 'required');
  let requiredSkillsCoverageRatio = 0;
  let requiredStrongCount = 0;

  if (requiredItems.length > 0) {
    let sumRatios = 0;
    for (const item of requiredItems) {
      if (item.status === 'STRONG') {
        requiredStrongCount += 1;
        sumRatios += 1.0;
      } else if (item.studentScore !== null && item.studentScore > 0) {
        sumRatios += Math.min(1.0, item.studentScore / item.requiredLevel);
      }
    }
    requiredSkillsCoverageRatio = sumRatios / requiredItems.length;
  } else if (matchResult.hasRequirements) {
    // If no explicit required skills, fallback to recommended ratio
    requiredSkillsCoverageRatio = matchResult.matchPercentage ? matchResult.matchPercentage / 100 : 0;
  }

  const targetRoleMatch = isRoleRelevant(options?.targetRole, opportunity.title, opportunity.description);

  const explanation = generateRecommendationExplanation(matchResult, {
    targetRole: options?.targetRole,
    opportunityTitle: opportunity.title,
    hasAssessedSkills: options?.hasAssessedSkills ?? (studentAssessedSkills.length > 0),
  });

  const existingApp = options?.application;
  const alreadyApplied = Boolean(existingApp || opportunity.alreadyApplied);
  const applicationStatus = existingApp ? existingApp.status || 'Applied' : 'NOT_APPLIED';

  const type = opportunity.type || 'Job';

  return {
    opportunityId: oppId,
    id: oppId,
    title: opportunity.title || 'Untitled Opportunity',
    company: opportunity.company || 'Confidential Enterprise',
    type,
    opportunityType: type,
    location: opportunity.location || 'Remote / Hybrid',
    ctc: opportunity.ctc,
    stipend: opportunity.stipend,
    duration: opportunity.duration,
    description: opportunity.description || '',
    cutoffPct: opportunity.cutoffPct,
    openPositions: opportunity.openPositions,
    status: opportunity.status || 'Active',
    createdAt: opportunity.createdAt,
    requiredSkills: rawRequirements,
    applicantsCount: opportunity.applicantsCount || 0,

    matchPercentage: matchResult.matchPercentage,
    hasRequirements: matchResult.hasRequirements,
    matchCategory,
    matchCategoryLabel,
    totalRequirements: matchResult.totalRequirements,
    assessedRequirementsCount: matchResult.assessedRequirementsCount,

    strengths: matchResult.strengths.map((s) => s.skill),
    needsImprovement: matchResult.needsImprovement.map((s) => s.skill),
    gaps: matchResult.gaps.map((s) => s.skill),
    notAssessed: matchResult.notAssessed.map((s) => s.skill),
    prioritySkills: matchResult.prioritySkills.map((s) => s.skill),
    detailedBreakdown,

    explanation,
    targetRoleMatch,
    requiredSkillsCoverageRatio,
    requiredStrongCount,

    alreadyApplied,
    applicationStatus,
    appliedAt: existingApp?.appliedAt,
  };
}

/**
 * Deterministically ranks opportunity recommendations according to Section 4:
 * 1. Match percentage descending (opportunities with requirements first, then unconfigured)
 * 2. If tied, stronger required-skill coverage ratio & strong required count
 * 3. If still tied, target role relevance
 * 4. If still tied, stable deterministic ordering (title, then ID)
 */
export function rankOpportunityRecommendations(
  recommendations: OpportunityRecommendation[]
): OpportunityRecommendation[] {
  return [...recommendations].sort((a, b) => {
    // 1. Opportunities with configured requirements vs unconfigured
    const aHasReq = a.hasRequirements && a.matchPercentage !== null;
    const bHasReq = b.hasRequirements && b.matchPercentage !== null;

    if (aHasReq && !bHasReq) return -1;
    if (!aHasReq && bHasReq) return 1;

    // If both have match percentage, sort by match percentage descending
    if (aHasReq && bHasReq) {
      const aPct = a.matchPercentage ?? 0;
      const bPct = b.matchPercentage ?? 0;
      if (bPct !== aPct) {
        return bPct - aPct;
      }

      // 2. Tiebreaker 1: Stronger required-skill coverage ratio
      if (Math.abs(b.requiredSkillsCoverageRatio - a.requiredSkillsCoverageRatio) > 0.001) {
        return b.requiredSkillsCoverageRatio - a.requiredSkillsCoverageRatio;
      }

      // 2b. Tiebreaker: Count of required skills that are STRONG
      if (b.requiredStrongCount !== a.requiredStrongCount) {
        return b.requiredStrongCount - a.requiredStrongCount;
      }

      // 3. Tiebreaker 2: Target role relevance
      if (a.targetRoleMatch !== b.targetRoleMatch) {
        return a.targetRoleMatch ? -1 : 1;
      }
    }

    // 4. Stable deterministic ordering
    const titleCmp = (a.title || '').localeCompare(b.title || '');
    if (titleCmp !== 0) return titleCmp;
    return String(a.opportunityId || '').localeCompare(String(b.opportunityId || ''));
  });
}

/**
 * ============================================================================
 * Centralized Recruiter Candidate Ranking Engine (PlacementOS FIX #4)
 * Reuses calculateRoleMatch and canonical taxonomy without secondary algorithms.
 * ============================================================================
 */

export interface CandidateJobMatchItem {
  id: string;
  _id: string;
  candidateId: string;
  name: string;
  college?: string;
  role?: string;
  targetRole?: string;
  readinessScore?: number;
  overallScore?: number;
  dsaSolved?: number;
  badgeCount?: number;
  atsMatch?: number;
  skills?: string[];

  // Matching metrics calculated strictly via calculateRoleMatch
  matchPercentage: number | null;
  hasRequirements: boolean;
  matchCategory: MatchCategory;
  matchCategoryLabel: string;
  totalRequirements: number;
  assessedRequirementsCount: number;

  // Scoped breakdown
  strengths: string[];
  needsImprovement: string[];
  gaps: string[];
  notAssessed: string[];
  prioritySkills: string[];
  detailedBreakdown: SkillGapItem[];

  // Deterministic narrative & ranking signals
  explanation: string;
  requiredSkillsCoverageRatio: number;
  requiredStrongCount: number;

  // Application link
  hasApplied: boolean;
  applicationId?: string;
  applicationStatus?: string;
  appliedAt?: string | Date;
}

/**
 * Deterministically generates an explainable recruiter-facing narrative from actual candidate matching data.
 * Zero LLM hallucination: derived strictly from verified strengths, gaps, and assessment states.
 */
export function generateCandidateRecruiterExplanation(
  matchResult: RoleMatchResult,
  options?: {
    candidateName?: string;
    hasAssessedSkills?: boolean;
  }
): string {
  if (!matchResult.hasRequirements) {
    return 'No skill requirements configured for this job opportunity.';
  }

  if (options?.hasAssessedSkills === false || matchResult.assessedRequirementsCount === 0) {
    return 'Candidate has not completed diagnostic skill assessments yet.';
  }

  const strengths = matchResult.strengths || [];
  const needsImp = matchResult.needsImprovement || [];
  const gaps = matchResult.gaps || [];
  const notAssessed = matchResult.notAssessed || [];
  const pct = matchResult.matchPercentage ?? 0;

  const formatSkills = (list: SkillGapItem[], max: number = 3): string => {
    const names = list.slice(0, max).map((item) => item.skill);
    if (names.length === 0) return '';
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} and ${names[1]}`;
    return `${names[0]}, ${names[1]} and ${names[2]}`;
  };

  if (pct >= 80) {
    if (strengths.length > 0) {
      return `Top candidate: verified strengths in ${formatSkills(strengths)} satisfy core role benchmarks.`;
    }
    return 'Top candidate: overall assessed competencies strongly meet the requirements of this role.';
  }

  if (pct >= 65) {
    if (strengths.length > 0 && (needsImp.length > 0 || gaps.length > 0)) {
      const improveSkills = needsImp.length > 0 ? needsImp : gaps;
      return `Strong candidate: matches core requirements with ${formatSkills(strengths)}, with minor gap in ${formatSkills(improveSkills)}.`;
    }
    if (strengths.length > 0) {
      return `Good candidate match with verified competency in ${formatSkills(strengths)}.`;
    }
    return 'Solid alignment with benchmark role competencies.';
  }

  if (pct >= 50) {
    if (notAssessed.length >= 2 && strengths.length <= 1) {
      return `Partially assessed: candidate has unassessed competencies in ${formatSkills(notAssessed)}.`;
    }
    const toImprove = [...needsImp, ...gaps];
    if (toImprove.length > 0) {
      return `Moderate match: candidate satisfies basic benchmarks but requires development in ${formatSkills(toImprove)}.`;
    }
    return 'Foundational match against required competencies.';
  }

  if (notAssessed.length > 0 && strengths.length === 0 && needsImp.length === 0) {
    return `Unassessed for core requirements: pending assessments for ${formatSkills(notAssessed)}.`;
  }
  const majorGaps = [...gaps, ...needsImp];
  if (majorGaps.length > 0) {
    return `Low match: significant skill gap in ${formatSkills(majorGaps)} for this role.`;
  }
  return 'Candidate skill profile does not currently match this role.';
}

/**
 * Evaluates a candidate against a job opportunity's skill requirements.
 * Reuses calculateRoleMatch — NO secondary matching formula.
 */
export function evaluateCandidateJobMatch(
  profileSkills: IProfileSkillEntry[],
  jobRequirements: any[],
  candidateInfo: {
    id: string;
    name: string;
    college?: string;
    role?: string;
    readinessScore?: number;
    dsaSolved?: number;
    badgeCount?: number;
    atsMatch?: number;
    skills?: string[];
  },
  options?: {
    hasAssessedSkills?: boolean;
    application?: any;
  }
): CandidateJobMatchItem {
  const matchResult = calculateRoleMatch(profileSkills, jobRequirements);
  const matchCategory = getMatchCategory(matchResult.matchPercentage);
  const matchCategoryLabel = MATCH_CATEGORY_LABELS[matchCategory];

  const detailedBreakdown = [
    ...matchResult.strengths,
    ...matchResult.needsImprovement,
    ...matchResult.gaps,
    ...matchResult.notAssessed,
  ];

  // Tie-breaker metrics: coverage among REQUIRED skills
  const requiredItems = detailedBreakdown.filter((item) => item.importance === 'required');
  let requiredSkillsCoverageRatio = 0;
  let requiredStrongCount = 0;

  if (requiredItems.length > 0) {
    let sumRatios = 0;
    for (const item of requiredItems) {
      if (item.status === 'STRONG') {
        requiredStrongCount += 1;
        sumRatios += 1.0;
      } else if (item.studentScore !== null && item.studentScore > 0) {
        sumRatios += Math.min(1.0, item.studentScore / item.requiredLevel);
      }
    }
    requiredSkillsCoverageRatio = sumRatios / requiredItems.length;
  } else if (matchResult.hasRequirements) {
    requiredSkillsCoverageRatio = matchResult.matchPercentage ? matchResult.matchPercentage / 100 : 0;
  }

  const explanation = generateCandidateRecruiterExplanation(matchResult, {
    candidateName: candidateInfo.name,
    hasAssessedSkills: options?.hasAssessedSkills ?? (profileSkills.length > 0),
  });

  const existingApp = options?.application;
  const hasApplied = Boolean(existingApp);
  const applicationStatus = existingApp ? existingApp.status || 'Applied' : undefined;
  const applicationId = existingApp ? String(existingApp._id || existingApp.id || '') : undefined;
  const appliedAt = existingApp?.appliedAt || existingApp?.createdAt;

  return {
    id: candidateInfo.id,
    _id: candidateInfo.id,
    candidateId: candidateInfo.id,
    name: candidateInfo.name,
    college: candidateInfo.college,
    role: candidateInfo.role,
    targetRole: candidateInfo.role,
    readinessScore: candidateInfo.readinessScore,
    overallScore: candidateInfo.readinessScore,
    dsaSolved: candidateInfo.dsaSolved,
    badgeCount: candidateInfo.badgeCount,
    atsMatch: candidateInfo.atsMatch,
    skills: candidateInfo.skills && candidateInfo.skills.length > 0 ? candidateInfo.skills : profileSkills.map((s) => s.skill),

    matchPercentage: matchResult.matchPercentage,
    hasRequirements: matchResult.hasRequirements,
    matchCategory,
    matchCategoryLabel,
    totalRequirements: matchResult.totalRequirements,
    assessedRequirementsCount: matchResult.assessedRequirementsCount,

    strengths: matchResult.strengths.map((s) => s.skill),
    needsImprovement: matchResult.needsImprovement.map((s) => s.skill),
    gaps: matchResult.gaps.map((s) => s.skill),
    notAssessed: matchResult.notAssessed.map((s) => s.skill),
    prioritySkills: matchResult.prioritySkills.map((s) => s.skill),
    detailedBreakdown,

    explanation,
    requiredSkillsCoverageRatio,
    requiredStrongCount,

    hasApplied,
    applicationId,
    applicationStatus,
    appliedAt,
  };
}

/**
 * Deterministically ranks candidates for a recruiter's job opportunity (SIH 2026 FIX #4.1):
 *
 * Authoritative Ranking Order:
 * 1. MATCH PERCENTAGE — DESCENDING (Primary signal: How well does this candidate's skill profile match this job?)
 * 2. REQUIRED-SKILL COVERAGE — DESCENDING (Tie-break 1: Proportion of required skills satisfied)
 * 3. STRONG REQUIRED SKILLS — DESCENDING (Tie-break 2: Count of required skills marked STRONG)
 * 4. APPLICATION STATUS / RELEVANCE (Tie-break 3: Candidate who applied ranks higher if skill metrics are identical)
 * 5. READINESS SCORE — DESCENDING (Tie-break 4: Overall student assessment/readiness score)
 * 6. STABLE DETERMINISTIC TIE-BREAKER (Candidate name ascending, then candidate/student ID ascending)
 *
 * Critical Rule:
 * Application status must NOT override a substantially stronger skill match.
 * Example: Candidate B (Not Applied, 91%) must rank before Candidate A (Applied, 55%).
 */
export function rankCandidatesForJob(
  candidates: CandidateJobMatchItem[]
): CandidateJobMatchItem[] {
  return [...candidates].sort((a, b) => {
    // 1. MATCH PERCENTAGE — DESCENDING
    const aHasReq = a.hasRequirements && a.matchPercentage !== null && a.matchPercentage !== undefined;
    const bHasReq = b.hasRequirements && b.matchPercentage !== null && b.matchPercentage !== undefined;

    if (aHasReq && !bHasReq) return -1;
    if (!aHasReq && bHasReq) return 1;

    if (aHasReq && bHasReq) {
      const aPct = a.matchPercentage ?? 0;
      const bPct = b.matchPercentage ?? 0;
      if (bPct !== aPct) {
        return bPct - aPct;
      }

      // 2. REQUIRED-SKILL COVERAGE — DESCENDING
      const aCoverage = a.requiredSkillsCoverageRatio ?? 0;
      const bCoverage = b.requiredSkillsCoverageRatio ?? 0;
      if (Math.abs(bCoverage - aCoverage) > 0.0001) {
        return bCoverage - aCoverage;
      }

      // 3. STRONG REQUIRED SKILLS — DESCENDING
      const aStrong = a.requiredStrongCount ?? 0;
      const bStrong = b.requiredStrongCount ?? 0;
      if (bStrong !== aStrong) {
        return bStrong - aStrong;
      }
    }

    // 4. APPLICATION STATUS / RELEVANCE (Lower-priority relevance signal after skill metrics)
    // If all skill match metrics are tied, a candidate who has applied gets priority
    if (a.hasApplied !== b.hasApplied) {
      return a.hasApplied ? -1 : 1;
    }

    // If both have applied, prioritize more advanced application stages
    if (a.hasApplied && b.hasApplied && a.applicationStatus !== b.applicationStatus) {
      const stageWeight: Record<string, number> = {
        Offer: 5,
        Interview: 4,
        Shortlisted: 3,
        Screening: 2,
        Applied: 1,
      };
      const aWeight = stageWeight[a.applicationStatus || 'Applied'] || 1;
      const bWeight = stageWeight[b.applicationStatus || 'Applied'] || 1;
      if (bWeight !== aWeight) {
        return bWeight - aWeight;
      }
    }

    // 5. READINESS SCORE — DESCENDING
    const aScore = a.readinessScore ?? a.overallScore ?? 0;
    const bScore = b.readinessScore ?? b.overallScore ?? 0;
    if (bScore !== aScore) {
      return bScore - aScore;
    }

    // 6. STABLE DETERMINISTIC TIE-BREAKER (Name ascending, then ID ascending)
    const nameCmp = (a.name || '').localeCompare(b.name || '');
    if (nameCmp !== 0) return nameCmp;
    const aId = String(a.id || a._id || a.candidateId || '');
    const bId = String(b.id || b._id || b.candidateId || '');
    return aId.localeCompare(bId);
  });
}
