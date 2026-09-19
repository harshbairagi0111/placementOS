import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { CodingQuestion } from '../src/models/CodingQuestion';
import { allCodingQuestions } from '../data/codingQuestions/index';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/placementos';

export async function seedCodingQuestions(options?: { quiet?: boolean }): Promise<{
  total: number;
  upserted: number;
  modified: number;
}> {
  const isQuiet = options?.quiet ?? false;
  const questions = allCodingQuestions;

  // Ensure data/codingQuestions.json exists as a static artifact
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const jsonPath = path.join(dataDir, 'codingQuestions.json');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(jsonPath, JSON.stringify(questions, null, 2), 'utf-8');
    if (!isQuiet) {
      console.log(`[SeedCoding] Wrote ${questions.length} questions to data/codingQuestions.json`);
    }
  } catch (err) {
    console.error('[SeedCoding] Warning: failed to write data/codingQuestions.json:', err);
  }

  let upsertedCount = 0;
  let modifiedCount = 0;

  for (const q of questions) {
    const defaultLangs = ['cpp', 'python', 'java', 'javascript', 'typescript', 'c', 'go', 'rust'];
    const updateDoc = {
      slug: q.slug.toLowerCase().trim(),
      title: q.title.trim(),
      description: q.description,
      difficulty: q.difficulty,
      category: q.category.trim(),
      categoryLabel: q.categoryLabel || q.category,
      tags: q.tags || [],
      company: q.company || '',
      acceptance: q.acceptance || '85%',
      timeComplexity: q.timeComplexity || 'O(N)',
      spaceComplexity: q.spaceComplexity || 'O(1)',
      constraints: q.constraints || [],
      inputFormat: q.inputFormat || '',
      outputFormat: q.outputFormat || '',
      examples: q.examples || [],
      starterCode: q.starterCode || {},
      supportedLanguages: q.supportedLanguages || defaultLangs,
      timeLimitMs: q.timeLimitMs || 2000,
      memoryLimitMb: q.memoryLimitMb || 256,
      testCases: q.testCases.map((tc) => ({
        testCaseId: tc.testCaseId,
        visibility: tc.visibility,
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isActive: tc.isActive !== false,
      })),
      isActive: q.isActive !== false,
      source: q.source || 'PLACEMENTOS_CURATED',
      legacyId: q.legacyId,
    };

    const res = await CodingQuestion.updateOne(
      { slug: updateDoc.slug },
      { $set: updateDoc },
      { upsert: true }
    );

    if (res.upsertedCount > 0) {
      upsertedCount++;
    } else if (res.modifiedCount > 0) {
      modifiedCount++;
    }
  }

  if (!isQuiet) {
    console.log(
      `[SeedCoding] Completed. Processed: ${questions.length}, New Upserted: ${upsertedCount}, Modified: ${modifiedCount}`
    );
  }

  return {
    total: questions.length,
    upserted: upsertedCount,
    modified: modifiedCount,
  };
}

// Run standalone if executed directly
if (process.argv[1] && (process.argv[1].endsWith('seedCodingQuestions.ts') || process.argv[1].endsWith('seedCodingQuestions.js'))) {
  (async () => {
    try {
      if (mongoose.connection.readyState === 0) {
        console.log(`[SeedCoding] Connecting to MongoDB: ${MONGODB_URI}...`);
        await mongoose.connect(MONGODB_URI);
      }
      await seedCodingQuestions();
      await mongoose.disconnect();
      console.log('[SeedCoding] Done.');
      process.exit(0);
    } catch (err) {
      console.error('[SeedCoding] Error during seed:', err);
      process.exit(1);
    }
  })();
}
