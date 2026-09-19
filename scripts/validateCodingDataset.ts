import { allCodingQuestions, QuestionSeed } from '../data/codingQuestions/index';

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
  metrics: {
    totalQuestions: number;
    categories: Record<string, number>;
    difficulties: Record<string, number>;
    totalTestCases: number;
    publicTestCases: number;
    hiddenTestCases: number;
  };
}

export function validateCodingDataset(questions: QuestionSeed[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const requiredCategories = [
    'Arrays',
    'Strings',
    'Searching / Sorting',
    'Hashing',
    'Stack / Queue',
    'Linked List',
    'Trees',
    'Recursion / Backtracking',
    'Dynamic Programming',
  ];

  const categories: Record<string, number> = {};
  const difficulties: Record<string, number> = {};
  const slugSet = new Set<string>();

  let totalTestCases = 0;
  let publicTestCases = 0;
  let hiddenTestCases = 0;

  // 1. Total questions count >= 30
  if (questions.length < 30) {
    errors.push(`Dataset question count (${questions.length}) is less than minimum required 30.`);
  }

  questions.forEach((q, idx) => {
    const qLabel = `[#${idx + 1} "${q.title || 'Untitled'}" (${q.slug || 'no-slug'})]`;

    // 2. Validate slug
    if (!q.slug || typeof q.slug !== 'string' || q.slug.trim() === '') {
      errors.push(`${qLabel} Missing or empty slug.`);
    } else {
      const normalizedSlug = q.slug.toLowerCase().trim();
      if (slugSet.has(normalizedSlug)) {
        errors.push(`${qLabel} Duplicate slug detected: "${normalizedSlug}".`);
      }
      slugSet.add(normalizedSlug);
    }

    // 3. Validate title & description
    if (!q.title || q.title.trim() === '') {
      errors.push(`${qLabel} Missing title.`);
    }
    if (!q.description || q.description.trim() === '') {
      errors.push(`${qLabel} Missing description.`);
    }

    // 4. Validate difficulty
    const validDiffs = ['EASY', 'MEDIUM', 'HARD'];
    if (!q.difficulty || !validDiffs.includes(q.difficulty.toUpperCase())) {
      errors.push(`${qLabel} Invalid difficulty "${q.difficulty}". Must be EASY, MEDIUM, or HARD.`);
    } else {
      const d = q.difficulty.toUpperCase();
      difficulties[d] = (difficulties[d] || 0) + 1;
    }

    // 5. Track category
    if (!q.category || q.category.trim() === '') {
      errors.push(`${qLabel} Missing category.`);
    } else {
      categories[q.category] = (categories[q.category] || 0) + 1;
    }

    // 6. Test cases validation
    if (!Array.isArray(q.testCases) || q.testCases.length === 0) {
      errors.push(`${qLabel} Has no test cases.`);
    } else {
      const pubCases = q.testCases.filter((tc) => tc.visibility === 'PUBLIC');
      const hidCases = q.testCases.filter((tc) => tc.visibility === 'HIDDEN');

      if (pubCases.length < 1) {
        errors.push(`${qLabel} Must have at least 1 PUBLIC test case (found ${pubCases.length}).`);
      }
      if (hidCases.length < 3) {
        errors.push(`${qLabel} Must have at least 3 HIDDEN test cases (found ${hidCases.length}).`);
      }

      q.testCases.forEach((tc, tcIdx) => {
        const tcLabel = `${qLabel} Test Case #${tcIdx + 1} (${tc.testCaseId})`;
        if (!tc.testCaseId) {
          errors.push(`${tcLabel} Missing testCaseId.`);
        }
        if (tc.input === undefined || tc.input === null || String(tc.input).trim() === '') {
          errors.push(`${tcLabel} Empty or missing input.`);
        }
        if (tc.expectedOutput === undefined || tc.expectedOutput === null || String(tc.expectedOutput).trim() === '') {
          errors.push(`${tcLabel} Empty or missing expectedOutput.`);
        }
        if (tc.visibility !== 'PUBLIC' && tc.visibility !== 'HIDDEN') {
          errors.push(`${tcLabel} Invalid visibility "${tc.visibility}". Must be PUBLIC or HIDDEN.`);
        }

        totalTestCases++;
        if (tc.visibility === 'PUBLIC') publicTestCases++;
        if (tc.visibility === 'HIDDEN') hiddenTestCases++;
      });
    }

    // 7. Starter code templates
    if (!q.starterCode || typeof q.starterCode !== 'object') {
      errors.push(`${qLabel} Missing starterCode object.`);
    } else {
      const primaryLangs = ['cpp', 'python', 'java', 'javascript', 'typescript'];
      const missingPrimaryLangs = primaryLangs.filter((lang) => !q.starterCode[lang] || q.starterCode[lang].trim() === '');
      if (missingPrimaryLangs.length > 0) {
        warnings.push(`${qLabel} Missing starterCode for languages: ${missingPrimaryLangs.join(', ')}`);
      }
    }
  });

  // 8. Verify all required categories are covered
  requiredCategories.forEach((reqCat) => {
    if (!categories[reqCat] || categories[reqCat] === 0) {
      errors.push(`Required category "${reqCat}" has 0 questions.`);
    }
  });

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    metrics: {
      totalQuestions: questions.length,
      categories,
      difficulties,
      totalTestCases,
      publicTestCases,
      hiddenTestCases,
    },
  };
}

// Run if executed directly
if (
  process.argv[1] &&
  (process.argv[1].endsWith('validateCodingDataset.ts') || process.argv[1].endsWith('validateCodingDataset.js'))
) {
  console.log('\n==============================================');
  console.log('  PLACEMENTOS CODING DATASET VALIDATION SUITE');
  console.log('==============================================\n');

  const result = validateCodingDataset(allCodingQuestions);

  console.log(`Total Questions: ${result.metrics.totalQuestions}`);
  console.log(`Total Test Cases: ${result.metrics.totalTestCases} (${result.metrics.publicTestCases} PUBLIC, ${result.metrics.hiddenTestCases} HIDDEN)`);
  console.log('\nDifficulties Distribution:');
  Object.entries(result.metrics.difficulties).forEach(([diff, count]) => {
    console.log(`  - ${diff}: ${count}`);
  });

  console.log('\nCategories Distribution:');
  Object.entries(result.metrics.categories).forEach(([cat, count]) => {
    console.log(`  - ${cat}: ${count}`);
  });

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    result.warnings.forEach((w) => console.log(`  ⚠ ${w}`));
  }

  if (result.errors.length > 0) {
    console.error(`\nValidation FAILED with ${result.errors.length} errors:`);
    result.errors.forEach((e) => console.error(`  ✖ ${e}`));
    process.exit(1);
  } else {
    console.log('\n✔ All dataset validations PASSED successfully!');
    process.exit(0);
  }
}
