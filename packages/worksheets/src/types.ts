import type { SpeechLang } from '@gaabe/speech';

/**
 * Worksheet model. In production the answer key (`correct`, `accepted`, `pairs`, `order`) MUST stay
 * server-side and grading must be server-authoritative. This front-end prototype grades locally only
 * so the interaction can be exercised; the UI says so.
 */
interface Base {
  id: string;
  prompt: string;
  promptLang: SpeechLang;
  points: number;
  explanation?: string;
}

export interface McqQuestion extends Base {
  type: 'mcq';
  options: { id: string; text: string }[];
  correct: string;
}
export interface MultiQuestion extends Base {
  type: 'multi';
  options: { id: string; text: string }[];
  correct: string[];
}
export interface TrueFalseQuestion extends Base {
  type: 'truefalse';
  correct: boolean;
}
export interface ShortQuestion extends Base {
  type: 'short';
  /** Normalised comparison (case, spacing, surrounding punctuation ignored). */
  accepted: string[];
}
export interface MatchQuestion extends Base {
  type: 'match';
  left: { id: string; text: string }[];
  right: { id: string; text: string }[];
  /** leftId -> rightId */
  pairs: Record<string, string>;
}
export interface OrderQuestion extends Base {
  type: 'order';
  items: { id: string; text: string }[];
  /** Correct sequence of item ids. */
  order: string[];
}
export interface EssayQuestion extends Base {
  type: 'essay';
}

export type Question =
  | McqQuestion
  | MultiQuestion
  | TrueFalseQuestion
  | ShortQuestion
  | MatchQuestion
  | OrderQuestion
  | EssayQuestion;

export interface Worksheet {
  id: string;
  title: string;
  instructions?: string;
  questions: Question[];
}

export type Answer = string | string[] | boolean | Record<string, string> | undefined;
export type Answers = Record<string, Answer>;

export type Verdict = 'correct' | 'partial' | 'incorrect' | 'pending' | 'unanswered';

export interface QuestionResult {
  questionId: string;
  verdict: Verdict;
  earned: number;
  max: number;
}

export interface WorksheetResult {
  results: QuestionResult[];
  earned: number;
  /** Maximum over auto-gradable questions only. */
  gradedMax: number;
  /** Maximum over all questions including those awaiting review. */
  totalMax: number;
  pendingReview: number;
}
