import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/db/db';
import {
  RAGKnowledge,
  validateRAGKnowledgeRecord,
  validateRAGDatasetStructure,
  ValidationResult,
  RAGDatasetManifest,
} from '../src/models/RAGKnowledge';

dotenv.config();

export interface BatchSeedReport {
  filePath: string;
  fileName: string;
  datasetName: string;
  version: string;
  processed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  errors: Array<{ sourceId?: string; error: string }>;
}

export interface MultiBatchSeedReport {
  datasetsDiscovered: number;
  batches: BatchSeedReport[];
  totalProcessed: number;
  inserted: number;
  updated: number;
  unchanged: number;
  skipped: number;
  failed: number;
  errors: Array<{ filePath?: string; sourceId?: string; error: string }>;
  conflicts: Array<{ sourceId: string; version: string; file1: string; file2: string; details: string }>;
}

// Backward-compatible alias for existing consumers
export type SeedReport = MultiBatchSeedReport;

export interface SeedOptions {
  filePath?: string;
  dirPath?: string;
  log?: boolean;
}

/**
 * Discovers valid dataset JSON files in target directory.
 * Ignores non-JSON files, READMEs, temporary files, and hidden dotfiles.
 * Automatically finds batch1, batch2, and any future batch files without code changes.
 */
export function discoverDatasetFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) {
    return [];
  }

  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  const jsonFiles = entries
    .filter((entry) => {
      if (!entry.isFile()) return false;
      const name = entry.name;
      if (name.startsWith('.') || name.startsWith('_')) return false;
      if (!name.endsWith('.json')) return false;
      // Explicitly ignore known non-dataset files like README or temp backups
      if (name.toLowerCase().includes('readme')) return false;
      return true;
    })
    .map((entry) => path.join(dirPath, entry.name))
    .sort();

  return jsonFiles;
}

/**
 * Compares an existing DB record with a candidate seed record to detect updates.
 */
function recordsAreEqual(existing: any, candidate: any): boolean {
  if (existing.content !== candidate.content) return false;
  if (existing.title !== candidate.title) return false;
  if (existing.category !== candidate.category) return false;
  if (existing.sourceType !== candidate.sourceType) return false;
  if (existing.status !== candidate.status) return false;
  if ((existing.difficulty || undefined) !== (candidate.difficulty || undefined)) return false;

  const existingSkills = JSON.stringify((existing.skills || []).slice().sort());
  const newSkills = JSON.stringify((candidate.skills || []).slice().sort());
  if (existingSkills !== newSkills) return false;

  const existingRoles = JSON.stringify((existing.roles || []).slice().sort());
  const newRoles = JSON.stringify((candidate.roles || []).slice().sort());
  if (existingRoles !== newRoles) return false;

  const existingTags = JSON.stringify((existing.tags || []).slice().sort());
  const newTags = JSON.stringify((candidate.tags || []).slice().sort());
  if (existingTags !== newTags) return false;

  const existingMeta = JSON.stringify(existing.metadata || {});
  const newMeta = JSON.stringify(candidate.metadata || {});
  if (existingMeta !== newMeta) return false;

  return true;
}

/**
 * Seeds a single dataset file into the canonical RAGKnowledge MongoDB collection.
 * Validates top-level dataset structure, verifies every record, detects changes,
 * and maintains idempotency without unnecessary database writes.
 */
export async function seedSingleDataset(
  filePath: string,
  options: {
    log?: boolean;
    tracker?: Map<string, { file: string; record: any }>;
    conflicts?: Array<{ sourceId: string; version: string; file1: string; file2: string; details: string }>;
  } = {}
): Promise<BatchSeedReport> {
  const fileName = path.basename(filePath);
  const log = options.log !== false;

  const report: BatchSeedReport = {
    filePath,
    fileName,
    datasetName: fileName,
    version: '1.0.0',
    processed: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  if (!fs.existsSync(filePath)) {
    const errorMsg = `Dataset file not found: ${filePath}`;
    report.failed = 1;
    report.errors.push({ error: errorMsg });
    if (log) console.error(`[Seed Error] ${errorMsg}`);
    return report;
  }

  let rawJson: any;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    rawJson = JSON.parse(content);
  } catch (err: any) {
    const errorMsg = `Malformed JSON in ${fileName}: ${err.message || String(err)}`;
    report.failed = 1;
    report.errors.push({ error: errorMsg });
    if (log) console.error(`[Seed Error] ${errorMsg}`);
    return report;
  }

  // Validate dataset structure
  const structValidation = validateRAGDatasetStructure(rawJson);
  if (!structValidation.valid || !structValidation.manifest) {
    const errorMsg = `Invalid dataset structure in ${fileName}: ${structValidation.errors.join('; ')}`;
    report.failed = 1;
    report.errors.push({ error: errorMsg });
    if (log) console.error(`[Seed Error] ${errorMsg}`);
    return report;
  }

  const manifest = structValidation.manifest;
  report.datasetName = manifest.datasetName;
  report.version = manifest.version;
  const rawRecords = manifest.records;
  report.processed = rawRecords.length;

  if (rawRecords.length === 0) {
    return report;
  }

  // Validate individual records using central validator
  const validRecords: any[] = [];
  for (let i = 0; i < rawRecords.length; i++) {
    const rawRec = rawRecords[i];
    const recValidation = validateRAGKnowledgeRecord(rawRec);

    if (!recValidation.valid || !recValidation.sanitizedRecord) {
      report.skipped++;
      report.errors.push({
        sourceId: rawRec?.sourceId || `${fileName}#${i}`,
        error: `Validation error: ${recValidation.errors.join('; ')}`,
      });
      continue;
    }

    const sanitized = recValidation.sanitizedRecord;
    // Align version with manifest version if not explicitly set
    if (!rawRec.version && manifest.version) {
      sanitized.version = manifest.version;
    }

    // Cross-batch duplicate & conflict tracking
    if (options.tracker) {
      const key = `${sanitized.sourceId}::${sanitized.version}`;
      const prev = options.tracker.get(key);
      if (prev) {
        if (!recordsAreEqual(prev.record, sanitized)) {
          const detail = `Conflicting record fields between ${prev.file} and ${fileName}`;
          if (options.conflicts) {
            options.conflicts.push({
              sourceId: sanitized.sourceId,
              version: sanitized.version,
              file1: prev.file,
              file2: fileName,
              details: detail,
            });
          }
          report.errors.push({
            sourceId: sanitized.sourceId,
            error: `Conflict with ${prev.file}: identical sourceId/version with conflicting contents`,
          });
          report.skipped++;
          if (log) {
            console.warn(`[Conflict Warning] Record ${sanitized.sourceId} (v${sanitized.version}) in ${fileName} conflicts with ${prev.file}`);
          }
          continue;
        } else {
          // Identical duplicate across batches - count as unchanged, skip re-insertion
          report.unchanged++;
          continue;
        }
      } else {
        options.tracker.set(key, { file: fileName, record: sanitized });
      }
    }

    validRecords.push(sanitized);
  }

  if (validRecords.length === 0) {
    return report;
  }

  // Fetch existing documents from MongoDB to determine inserts vs updates vs unchanged
  const sourceIds = validRecords.map((r) => r.sourceId);
  const existingDocs = await RAGKnowledge.find({ sourceId: { $in: sourceIds } }).lean();
  const existingMap = new Map<string, any>();
  for (const doc of existingDocs) {
    existingMap.set(`${doc.sourceId}::${doc.version}`, doc);
  }

  const toInsert: any[] = [];
  const toUpdate: Array<{ filter: any; update: any }> = [];

  for (const record of validRecords) {
    const key = `${record.sourceId}::${record.version}`;
    const existing = existingMap.get(key);

    if (!existing) {
      toInsert.push(record);
    } else {
      if (!recordsAreEqual(existing, record)) {
        toUpdate.push({
          filter: { sourceId: record.sourceId, version: record.version },
          update: record,
        });
      } else {
        report.unchanged++;
      }
    }
  }

  // Execute inserts in batch
  if (toInsert.length > 0) {
    await RAGKnowledge.insertMany(toInsert);
    report.inserted += toInsert.length;
    for (const ins of toInsert) {
      existingMap.set(`${ins.sourceId}::${ins.version}`, ins);
    }
  }

  // Execute updates
  for (const item of toUpdate) {
    await RAGKnowledge.updateOne(item.filter, { $set: item.update });
    report.updated++;
  }

  return report;
}

/**
 * Seeds all discovered dataset batches under data/rag/ into canonical RAGKnowledge collection.
 * Fully idempotent, update-aware, conflict-resilient, and reports dataset-level metrics.
 */
export async function seedRAGKnowledge(options: SeedOptions = {}): Promise<MultiBatchSeedReport> {
  const log = options.log !== false;
  const defaultDir = path.join(process.cwd(), 'data', 'rag');
  const targetDir = options.dirPath || defaultDir;

  let targetFiles: string[] = [];

  if (options.filePath) {
    targetFiles = [options.filePath];
  } else {
    targetFiles = discoverDatasetFiles(targetDir);
  }

  const multiReport: MultiBatchSeedReport = {
    datasetsDiscovered: targetFiles.length,
    batches: [],
    totalProcessed: 0,
    inserted: 0,
    updated: 0,
    unchanged: 0,
    skipped: 0,
    failed: 0,
    errors: [],
    conflicts: [],
  };

  if (log) {
    console.log('====================================================');
    console.log('   PLACEMENTOS CANONICAL RAG MULTI-BATCH SEEDER    ');
    console.log('====================================================');
    console.log(`[Seed] Target directory  : ${targetDir}`);
    console.log(`[Seed] Datasets found    : ${targetFiles.length}`);
    for (const f of targetFiles) {
      console.log(`  - ${path.basename(f)}`);
    }
    console.log('====================================================\n');
  }

  if (targetFiles.length === 0) {
    if (log) console.warn('[Seed] No dataset files discovered to seed.');
    return multiReport;
  }

  const runTracker = new Map<string, { file: string; record: any }>();

  for (const file of targetFiles) {
    const batchReport = await seedSingleDataset(file, {
      log,
      tracker: runTracker,
      conflicts: multiReport.conflicts,
    });

    multiReport.batches.push(batchReport);
    multiReport.totalProcessed += batchReport.processed;
    multiReport.inserted += batchReport.inserted;
    multiReport.updated += batchReport.updated;
    multiReport.unchanged += batchReport.unchanged;
    multiReport.skipped += batchReport.skipped;
    multiReport.failed += batchReport.failed;

    for (const err of batchReport.errors) {
      multiReport.errors.push({
        filePath: file,
        sourceId: err.sourceId,
        error: err.error,
      });
    }
  }

  if (log) {
    console.log('\n====================================================');
    console.log('            RAG DATASET SEEDING COMPLETE            ');
    console.log('====================================================');
    console.log(`Datasets discovered: ${multiReport.datasetsDiscovered}\n`);

    for (const batch of multiReport.batches) {
      console.log(`${batch.fileName} (${batch.datasetName}):`);
      console.log(`  processed: ${batch.processed}`);
      console.log(`  inserted: ${batch.inserted}`);
      console.log(`  updated: ${batch.updated}`);
      console.log(`  unchanged: ${batch.unchanged}`);
      console.log(`  skipped: ${batch.skipped}`);
      console.log(`  failed: ${batch.failed}`);
      if (batch.errors.length > 0) {
        console.log(`  errors: ${batch.errors.length}`);
        for (const e of batch.errors.slice(0, 3)) {
          console.log(`    - [${e.sourceId || 'Structure'}]: ${e.error}`);
        }
        if (batch.errors.length > 3) {
          console.log(`    ... and ${batch.errors.length - 3} more errors`);
        }
      }
      console.log('');
    }

    console.log('Total:');
    console.log(`  processed: ${multiReport.totalProcessed}`);
    console.log(`  inserted: ${multiReport.inserted}`);
    console.log(`  updated: ${multiReport.updated}`);
    console.log(`  unchanged: ${multiReport.unchanged}`);
    console.log(`  skipped: ${multiReport.skipped}`);
    console.log(`  failed: ${multiReport.failed}`);
    if (multiReport.conflicts.length > 0) {
      console.log(`  conflicts: ${multiReport.conflicts.length}`);
    }
    console.log('====================================================\n');
  }

  return multiReport;
}

// Standalone CLI execution
if (process.argv[1]?.includes('seedRAGKnowledge')) {
  (async () => {
    try {
      await connectDB();
      const report = await seedRAGKnowledge({ log: true });
      await mongoose.disconnect();
      // Exit non-zero if any dataset failed or if total processed > 0 but all failed
      if (
        report.failed > 0 ||
        (report.errors.length > 0 &&
          report.inserted === 0 &&
          report.updated === 0 &&
          report.unchanged === 0 &&
          report.totalProcessed > 0)
      ) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    } catch (fatalErr: any) {
      console.error('[Seed Fatal Error]:', fatalErr.message || fatalErr);
      process.exit(1);
    }
  })();
}
