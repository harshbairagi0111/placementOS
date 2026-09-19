import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from '../src/db/db';
import { KnowledgeChunk } from '../src/models/KnowledgeChunk';
import {
  retrieveRelevantKnowledge,
  HybridRetrievalResult,
} from '../src/services/hybridRetrievalService';
import {
  RagEvaluationCase,
  evaluateRetrievalSuite,
  SuiteEvaluationReport,
} from '../src/services/ragEvaluationService';

dotenv.config();

export const REGRESSION_THRESHOLDS = {
  minHitRate: 0.7, // 70% Hit@5
  minPrecision: 0.5, // 50% Precision@5
  minMrr: 0.6, // 0.60 MRR
};

export async function runRagRetrievalEvaluation(k: number = 5): Promise<SuiteEvaluationReport> {
  console.log('====================================================');
  console.log('       PLACEMENTOS RAG RETRIEVAL EVALUATION         ');
  console.log('====================================================\n');

  // 1. Load golden dataset
  const datasetPath = path.resolve(process.cwd(), 'data/ragEvaluationCases.json');
  if (!fs.existsSync(datasetPath)) {
    console.error(`[Evaluation Error] Golden dataset not found at ${datasetPath}`);
    throw new Error(`Evaluation dataset missing: ${datasetPath}`);
  }

  const rawData = fs.readFileSync(datasetPath, 'utf-8');
  const cases: RagEvaluationCase[] = JSON.parse(rawData);
  console.log(`[Config] Loaded ${cases.length} evaluation cases from data/ragEvaluationCases.json`);
  console.log(`[Config] Evaluating Top-K = ${k}`);
  console.log(
    `[Config] Regression Thresholds: Hit@${k} >= ${(REGRESSION_THRESHOLDS.minHitRate * 100).toFixed(0)}%, ` +
      `Precision@${k} >= ${(REGRESSION_THRESHOLDS.minPrecision * 100).toFixed(0)}%, ` +
      `MRR >= ${REGRESSION_THRESHOLDS.minMrr.toFixed(2)}\n`
  );

  // 2. Connect DB
  const conn = await connectDB();
  if (!conn && mongoose.connection.readyState !== 1) {
    console.error('[Evaluation Error] Could not establish MongoDB connection.');
    throw new Error('Database connection failed');
  }

  const totalChunks = await KnowledgeChunk.countDocuments();
  console.log(`[Database] Total indexed KnowledgeChunks: ${totalChunks}`);
  if (totalChunks < 10) {
    console.warn('\n[Warning] Database contains insufficient indexed KnowledgeChunks (< 10).');
    console.warn('Evaluation marked as: insufficient evaluation data\n');
  }

  // 3. Execute retrieval for each case
  console.log('[Evaluation] Executing Hybrid Retrieval queries...');
  const resultsByCaseId = new Map<string, HybridRetrievalResult[]>();

  for (const c of cases) {
    try {
      const results = await retrieveRelevantKnowledge(c.query, { limit: k });
      resultsByCaseId.set(c.id, results);
    } catch (err: any) {
      console.warn(`[Evaluation Warning] Case "${c.id}" query failed:`, err.message);
      resultsByCaseId.set(c.id, []);
    }
  }

  // 4. Compute metrics
  const report = evaluateRetrievalSuite(
    cases,
    resultsByCaseId,
    k,
    REGRESSION_THRESHOLDS
  );

  // 5. Render Quality Report
  console.log('\n====================================================');
  console.log('              EVALUATION QUALITY REPORT             ');
  console.log('====================================================');
  console.log(`Total Cases Evaluated: ${report.totalCases}`);
  console.log(`Top-K Evaluated:       ${report.k}`);
  console.log('----------------------------------------------------');

  const hitPct = (report.hitRate * 100).toFixed(1);
  const precPct = (report.meanPrecision * 100).toFixed(1);
  const recallPct =
    report.meanRecall !== null && report.meanRecall !== undefined
      ? `${(report.meanRecall * 100).toFixed(1)}%`
      : 'N/A';
  const mrrVal = report.mrr.toFixed(3);

  const hitPass = report.hitRate >= REGRESSION_THRESHOLDS.minHitRate;
  const precPass = report.meanPrecision >= REGRESSION_THRESHOLDS.minPrecision;
  const mrrPass = report.mrr >= REGRESSION_THRESHOLDS.minMrr;

  console.log(
    `Hit@${k}:       ${hitPct.padStart(5)}%  ` +
      `[Threshold: >= ${(REGRESSION_THRESHOLDS.minHitRate * 100).toFixed(0)}%]  ` +
      `-> ${hitPass ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `Precision@${k}: ${precPct.padStart(5)}%  ` +
      `[Threshold: >= ${(REGRESSION_THRESHOLDS.minPrecision * 100).toFixed(0)}%]  ` +
      `-> ${precPass ? 'PASS' : 'FAIL'}`
  );
  console.log(
    `Mean Recall@${k}: ${recallPct.padStart(5)}  ` +
      `[Evaluated on cases with defensible denominators]`
  );
  console.log(
    `MRR:          ${mrrVal.padStart(5)}   ` +
      `[Threshold: >= ${REGRESSION_THRESHOLDS.minMrr.toFixed(2)}]   ` +
      `-> ${mrrPass ? 'PASS' : 'FAIL'}`
  );
  console.log('----------------------------------------------------');

  console.log('\nCase-by-Case Summary:');
  for (const cr of report.caseResults) {
    const status = cr.hitAtK ? '✓ HIT ' : '✗ MISS';
    const prec = (cr.precisionAtK * 100).toFixed(0).padStart(3);
    const recStr = cr.recallAtK !== null ? `${(cr.recallAtK * 100).toFixed(0)}%`.padStart(4) : ' N/A';
    const firstRankStr = cr.firstRelevantRank ? `#${cr.firstRelevantRank}` : 'None';
    console.log(
      ` [${status}] ${cr.caseId.padEnd(28)} | Precision: ${prec}% | Recall: ${recStr} | First Match: ${firstRankStr.padEnd(5)} | Query: "${cr.query.slice(0, 40)}..."`
    );
  }

  if (report.failedCases.length > 0) {
    console.log('\nCases Below Threshold:');
    for (const f of report.failedCases) {
      console.log(` • Case ID: ${f.caseId}`);
      console.log(`   Query:    "${f.query}"`);
      console.log(`   Hit:      ${f.hitAtK ? 'YES' : 'NO'}`);
      console.log(`   Precision: ${(f.precisionAtK * 100).toFixed(1)}%`);
      console.log(`   Retrieved: ${f.retrievedCount} chunks`);
      if (f.judgments.length > 0) {
        for (const j of f.judgments) {
          console.log(`     - [${j.sourceType}] ${j.title || j.chunkId} (Relevant: ${j.isRelevant})`);
        }
      } else {
        console.log('     - (No chunks retrieved)');
      }
    }
  }

  console.log('\n====================================================');
  if (report.passedThresholds) {
    console.log('   ALL RAG REGRESSION THRESHOLDS PASSED! (READY)   ');
  } else {
    console.warn('   WARNING: ONE OR MORE REGRESSION THRESHOLDS FAILED ');
  }
  console.log('====================================================\n');

  return report;
}

// Run when executed directly
if (process.argv[1]?.includes('evaluate-rag-retrieval')) {
  runRagRetrievalEvaluation(5)
    .then(async (report) => {
      try {
        await mongoose.disconnect();
        console.log('[MongoDB] Disconnected from database.');
      } catch {}
      process.exit(report.passedThresholds ? 0 : 1);
    })
    .catch(async (err) => {
      console.error('Fatal evaluation failure:', err);
      try {
        await mongoose.disconnect();
      } catch {}
      process.exit(1);
    });
}
