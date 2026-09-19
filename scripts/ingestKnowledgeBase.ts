import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/db/db';
import { ingestAllKnowledgeSources } from '../src/services/knowledgeIngestionService';
import { DEFAULT_EMBEDDING_MODEL } from '../src/services/embeddingService';

dotenv.config();

async function runIngestion() {
  console.log('====================================================');
  console.log('       PLACEMENTOS KNOWLEDGE BASE INGESTION         ');
  console.log('====================================================');

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    console.error('\n[Ingestion Error] GEMINI_API_KEY is not set in environment.');
    console.error('To generate vector embeddings, please set GEMINI_API_KEY in your .env file or AI Studio settings.');
    console.error('Note: Normal server startup and PlacementOS application features remain unaffected.\n');
    process.exit(1);
  }

  console.log(`[Config] Embedding Model: ${DEFAULT_EMBEDDING_MODEL}`);
  console.log('[MongoDB] Connecting to database...');

  const conn = await connectDB();
  if (!conn && mongoose.connection.readyState !== 1) {
    console.error('[Ingestion Error] Could not establish MongoDB connection.');
    process.exit(1);
  }

  console.log('[Ingestion] Beginning knowledge ingestion process...');

  try {
    const summary = await ingestAllKnowledgeSources({
      onProgress: (msg) => console.log(msg),
    });

    console.log('\n====================================================');
    console.log('              INGESTION SUMMARY                     ');
    console.log('====================================================');
    console.log(`Total Chunks Upserted: ${summary.totalChunksUpserted}`);
    console.log(`Duration: ${(summary.completedAt.getTime() - summary.startedAt.getTime()) / 1000}s`);
    console.log('----------------------------------------------------');

    for (const [sourceType, res] of Object.entries(summary.resultsBySource)) {
      console.log(
        `• ${sourceType.padEnd(24)}: ` +
        `Processed: ${String(res.sourcesProcessed).padStart(3)} | ` +
        `Upserted: ${String(res.chunksUpserted).padStart(3)} | ` +
        `Skipped: ${String(res.skipped).padStart(2)} | ` +
        `Errors: ${res.errors.length}`
      );
      if (res.errors.length > 0) {
        for (const err of res.errors) {
          console.warn(`    - [${err.sourceId}] ${err.error}`);
        }
      }
    }

    console.log('====================================================');
    console.log('        KNOWLEDGE BASE INGESTION COMPLETED!         ');
    console.log('====================================================\n');
  } catch (error: any) {
    console.error('[Ingestion Failed]', error.message || error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('[MongoDB] Disconnected from database.');
    } catch {
      // Ignore disconnect errors on exit
    }
  }
}

// Only execute when run directly via CLI
if (process.argv[1]?.includes('ingestKnowledgeBase')) {
  runIngestion()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Fatal error during ingestion:', err);
      process.exit(1);
    });
}
