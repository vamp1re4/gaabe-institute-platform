import type {
  Answer,
  Answers,
  Question,
  QuestionResult,
  Verdict,
  Worksheet,
  WorksheetResult,
} from './types';

export function normalizeText(s: string): string {
  return s
    .normalize('NFC')
    .trim()
    .toLocaleLowerCase('en')
    .replace(/[\s ]+/g, ' ')
    .replace(/^[\p{P}\s]+|[\p{P}\s]+$/gu, '');
}

function sameSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sb = new Set(b);
  return a.every((x) => sb.has(x)) && new Set(a).size === a.length;
}

function isAnswered(a: Answer): boolean {
  if (a === undefined || a === null) return false;
  if (typeof a === 'string') return a.trim().length > 0;
  if (Array.isArray(a)) return a.length > 0;
  if (typeof a === 'object') return Object.keys(a).length > 0;
  return true;
}

export function gradeQuestion(q: Question, a: Answer): QuestionResult {
  const base = { questionId: q.id, max: q.points };
  if (q.type === 'essay') {
    return { ...base, verdict: isAnswered(a) ? 'pending' : 'unanswered', earned: 0 };
  }
  if (!isAnswered(a)) return { ...base, verdict: 'unanswered', earned: 0 };

  let verdict: Verdict = 'incorrect';
  let earned = 0;
  switch (q.type) {
    case 'mcq':
      if (a === q.correct) verdict = 'correct';
      break;
    case 'truefalse':
      if (a === q.correct) verdict = 'correct';
      break;
    case 'short': {
      const given = normalizeText(String(a));
      if (q.accepted.some((x) => normalizeText(x) === given)) verdict = 'correct';
      break;
    }
    case 'multi': {
      const chosen = Array.isArray(a) ? a : [];
      if (sameSet(chosen, q.correct)) verdict = 'correct';
      else {
        // Partial credit: +1 per correct pick, −1 per wrong pick, floored at 0.
        const right = chosen.filter((c) => q.correct.includes(c)).length;
        const wrong = chosen.length - right;
        const score = Math.max(0, right - wrong) / q.correct.length;
        if (score > 0) {
          verdict = 'partial';
          earned = Math.round(score * q.points * 100) / 100;
        }
      }
      break;
    }
    case 'match': {
      const given = (a && typeof a === 'object' && !Array.isArray(a) ? a : {}) as Record<string, string>;
      const ids = Object.keys(q.pairs);
      const right = ids.filter((id) => given[id] === q.pairs[id]).length;
      if (right === ids.length) verdict = 'correct';
      else if (right > 0) {
        verdict = 'partial';
        earned = Math.round((right / ids.length) * q.points * 100) / 100;
      }
      break;
    }
    case 'order': {
      const given = Array.isArray(a) ? a : [];
      if (given.length === q.order.length && given.every((id, i) => id === q.order[i])) verdict = 'correct';
      else {
        const right = given.filter((id, i) => id === q.order[i]).length;
        if (right > 0 && given.length === q.order.length) {
          verdict = 'partial';
          earned = Math.round((right / q.order.length) * q.points * 100) / 100;
        }
      }
      break;
    }
  }
  if (verdict === 'correct') earned = q.points;
  return { ...base, verdict, earned };
}

export function gradeWorksheet(ws: Worksheet, answers: Answers): WorksheetResult {
  const results = ws.questions.map((q) => gradeQuestion(q, answers[q.id]));
  const gradedMax = ws.questions.filter((q) => q.type !== 'essay').reduce((n, q) => n + q.points, 0);
  const totalMax = ws.questions.reduce((n, q) => n + q.points, 0);
  const earned = Math.round(results.reduce((n, r) => n + r.earned, 0) * 100) / 100;
  return {
    results,
    earned,
    gradedMax,
    totalMax,
    pendingReview: results.filter((r) => r.verdict === 'pending').length,
  };
}

export function countAnswered(ws: Worksheet, answers: Answers): number {
  return ws.questions.filter((q) => isAnswered(answers[q.id])).length;
}
