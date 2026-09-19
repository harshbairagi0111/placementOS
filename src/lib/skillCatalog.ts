/**
 * Canonical Skill Catalog & Industry Evaluation Framework
 * Ensures uniform skill representations across assessments, job postings, and student profiles.
 */

export type SkillCategory = 'technical' | 'soft';
export type ProficiencyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface CanonicalSkill {
  id: string;
  name: string;
  category: SkillCategory;
  aliases: string[];
  description: string;
  industryImportance: 'Critical' | 'High' | 'Medium';
}

export const PROFICIENCY_THRESHOLDS = {
  beginner: { min: 0, max: 49, label: 'Beginner' as ProficiencyLevel },
  intermediate: { min: 50, max: 69, label: 'Intermediate' as ProficiencyLevel },
  advanced: { min: 70, max: 84, label: 'Advanced' as ProficiencyLevel },
  expert: { min: 85, max: 100, label: 'Expert' as ProficiencyLevel },
};

export const CANONICAL_SKILLS: CanonicalSkill[] = [
  // Technical Skills (Configurable list covering SIH Problem Statement & campus requirements)
  {
    id: 'programming_fundamentals',
    name: 'Programming Fundamentals',
    category: 'technical',
    aliases: ['programming fundamentals', 'coding fundamentals', 'basic programming', 'cs fundamentals', 'problem solving in code'],
    description: 'Core logic, flow control, variable scoping, pointers/references, and algorithmic thinking.',
    industryImportance: 'Critical',
  },
  {
    id: 'cpp',
    name: 'C++',
    category: 'technical',
    aliases: ['c++', 'cpp', 'modern c++', 'c plus plus'],
    description: 'STL containers, memory management, templates, pointers, and performance optimization.',
    industryImportance: 'High',
  },
  {
    id: 'java',
    name: 'Java',
    category: 'technical',
    aliases: ['java', 'core java', 'java 8+', 'java ee', 'jvm'],
    description: 'Object-oriented patterns, JVM internals, multithreading, concurrency, and Java Collections.',
    industryImportance: 'Critical',
  },
  {
    id: 'python',
    name: 'Python',
    category: 'technical',
    aliases: ['python', 'python 3', 'py', 'pythonic code'],
    description: 'Data structures, list comprehensions, decorators, generators, standard libraries, and backend scripting.',
    industryImportance: 'Critical',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    category: 'technical',
    aliases: ['javascript', 'js', 'java script', 'es6', 'es6+', 'ecmascript', 'modern javascript'],
    description: 'Event loop, asynchronous promises/async-await, closures, prototypes, DOM, and ES6+ standards.',
    industryImportance: 'Critical',
  },
  {
    id: 'dsa',
    name: 'Data Structures & Algorithms',
    category: 'technical',
    aliases: ['data structures & algorithms', 'data structures and algorithms', 'dsa', 'data structures', 'algorithms', 'problem solving'],
    description: 'Trees, graphs, dynamic programming, sorting, searching, hashing, and asymptotic time/space complexities.',
    industryImportance: 'Critical',
  },
  {
    id: 'sql',
    name: 'SQL',
    category: 'technical',
    aliases: ['sql', 'structured query language', 'mysql', 'postgresql', 'postgres', 'sqlite', 'rdbms querying'],
    description: 'Complex joins, aggregations, window functions, indexing, subqueries, and query optimization.',
    industryImportance: 'Critical',
  },
  {
    id: 'dbms',
    name: 'Database Management',
    category: 'technical',
    aliases: ['database management', 'dbms', 'databases', 'database design', 'rdbms', 'normalization', 'acid transactions'],
    description: 'ACID guarantees, schema normalization (1NF-BCNF), concurrency control, transactions, and indexing strategies.',
    industryImportance: 'High',
  },
  {
    id: 'html_css',
    name: 'HTML/CSS',
    category: 'technical',
    aliases: ['html/css', 'html', 'css', 'html5', 'css3', 'responsive design', 'flexbox', 'grid'],
    description: 'Semantic markup, accessible layouts, responsive CSS grid/flexbox, specificity, and CSS animations.',
    industryImportance: 'Medium',
  },
  {
    id: 'react',
    name: 'React',
    category: 'technical',
    aliases: ['react', 'react.js', 'reactjs', 'react js', 'frontend framework'],
    description: 'Component lifecycles, hooks, virtual DOM reconciliation, state management, and performance optimization.',
    industryImportance: 'High',
  },
  {
    id: 'nodejs',
    name: 'Node.js',
    category: 'technical',
    aliases: ['node.js', 'nodejs', 'node', 'node js', 'express.js', 'express'],
    description: 'Non-blocking I/O event loops, streams, buffers, modular design, Express backend APIs, and microservices.',
    industryImportance: 'High',
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'technical',
    aliases: ['mongodb', 'mongo', 'nosql', 'document db', 'mongoose'],
    description: 'Document models, aggregation pipelines, replica sets, sharding, indexes, and schema embedding.',
    industryImportance: 'Medium',
  },
  {
    id: 'rest_apis',
    name: 'REST APIs',
    category: 'technical',
    aliases: ['rest apis', 'rest api', 'restful', 'restful apis', 'api design', 'http methods', 'web services'],
    description: 'HTTP status codes, idempotency, REST architectural constraints, authentication headers, and JSON standards.',
    industryImportance: 'High',
  },
  {
    id: 'git',
    name: 'Git/GitHub',
    category: 'technical',
    aliases: ['git/github', 'git', 'github', 'git & github', 'version control', 'vcs', 'source control'],
    description: 'Branching workflows, merges, rebases, pull requests, resolving merge conflicts, and commit hygiene.',
    industryImportance: 'High',
  },
  {
    id: 'cloud_fundamentals',
    name: 'Cloud Fundamentals',
    category: 'technical',
    aliases: ['cloud fundamentals', 'cloud', 'cloud computing', 'aws', 'gcp', 'azure', 'serverless', 'iaas', 'paas'],
    description: 'Compute instances, object storage, serverless functions, IAM policies, and cloud architectural patterns.',
    industryImportance: 'Medium',
  },
  {
    id: 'computer_networks',
    name: 'Computer Networks',
    category: 'technical',
    aliases: ['computer networks', 'networking', 'cn', 'tcp/ip', 'osi model', 'dns', 'http', 'https'],
    description: 'OSI & TCP/IP layers, routing, TCP handshake, UDP, DNS resolution, TLS/SSL, and subnetting.',
    industryImportance: 'High',
  },
  {
    id: 'operating_systems',
    name: 'Operating Systems',
    category: 'technical',
    aliases: ['operating systems', 'os', 'operating system', 'process management', 'threads', 'linux basics'],
    description: 'Process scheduling, multithreading, virtual memory, paging, deadlocks, race conditions, and system calls.',
    industryImportance: 'High',
  },
  {
    id: 'oop',
    name: 'Object-Oriented Programming',
    category: 'technical',
    aliases: ['object-oriented programming', 'oop', 'oops', 'object oriented programming', 'solid principles'],
    description: 'Encapsulation, inheritance, polymorphism, abstraction, and SOLID object-oriented design principles.',
    industryImportance: 'Critical',
  },
  {
    id: 'system_design',
    name: 'System Design',
    category: 'technical',
    aliases: ['system design', 'hld', 'lld', 'distributed systems', 'scalability', 'microservices', 'caching', 'load balancing'],
    description: 'High-level architectures, load balancers, caching layers, database replication, rate limiting, and CAP theorem.',
    industryImportance: 'Critical',
  },

  // Soft Skills (Configurable behavioral & interpersonal skills)
  {
    id: 'communication',
    name: 'Communication',
    category: 'soft',
    aliases: ['communication', 'verbal communication', 'written communication', 'active listening', 'technical communication'],
    description: 'Articulating complex technical ideas clearly, structured verbal and written messaging, and empathetic listening.',
    industryImportance: 'Critical',
  },
  {
    id: 'teamwork',
    name: 'Teamwork',
    category: 'soft',
    aliases: ['teamwork', 'team player', 'cross-functional teamwork', 'working in teams'],
    description: 'Constructive participation in group projects, supporting teammates under deadlines, and shared accountability.',
    industryImportance: 'Critical',
  },
  {
    id: 'leadership',
    name: 'Leadership',
    category: 'soft',
    aliases: ['leadership', 'initiative', 'ownership', 'mentorship', 'team lead'],
    description: 'Taking ownership of ambiguous challenges, guiding teammates, resolving roadblocks, and fostering psychological safety.',
    industryImportance: 'High',
  },
  {
    id: 'problem_solving',
    name: 'Problem Solving',
    category: 'soft',
    aliases: ['problem solving', 'troubleshooting', 'analytical thinking', 'root cause analysis'],
    description: 'Deconstructing ambiguous problems, structured debugging, data-driven hypothesis testing, and practical trade-offs.',
    industryImportance: 'Critical',
  },
  {
    id: 'time_management',
    name: 'Time Management',
    category: 'soft',
    aliases: ['time management', 'prioritization', 'sprint planning', 'deadline discipline'],
    description: 'Balancing competing priorities, avoiding scope creep, proactive sprint estimation, and meeting delivery milestones.',
    industryImportance: 'High',
  },
  {
    id: 'adaptability',
    name: 'Adaptability',
    category: 'soft',
    aliases: ['adaptability', 'resilience', 'handling change', 'learning agility', 'navigating ambiguity'],
    description: 'Embracing shifting project requirements, learning new technology stacks rapidly, and thriving in dynamic environments.',
    industryImportance: 'High',
  },
  {
    id: 'critical_thinking',
    name: 'Critical Thinking',
    category: 'soft',
    aliases: ['critical thinking', 'decision making', 'evaluating trade-offs', 'logical analysis'],
    description: 'Rigorously evaluating alternative solutions, questioning untested assumptions, and optimizing for long-term impact.',
    industryImportance: 'High',
  },
  {
    id: 'collaboration',
    name: 'Collaboration',
    category: 'soft',
    aliases: ['collaboration', 'stakeholder management', 'cross-functional collaboration', 'peer reviews'],
    description: 'Conducting constructive code/design reviews, managing diverse stakeholder expectations, and driving consensus.',
    industryImportance: 'Critical',
  },
];

/**
 * Normalizes any raw skill string into its Canonical Skill object.
 * Resolves variations like 'js', 'javascript', 'Java Script' -> 'JavaScript'.
 */
export function toCanonicalSkill(raw: string): CanonicalSkill {
  if (!raw || typeof raw !== 'string') {
    return {
      id: 'general',
      name: 'General',
      category: 'technical',
      aliases: [],
      description: 'General skill',
      industryImportance: 'Medium',
    };
  }

  const clean = raw.trim().toLowerCase().replace(/[\s\-_.]/g, '');

  for (const skill of CANONICAL_SKILLS) {
    if (skill.name.toLowerCase().replace(/[\s\-_.]/g, '') === clean) {
      return skill;
    }
    if (skill.id.toLowerCase().replace(/[\s\-_.]/g, '') === clean) {
      return skill;
    }
    for (const alias of skill.aliases) {
      if (alias.toLowerCase().replace(/[\s\-_.]/g, '') === clean) {
        return skill;
      }
    }
  }

  // If not found in default catalog, return a sanitized canonical representation
  const titleName = raw
    .trim()
    .split(/[\s_-]+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

  return {
    id: raw.trim().toLowerCase().replace(/[^a-z0-9]/g, '_'),
    name: titleName,
    category: 'technical',
    aliases: [raw.trim().toLowerCase()],
    description: `${titleName} proficiency`,
    industryImportance: 'Medium',
  };
}

/**
 * Returns the canonical display name for any raw skill input.
 */
export function getCanonicalSkillName(raw: string): string {
  return toCanonicalSkill(raw).name;
}

/**
 * Centralized deterministic score-to-proficiency level mapper.
 */
export function calculateProficiencyLevel(score: number): ProficiencyLevel {
  const rounded = Math.max(0, Math.min(100, Math.round(score)));
  if (rounded >= PROFICIENCY_THRESHOLDS.expert.min) return 'Expert';
  if (rounded >= PROFICIENCY_THRESHOLDS.advanced.min) return 'Advanced';
  if (rounded >= PROFICIENCY_THRESHOLDS.intermediate.min) return 'Intermediate';
  return 'Beginner';
}

/**
 * Evaluates strengths and skill gaps deterministically.
 * Strengths: Assessed skills with score >= 70 (Advanced or Expert)
 * Skill Gaps: Assessed skills with score < 70 OR unassessed critical market requirements.
 */
export function evaluateStrengthsAndGaps(
  assessedScores: Array<{ skill: string; score: number; category: SkillCategory }>,
  benchmarkRequirements: string[] = []
): {
  strengths: Array<{ skill: string; score: number; level: ProficiencyLevel; category: SkillCategory }>;
  skillGaps: Array<{
    skill: string;
    currentScore: number | null;
    level: ProficiencyLevel | 'Unassessed';
    category: SkillCategory;
    isMarketRequired: boolean;
    reason: string;
  }>;
} {
  const strengths: Array<{ skill: string; score: number; level: ProficiencyLevel; category: SkillCategory }> = [];
  const skillGaps: Array<{
    skill: string;
    currentScore: number | null;
    level: ProficiencyLevel | 'Unassessed';
    category: SkillCategory;
    isMarketRequired: boolean;
    reason: string;
  }> = [];

  const assessedMap = new Map<string, { skill: string; score: number; category: SkillCategory }>();

  for (const item of assessedScores) {
    const canonical = toCanonicalSkill(item.skill);
    assessedMap.set(canonical.name, {
      skill: canonical.name,
      score: item.score,
      category: canonical.category,
    });

    const level = calculateProficiencyLevel(item.score);

    if (item.score >= PROFICIENCY_THRESHOLDS.advanced.min) {
      strengths.push({
        skill: canonical.name,
        score: item.score,
        level,
        category: canonical.category,
      });
    } else {
      skillGaps.push({
        skill: canonical.name,
        currentScore: item.score,
        level,
        category: canonical.category,
        isMarketRequired: false,
        reason: item.score < PROFICIENCY_THRESHOLDS.intermediate.min 
          ? 'Foundational gaps identified; requires structured study and practice'
          : 'Borderline proficiency; further hands-on implementation needed',
      });
    }
  }

  // Evaluate against market/job benchmark requirements
  for (const req of benchmarkRequirements) {
    const canonicalReq = toCanonicalSkill(req);
    const existingAssessed = assessedMap.get(canonicalReq.name);

    if (!existingAssessed) {
      // Unassessed requirement is a critical gap
      const alreadyInGaps = skillGaps.some((g) => g.skill === canonicalReq.name);
      if (!alreadyInGaps) {
        skillGaps.push({
          skill: canonicalReq.name,
          currentScore: null,
          level: 'Unassessed',
          category: canonicalReq.category,
          isMarketRequired: true,
          reason: 'Actively required by current industry recruitment drives',
        });
      }
    } else if (existingAssessed.score < PROFICIENCY_THRESHOLDS.advanced.min) {
      // Flag existing gap as industry required
      const gap = skillGaps.find((g) => g.skill === canonicalReq.name);
      if (gap) {
        gap.isMarketRequired = true;
        gap.reason = `Required by active recruiters (current score ${existingAssessed.score}% is below 70% benchmark)`;
      }
    }
  }

  // Sort strengths highest score first
  strengths.sort((a, b) => b.score - a.score);

  // Sort gaps: market required first, then lowest score first
  skillGaps.sort((a, b) => {
    if (a.isMarketRequired !== b.isMarketRequired) {
      return a.isMarketRequired ? -1 : 1;
    }
    return (a.currentScore ?? 0) - (b.currentScore ?? 0);
  });

  return { strengths, skillGaps };
}
