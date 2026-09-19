import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { AptitudeQuestion } from '../src/models/AptitudeQuestion';
import { connectDB } from '../src/db/db';

dotenv.config();

export async function seedAptitudeQuestions(): Promise<void> {
  try {
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    if (mongoose.connection.readyState !== 1) {
      console.warn('[Seed Aptitude] MongoDB is not connected. Skipping database seed.');
      return;
    }

    const existingCount = await AptitudeQuestion.countDocuments();
    if (existingCount > 0) {
      console.log(`[Seed Aptitude] Database already has ${existingCount} aptitude questions. Skipping seed.`);
      return;
    }

    const jsonPath = path.join(process.cwd(), 'data', 'aptitudeQuestions.json');
    if (!fs.existsSync(jsonPath)) {
      console.error(`[Seed Aptitude] JSON file not found at ${jsonPath}`);
      return;
    }

    const rawData = fs.readFileSync(jsonPath, 'utf-8');
    const questions = JSON.parse(rawData);

    if (!Array.isArray(questions) || questions.length === 0) {
      console.error('[Seed Aptitude] No questions found in JSON file.');
      return;
    }

    const result = await AptitudeQuestion.insertMany(questions);
    console.log(`[Seed Aptitude] Successfully seeded ${result.length} curated aptitude questions into MongoDB.`);
  } catch (error: any) {
    console.error('[Seed Aptitude Error]:', error.message || error);
  }
}

// If script is executed directly via tsx/node
if (process.argv[1] && process.argv[1].includes('seedAptitudeQuestions')) {
  (async () => {
    console.log('[Seed Aptitude] Running standalone seeder...');
    await seedAptitudeQuestions();
    await mongoose.disconnect();
    process.exit(0);
  })();
}
