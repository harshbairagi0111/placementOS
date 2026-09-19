# PlacementOS Centralized RAG Architecture & Ingestion Pipeline

## Overview

In PlacementOS, **MongoDB `RAGKnowledge` is the single canonical source of truth for all curated RAG knowledge**.
JSON files placed in `data/rag/` serve purely as administrative seed/import artifacts; they are **never** queried directly at runtime.
Operational collections (`InterviewExperience`, `SkillQuestion`, `AptitudeQuestion`, `JobPosting`) serve the platform's transactional workflows and are **never directly ingested into `KnowledgeChunk`**.

---

## Architectural Separation of Concerns

| Entity | Role | Persistence | Access Scope |
| :--- | :--- | :--- | :--- |
| **`RAGKnowledge`** | Canonical curated knowledge corpus (questions, concepts, guides) | MongoDB (`ragknowledges`) | Global shared knowledge base |
| **`KnowledgeChunk`** | Processed retrieval and vector representation (chunks + 768d Gemini embeddings) | MongoDB (`knowledgechunks`) | Retrievable via Hybrid Search |
| **Operational Collections** (`InterviewExperience`, `SkillQuestion`, etc.) | User-generated reviews, assessment question pools, recruiter job posts | MongoDB (`interviewexperiences`, `skillquestions`, etc.) | Transactional application features |
| **`StudentMemory`** | Private student conversational memories & profile facts | MongoDB (`studentmemories`) | Isolated to individual student owner |
| **`Conversation` / `Message`** | Private multi-turn chat history | MongoDB (`conversations`, `messages`) | Isolated to individual student owner |

Private student data (`StudentMemory`, `Conversation`, `Message`, resumes, applications) is strictly excluded from `RAGKnowledge` and `KnowledgeChunk`.

---

## Knowledge Flow & Lifecycle

```text
data/rag/*.json (Seed Artifact Batches)
   │
   ▼  (npm run seed:rag - Multi-Batch Seeder)
RAGKnowledge (MongoDB Canonical Source)
   │
   ▼  (npm run ingest:knowledge)
Knowledge Ingestion Service (ingestRAGKnowledge)
   │
   ▼
KnowledgeChunk (Deterministic text chunking & knowledgeId linkage)
   │
   ▼  (Gemini gemini-embedding-2-preview / 768 dimensions)
Gemini Vector Embeddings (with SHA-256 hash caching)
   │
   ▼
Hybrid Retrieval (Vector + Keyword search merging)
   │
   ▼
AI Mentor & Placement Preparation Capabilities
```

---

## Multi-Batch Dataset Seeding System (Fix #11.6.2)

The dataset seeding system (`npm run seed:rag` / `scripts/seedRAGKnowledge.ts`) automatically discovers and ingests all curated dataset batches located in `data/rag/` into the canonical `RAGKnowledge` collection.

### 1. Dynamic Dataset Discovery Rules

* **Target Directory**: `data/rag/`
* **Discovery Logic**: `discoverDatasetFiles(dirPath)` dynamically scans the directory for all regular files ending with `.json`.
* **Ignored Files**:
  - Documentation files (e.g. `README.md`, `*.md`, `*.txt`)
  - Hidden files (names starting with `.`)
  - Temporary or scratch files (names starting with `_` or containing `temp`)
* **Future-Proof**: The system does **not** hardcode batch names. Any newly added batch files (e.g., `placementos_rag_dataset_batch3.json`, `placementos_rag_dataset_batch4.json`) are automatically discovered and processed without any code changes to the seed scripts.

### 2. Dataset File Structure & Naming Conventions

* **Recommended Naming**: `placementos_rag_dataset_batch<N>.json` (e.g. `batch1.json`, `batch2.json`, `batch3.json`)
* **Standard Manifest Format**:

```json
{
  "datasetName": "PlacementOS RAG Dataset Batch 2",
  "version": "1.0.0",
  "description": "Curated Tier-1 placement preparation knowledge...",
  "records": [
    {
      "sourceId": "rag-batch2-sysdes-001",
      "sourceType": "rag_knowledge",
      "category": "technical",
      "title": "System Design: Distributed Caching Invalidation & Strategies",
      "content": "Concept: Distributed Caching Strategies...",
      "skills": ["System Design", "Distributed Systems", "Caching", "Redis"],
      "roles": ["Software Engineer", "Backend Developer"],
      "tags": ["system_design", "distributed_systems", "caching"],
      "difficulty": "Advanced",
      "status": "active",
      "version": "1.0.0",
      "metadata": { "domain": "system_design", "subtopic": "caching" }
    }
  ]
}
```

* **Backward Compatibility**: If a dataset file contains a raw JSON array (`[...]`), the seeder automatically wraps it in a manifest structure using the filename as `datasetName` and the first record's version as default version.

### 3. How to Add Future Batches (e.g., Batch 3)

Adding a new dataset batch to PlacementOS requires zero TypeScript or script changes:

1. Create the new dataset JSON file in `data/rag/`:
   ```bash
   data/rag/placementos_rag_dataset_batch3.json
   ```
2. Populate it with the standard manifest JSON schema and valid records.
3. Run the seeder:
   ```bash
   npm run seed:rag
   ```
4. The seeder will automatically discover `batch1.json`, `batch2.json`, and `batch3.json`. It will verify that Batch 1 and Batch 2 are unchanged, insert the new records from Batch 3 into `RAGKnowledge`, and display the consolidated report.
5. Ingest newly seeded records into the retrieval vector space:
   ```bash
   npm run ingest:knowledge
   ```

### 4. Consolidated Reporting Format

At the completion of seeding, `seedRAGKnowledge` generates a structured, dataset-level report:

```text
====================================================
            RAG DATASET SEEDING COMPLETE            
====================================================
Datasets discovered: 2

placementos_rag_dataset_batch1.json (PlacementOS RAG Dataset Batch 1):
  processed: 82
  inserted: 0
  updated: 0
  unchanged: 82
  skipped: 0
  failed: 0

placementos_rag_dataset_batch2.json (PlacementOS RAG Dataset Batch 2):
  processed: 20
  inserted: 20
  updated: 0
  unchanged: 0
  skipped: 0
  failed: 0

Total:
  processed: 102
  inserted: 20
  updated: 0
  unchanged: 82
  skipped: 0
  failed: 0
====================================================
```

### 5. Idempotency & Change Detection Rules

* **Canonical Compound Key**: `{ sourceId: 1, version: 1 }`
* **Change Detection**: When a record with an existing `(sourceId, version)` is encountered, the seeder compares all payload fields (`content`, `title`, `category`, `sourceType`, `status`, `difficulty`, `skills`, `roles`, `tags`, `metadata`).
  - If identical: Marked as `unchanged` with zero database writes.
  - If modified: Atomic update executed in MongoDB and marked as `updated`.
  - If new: Inserted into MongoDB and marked as `inserted`.
* **Zero Duplicates**: Rerunning `npm run seed:rag` produces `inserted: 0`, `updated: 0`, and `unchanged: totalProcessed`.

### 6. Cross-Batch Duplicates and Conflict Detection

* If two dataset files contain identical records with the same `(sourceId, version)`, the second occurrence is recognized as a duplicate and treated as `unchanged`.
* If two dataset files contain the same `(sourceId, version)` with **conflicting content or metadata**, the seeder:
  1. Issues an explicit warning: `[Conflict Warning] Record <sourceId> (v<version>) in <file2> conflicts with <file1>`.
  2. Records the conflict in `report.conflicts` and `report.errors`.
  3. Skips the conflicting record to prevent silently overwriting or nondeterministically choosing data.

### 7. Resilient Error Handling

* **Malformed JSON**: If a file contains invalid JSON syntax, it is marked as `failed = 1` with the exact syntax error. The seeder safely continues processing the remaining valid dataset files.
* **Invalid Dataset Structure**: If a file is missing mandatory top-level fields (`datasetName`, `version`, or `records`), the issue is reported and other files continue processing.
* **Exit Code Discipline**: When run via CLI (`npm run seed:rag`), the process exits with status code `1` if any file failed, ensuring CI/CD pipeline visibility while preserving valid database state.

### 8. Strict Separation of Seeding and Embedding Ingestion

* **`seed:rag`** (`scripts/seedRAGKnowledge.ts`): Responsible **only** for reading JSON files and synchronizing records into MongoDB `RAGKnowledge`. It **never** invokes the Gemini Embedding API and **never** mutates the `KnowledgeChunk` collection.
* **`ingest:knowledge`** (`scripts/ingestKnowledgeChunks.ts` / `knowledgeIngestionService.ts`): The sole pipeline responsible for reading canonical active documents from `RAGKnowledge`, creating text chunks, computing SHA-256 hashes, generating 768-dimensional Gemini embeddings, and persisting into `KnowledgeChunk`.

---

## Verification Suite

Execute the complete RAG dataset and multi-batch validation test suite:

```bash
npm run test:rag-dataset
```

The suite runs 7 verification suites covering:
1. **Dataset Validation Rules**: Required fields, valid enum categories, difficulty sanitization.
2. **MongoDB Seeding & Idempotency**: Atomic upserts, duplicate prevention, update detection.
3. **Ingestion & KnowledgeChunk Linking**: Deterministic chunk generation, `knowledgeId` linkage, SHA-256 embedding caching.
4. **Prohibited Operational Ingestion**: Guaranteed blockage of `InterviewExperience`, `SkillQuestion`, `AptitudeQuestion`, `JobPosting` from `KnowledgeChunk`.
5. **Data Isolation & Privacy**: Confirmation that student memories and private conversations never enter `RAGKnowledge`.
6. **Regression Testing**: Verification of AI Mentor RAG retrieval and response generation.
7. **Multi-Batch Seeding & Resilience**: Dynamic directory discovery, Batch 1 & 2 coexistence, non-data file filtering, malformed file error handling, conflict detection, and embedding separation.
