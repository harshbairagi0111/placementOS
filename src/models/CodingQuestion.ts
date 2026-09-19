import mongoose, { Schema, Document, Model } from 'mongoose';

export type CodingDifficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type TestCaseVisibility = 'PUBLIC' | 'HIDDEN';

export interface ICodingTestCase {
  testCaseId: string;
  visibility: TestCaseVisibility;
  input: string;
  expectedOutput: string;
  isActive: boolean;
}

export interface ICodingExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface ICodingQuestion extends Document {
  slug: string;
  title: string;
  description: string;
  difficulty: CodingDifficulty;
  category: string;
  tags: string[];
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  examples: ICodingExample[];
  starterCode: Record<string, string>;
  supportedLanguages: string[];
  timeLimitMs: number;
  memoryLimitMb: number;
  testCases: ICodingTestCase[];
  isActive: boolean;
  source: string;
  company?: string;
  categoryLabel?: string;
  acceptance?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
  legacyId?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CodingTestCaseSchema = new Schema<ICodingTestCase>(
  {
    testCaseId: { type: String, required: true },
    visibility: { type: String, enum: ['PUBLIC', 'HIDDEN'], required: true, default: 'HIDDEN' },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const CodingExampleSchema = new Schema<ICodingExample>(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const CodingQuestionSchema = new Schema<ICodingQuestion>(
  {
    slug: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      required: true,
      index: true,
    },
    category: { type: String, required: true, index: true, trim: true },
    tags: { type: [String], default: [] },
    constraints: { type: [String], default: [] },
    inputFormat: { type: String, default: '' },
    outputFormat: { type: String, default: '' },
    examples: { type: [CodingExampleSchema], default: [] },
    starterCode: { type: Map, of: String, default: {} },
    supportedLanguages: {
      type: [String],
      default: ['cpp', 'python', 'java', 'javascript', 'typescript', 'c', 'go', 'rust'],
    },
    timeLimitMs: { type: Number, default: 2000 },
    memoryLimitMb: { type: Number, default: 256 },
    testCases: { type: [CodingTestCaseSchema], default: [] },
    isActive: { type: Boolean, default: true, index: true },
    source: { type: String, default: 'PLACEMENTOS_CURATED' },
    company: { type: String, default: '' },
    categoryLabel: { type: String, default: '' },
    acceptance: { type: String, default: '' },
    timeComplexity: { type: String, default: '' },
    spaceComplexity: { type: String, default: '' },
    legacyId: { type: Number, index: true, sparse: true },
  },
  { timestamps: true }
);

export const CodingQuestion: Model<ICodingQuestion> =
  (mongoose.models.CodingQuestion as Model<ICodingQuestion>) ||
  mongoose.model<ICodingQuestion>('CodingQuestion', CodingQuestionSchema);
