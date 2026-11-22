import { describe, expect, it } from 'vitest';
import { countAnswered, gradeQuestion, gradeWorksheet, normalizeText } from './grade';
import type { Question, Worksheet } from './types';

const base = { promptLang: 'en' as const, prompt: 'p' };

const mcq: Question = {
  ...base, id: 'q1', type: 'mcq', points: 2,
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }], correct: 'b',
};
const multi: Question = {
  ...base, id: 'q2', type: 'multi', points: 4,
  options: [{ id: 'a', text: 'A' }, { id: 'b', text: 'B' }, { id: 'c', text: 'C' }], correct: ['a', 'b'],
};
const tf: Question = { ...base, id: 'q3', type: 'truefalse', points: 1, correct: false };
const short: Question = { ...base, id: 'q4', type: 'short', points: 2, accepted: ['Seven', '7'] };
const match: Question = {
  ...base, id: 'q5', type: 'match', points: 4,
  left: [{ id: 'l1', text: '' }, { id: 'l2', text: '' }],
  right: [{ id: 'r1', text: '' }, { id: 'r2', text: '' }],
  pairs: { l1: 'r1', l2: 'r2' },
};
const order: Question = {
  ...base, id: 'q6', type: 'order', points: 3,
  items: [{ id: 'x', text: '' }, { id: 'y', text: '' }, { id: 'z', text: '' }], order: ['x', 'y', 'z'],
};
const essay: Question = { ...base, id: 'q7', type: 'essay', points: 5 };

describe('gradeQuestion', () => {
  it('grades mcq', () => {
    expect(gradeQuestion(mcq, 'b')).toMatchObject({ verdict: 'correct', earned: 2 });
    expect(gradeQuestion(mcq, 'a')).toMatchObject({ verdict: 'incorrect', earned: 0 });
    expect(gradeQuestion(mcq, undefined)).toMatchObject({ verdict: 'unanswered', earned: 0 });
  });

  it('grades true/false including a false-correct answer', () => {
    expect(gradeQuestion(tf, false)).toMatchObject({ verdict: 'correct', earned: 1 });
    expect(gradeQuestion(tf, true)).toMatchObject({ verdict: 'incorrect' });
  });

  it('short answers ignore case, spacing and edge punctuation', () => {
    expect(gradeQuestion(short, '  SEVEN. ').verdict).toBe('correct');
    expect(gradeQuestion(short, '7').verdict).toBe('correct');
    expect(gradeQuestion(short, 'eight').verdict).toBe('incorrect');
    expect(normalizeText('  Hello,   World! ')).toBe('hello, world');
  });

  it('multi-select gives exact credit, partial credit, and zero for over-selecting', () => {
    expect(gradeQuestion(multi, ['b', 'a'])).toMatchObject({ verdict: 'correct', earned: 4 });
    expect(gradeQuestion(multi, ['a'])).toMatchObject({ verdict: 'partial', earned: 2 });
    expect(gradeQuestion(multi, ['a', 'c'])).toMatchObject({ verdict: 'incorrect', earned: 0 });
    expect(gradeQuestion(multi, ['a', 'b', 'c']).verdict).toBe('partial');
  });

  it('matching awards per correct pair', () => {
    expect(gradeQuestion(match, { l1: 'r1', l2: 'r2' }).verdict).toBe('correct');
    expect(gradeQuestion(match, { l1: 'r1', l2: 'r1' })).toMatchObject({ verdict: 'partial', earned: 2 });
    expect(gradeQuestion(match, { l1: 'r2', l2: 'r1' }).verdict).toBe('incorrect');
  });

  it('ordering awards per item in the right position', () => {
    expect(gradeQuestion(order, ['x', 'y', 'z']).verdict).toBe('correct');
    expect(gradeQuestion(order, ['x', 'z', 'y'])).toMatchObject({ verdict: 'partial', earned: 1 });
  });

  it('essays are never auto-graded', () => {
    expect(gradeQuestion(essay, 'my answer')).toMatchObject({ verdict: 'pending', earned: 0 });
    expect(gradeQuestion(essay, '  ').verdict).toBe('unanswered');
  });
});

describe('gradeWorksheet', () => {
  const ws: Worksheet = { id: 'w', title: 't', questions: [mcq, tf, essay] };

  it('totals scores and excludes essays from the auto-graded maximum', () => {
    const r = gradeWorksheet(ws, { q1: 'b', q3: false, q7: 'text' });
    expect(r.earned).toBe(3);
    expect(r.gradedMax).toBe(3);
    expect(r.totalMax).toBe(8);
    expect(r.pendingReview).toBe(1);
  });

  it('counts answered questions', () => {
    expect(countAnswered(ws, { q1: 'a' })).toBe(1);
    expect(countAnswered(ws, { q1: 'a', q3: false })).toBe(2); // false is an answer
    expect(countAnswered(ws, {})).toBe(0);
  });
});
