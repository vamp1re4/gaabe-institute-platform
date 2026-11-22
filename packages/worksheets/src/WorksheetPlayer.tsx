import { useEffect, useMemo, useState } from 'react';
import { T, useI18n } from '@gaabe/i18n';
import { ReadAloudToolbar } from '@gaabe/speech';
import { Badge, Button, Notice, ProgressBar } from '@gaabe/ui';
import { countAnswered, gradeWorksheet } from './grade';
import type { Answer, Answers, Question, QuestionResult, Worksheet, WorksheetResult } from './types';

const storageKey = (id: string) => `gaabe.worksheet.${id}`;

function loadSaved(id: string): { answers: Answers; submitted: boolean } {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) return JSON.parse(raw) as { answers: Answers; submitted: boolean };
  } catch {
    /* ignore corrupt or unavailable storage */
  }
  return { answers: {}, submitted: false };
}

export interface WorksheetPlayerProps {
  worksheet: Worksheet;
  /** Called with the result after the student submits. */
  onSubmitted?: (result: WorksheetResult) => void;
}

export function WorksheetPlayer({ worksheet, onSubmitted }: WorksheetPlayerProps) {
  const { t } = useI18n();
  const [state, setState] = useState(() => loadSaved(worksheet.id));
  const { answers, submitted } = state;

  useEffect(() => {
    setState(loadSaved(worksheet.id));
  }, [worksheet.id]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey(worksheet.id), JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, worksheet.id]);

  const result = useMemo(() => (submitted ? gradeWorksheet(worksheet, answers) : null), [submitted, worksheet, answers]);
  const answered = countAnswered(worksheet, answers);
  const setAnswer = (id: string, value: Answer) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [id]: value } }));

  function submit() {
    if (!window.confirm(t('worksheet.confirmSubmit'))) return;
    setState((s) => ({ ...s, submitted: true }));
    onSubmitted?.(gradeWorksheet(worksheet, answers));
  }

  function retry() {
    setState({ answers: {}, submitted: false });
  }

  return (
    <form className="stack" onSubmit={(e) => e.preventDefault()} aria-label={worksheet.title}>
      <Notice>
        <T k="worksheet.demoGrading" />
      </Notice>
      {worksheet.instructions && <p>{worksheet.instructions}</p>}

      {!submitted && (
        <div className="row row-between" aria-live="polite">
          <span>
            <T k="worksheet.answered" vars={{ answered, total: worksheet.questions.length }} />
          </span>
          <span className="muted">
            <T k="worksheet.autosaved" />
          </span>
        </div>
      )}

      {result && (
        <div className="card" role="status">
          <h2>
            <T k="worksheet.score" vars={{ score: result.earned, max: result.gradedMax }} />
          </h2>
          <ProgressBar value={result.gradedMax ? (result.earned / result.gradedMax) * 100 : 0} label={t('common.progress')} />
          {result.pendingReview > 0 && (
            <p className="muted">
              <T k="worksheet.pendingReview" /> ({result.pendingReview})
            </p>
          )}
          <Button variant="ghost" onClick={retry}>
            <T k="worksheet.retry" />
          </Button>
        </div>
      )}

      {worksheet.questions.map((q, i) => {
        const r = result?.results.find((x) => x.questionId === q.id);
        return (
          <QuestionCard
            key={q.id}
            q={q}
            n={i + 1}
            total={worksheet.questions.length}
            answer={answers[q.id]}
            onChange={(v) => setAnswer(q.id, v)}
            locked={submitted}
            result={r}
          />
        );
      })}

      {!submitted && (
        <Button onClick={submit} disabled={answered === 0}>
          <T k="worksheet.submit" />
        </Button>
      )}
    </form>
  );
}

function VerdictBadge({ r }: { r: QuestionResult }) {
  if (r.verdict === 'correct') return <Badge><T k="worksheet.correct" /></Badge>;
  if (r.verdict === 'partial') return <Badge tone="gold"><T k="worksheet.partial" /></Badge>;
  if (r.verdict === 'pending') return <Badge tone="muted"><T k="worksheet.pendingReview" /></Badge>;
  if (r.verdict === 'unanswered') return <Badge tone="muted">—</Badge>;
  return <Badge tone="danger"><T k="worksheet.incorrect" /></Badge>;
}

interface QCardProps {
  q: Question;
  n: number;
  total: number;
  answer: Answer;
  onChange: (v: Answer) => void;
  locked: boolean;
  result?: QuestionResult;
}

function QuestionCard({ q, n, total, answer, onChange, locked, result }: QCardProps) {
  const { t } = useI18n();
  const legendId = `q-${q.id}-prompt`;
  return (
    <fieldset className="card" disabled={locked} style={{ minInlineSize: 0 }}>
      <div className="row row-between">
        <span className="muted">
          <T k="worksheet.question" vars={{ n, total }} /> · <T k="worksheet.points" vars={{ n: q.points }} />
        </span>
        {result && <VerdictBadge r={result} />}
      </div>
      <legend id={legendId} style={{ fontWeight: 700, paddingInline: 0, marginBlock: 8 }}>
        <span lang={q.promptLang} dir={q.promptLang === 'dv' || q.promptLang === 'ar' ? 'rtl' : 'ltr'}>
          {q.prompt}
        </span>
      </legend>
      <ReadAloudToolbar
        compact
        queueId={`ws-${q.id}`}
        label={t('speech.readAloud')}
        segments={[{ id: `ws-${q.id}-p`, text: q.prompt, lang: q.promptLang }]}
      />
      <div className="stack" style={{ marginBlockStart: 12 }}>
        <Input q={q} answer={answer} onChange={onChange} locked={locked} result={result} labelledBy={legendId} />
      </div>
      {result && q.explanation && result.verdict !== 'unanswered' && (
        <p className="muted" style={{ marginBlockStart: 12 }}>
          {q.explanation}
        </p>
      )}
    </fieldset>
  );
}

function Input({
  q,
  answer,
  onChange,
  locked,
  result,
  labelledBy,
}: Omit<QCardProps, 'n' | 'total'> & { labelledBy: string }) {
  const { t } = useI18n();
  const show = locked && result;

  switch (q.type) {
    case 'mcq':
      return (
        <div role="radiogroup" aria-labelledby={labelledBy} className="stack">
          {q.options.map((o) => (
            <label
              key={o.id}
              className={`choice ${show && o.id === q.correct ? 'is-correct' : ''} ${
                show && answer === o.id && o.id !== q.correct ? 'is-wrong' : ''
              }`}
            >
              <input type="radio" name={q.id} checked={answer === o.id} onChange={() => onChange(o.id)} />
              <span>{o.text}</span>
            </label>
          ))}
        </div>
      );
    case 'multi': {
      const chosen = Array.isArray(answer) ? answer : [];
      return (
        <div role="group" aria-labelledby={labelledBy} className="stack">
          {q.options.map((o) => (
            <label key={o.id} className={`choice ${show && q.correct.includes(o.id) ? 'is-correct' : ''}`}>
              <input
                type="checkbox"
                checked={chosen.includes(o.id)}
                onChange={(e) =>
                  onChange(e.target.checked ? [...chosen, o.id] : chosen.filter((x) => x !== o.id))
                }
              />
              <span>{o.text}</span>
            </label>
          ))}
        </div>
      );
    }
    case 'truefalse':
      return (
        <div role="radiogroup" aria-labelledby={labelledBy} className="row">
          {[true, false].map((v) => (
            <label key={String(v)} className="choice" style={{ flex: '1 1 8rem' }}>
              <input type="radio" name={q.id} checked={answer === v} onChange={() => onChange(v)} />
              <span>{v ? t('worksheet.trueLabel') : t('worksheet.falseLabel')}</span>
            </label>
          ))}
        </div>
      );
    case 'short':
      return (
        <div className="field">
          <label className="sr-only" htmlFor={`in-${q.id}`}>
            {t('worksheet.typeAnswer')}
          </label>
          <input
            id={`in-${q.id}`}
            type="text"
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('worksheet.typeAnswer')}
          />
          {show && result.verdict === 'incorrect' && (
            <span className="muted">→ {q.accepted[0]}</span>
          )}
        </div>
      );
    case 'essay':
      return (
        <div className="field">
          <label className="sr-only" htmlFor={`in-${q.id}`}>
            {t('worksheet.typeAnswer')}
          </label>
          <textarea
            id={`in-${q.id}`}
            value={typeof answer === 'string' ? answer : ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={t('worksheet.typeAnswer')}
          />
        </div>
      );
    case 'match': {
      const given = (answer && typeof answer === 'object' && !Array.isArray(answer) ? answer : {}) as Record<string, string>;
      return (
        <div className="stack">
          {q.left.map((l) => (
            <div key={l.id} className="row" style={{ alignItems: 'stretch' }}>
              <span style={{ flex: '1 1 10rem' }}>{l.text}</span>
              <select
                style={{ flex: '1 1 10rem' }}
                aria-label={`${l.text}: ${t('worksheet.matchChoose')}`}
                value={given[l.id] ?? ''}
                onChange={(e) => onChange({ ...given, [l.id]: e.target.value })}
              >
                <option value="">{t('worksheet.matchChoose')}</option>
                {q.right.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.text}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }
    case 'order': {
      // Initial display order is the authored item order; students reorder with buttons (keyboard + touch friendly).
      const seq = Array.isArray(answer) && answer.length === q.items.length ? answer : q.items.map((i) => i.id);
      const move = (idx: number, dir: -1 | 1) => {
        const next = [...seq];
        const j = idx + dir;
        if (j < 0 || j >= next.length) return;
        [next[idx], next[j]] = [next[j]!, next[idx]!];
        onChange(next);
      };
      return (
        <ol className="stack" style={{ paddingInlineStart: 20 }}>
          {seq.map((id, idx) => {
            const item = q.items.find((i) => i.id === id);
            return (
              <li key={id}>
                <div className="row">
                  <span style={{ flex: '1 1 10rem' }}>{item?.text}</span>
                  <Button size="sm" variant="ghost" aria-label={`${t('worksheet.moveUp')}: ${item?.text}`} onClick={() => move(idx, -1)} disabled={idx === 0}>
                    ↑
                  </Button>
                  <Button size="sm" variant="ghost" aria-label={`${t('worksheet.moveDown')}: ${item?.text}`} onClick={() => move(idx, 1)} disabled={idx === seq.length - 1}>
                    ↓
                  </Button>
                </div>
              </li>
            );
          })}
        </ol>
      );
    }
  }
}
