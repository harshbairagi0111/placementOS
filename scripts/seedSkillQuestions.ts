import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { SkillQuestion } from '../src/models/SkillQuestion';
import { connectDB } from '../src/db/db';

dotenv.config();

export async function seedSkillQuestions(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('[Seed Skills] MongoDB is not connected. Skipping database seed.');
      return;
    }

    const existingCount = await SkillQuestion.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed Skills] Database already has ${existingCount} skill assessment questions. Skipping seed.`);
      return;
    }

    const jsonPath = path.join(process.cwd(), 'data', 'skillQuestions.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`[Seed Skills] JSON file not found at ${jsonPath}`);
      return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const questions = JSON.parse(rawData);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('[Seed Skills] No questions found in JSON file.');
      return;
    }

    const result = await SkillQuestion.insertMany(questions);
    console.log(`[Seed Skills] Successfully seeded ${result.length} curated industry skill assessment questions into MongoDB.`);
  } catch (error: any) {
    console.error('[Seed Skills Error]:', error.message || error);
  }
}

// Standalone execution support
if (process.argv[1] && process.argv[1].includes('seedSkillQuestions')) {
  (async () => {
    console.log('[Seed Skills] Running standalone seeder...');
    await seedSkillQuestions();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
