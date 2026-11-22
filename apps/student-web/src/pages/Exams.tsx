import { useEffect, useRef, useState } from 'react';
import { T, useI18n } from '@gaabe/i18n';
import { Button, Lang, Notice } from '@gaabe/ui';
import { findWorksheet, revisionChecklist } from '@gaabe/demo-data';
import { WorksheetPlayer } from '@gaabe/worksheets';
import { KEYS, useStored } from '../state';

const PRACTICE_SECONDS = 5 * 60;

function fmt(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** Browser-only practice timer. NOT a secure or server-authoritative exam clock. */
function PracticeTimer() {
  const { t } = useI18n();
  const [left, setLeft] = useState(PRACTICE_SECONDS);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);

  useEffect(() => {
    if (!running) return;
    // Derive remaining time from a deadline so background-tab throttling does not drift the clock.
    deadline.current = Date.now() + left * 1000;
    const id = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) setRunning(false);
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  return (
    <div className="card stack">
      <p className="muted" style={{ margin: 0 }}>{t('exam.timer')}</p>
      <p className="stat" role="timer" aria-live="off" aria-label={fmt(left)}>{fmt(left)}</p>
      <div className="row">
        <Button size="sm" onClick={() => setRunning((r) => !r)} disabled={left === 0}>
          {running ? t('speech.pause') : t('common.start')}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => { setRunning(false); setLeft(PRACTICE_SECONDS); }}>
          {t('speech.replay')}
        </Button>
      </div>
      {left === 0 && <Notice tone="error">00:00</Notice>}
    </div>
  );
}

export function Exams() {
  const ws = findWorksheet('ws-exam-practice');
  const [checked, setChecked] = useStored<Record<string, boolean>>(KEYS.checklist, {});
  return (
    <div className="container page stack">
      <div>
        <h1><T k="exam.title" /></h1>
        <p className="muted"><T k="exam.subtitle" /></p>
      </div>
      <div className="grid" style={{ alignItems: 'start' }}>
        <PracticeTimer />
        <section className="card" aria-labelledby="checklist">
          <h2 id="checklist"><T k="exam.checklist" /></h2>
          <ul style={{ listStyle: 'none', padding: 0 }} className="stack">
            {revisionChecklist.map((c) => (
              <li key={c.id}>
                <label className="choice">
                  <input type="checkbox" checked={!!checked[c.id]} onChange={(e) => setChecked({ ...checked, [c.id]: e.target.checked })} />
                  <span><Lang>{c.text}</Lang></span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      </div>
      {ws && (
        <section className="stack" aria-labelledby="practice">
          <h2 id="practice"><T k="exam.practice" /></h2>
          <WorksheetPlayer worksheet={ws} />
        </section>
      )}
    </div>
  );
}
