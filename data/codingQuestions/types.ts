export interface TestCaseSeed {
  testCaseId: string;
  visibility: 'PUBLIC' | 'HIDDEN';
  input: string;
  expectedOutput: string;
  isActive: boolean;
}

export interface ExampleSeed {
  input: string;
  output: string;
  explanation?: string;
}

export interface QuestionSeed {
  slug: string;
  legacyId?: number;
  title: string;
  description: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  category: string;
  categoryLabel?: string;
  tags: string[];
  constraints: string[];
  inputFormat: string;
  outputFormat: string;
  examples: ExampleSeed[];
  starterCode: Record<string, string>;
  supportedLanguages?: string[];
  timeLimitMs?: number;
  memoryLimitMb?: number;
  testCases: TestCaseSeed[];
  isActive?: boolean;
  source?: string;
  company?: string;
  acceptance?: string;
  timeComplexity?: string;
  spaceComplexity?: string;
}
