import { QuestionSeed } from './types';
import { arrayQuestions } from './arrays';
import { stringQuestions } from './strings';
import { searchingSortingQuestions } from './searchingSorting';
import { hashingQuestions } from './hashing';
import { stackQueueQuestions } from './stackQueue';
import { linkedListQuestions } from './linkedList';
import { treeQuestions } from './trees';
import { recursionBacktrackingQuestions } from './recursionBacktracking';
import { dynamicProgrammingQuestions } from './dynamicProgramming';
import { advancedLegacyQuestions } from './advancedLegacy';

export * from './types';

export const allCodingQuestions: QuestionSeed[] = [
  ...arrayQuestions,
  ...stringQuestions,
  ...searchingSortingQuestions,
  ...hashingQuestions,
  ...stackQueueQuestions,
  ...linkedListQuestions,
  ...treeQuestions,
  ...recursionBacktrackingQuestions,
  ...dynamicProgrammingQuestions,
  ...advancedLegacyQuestions,
];
