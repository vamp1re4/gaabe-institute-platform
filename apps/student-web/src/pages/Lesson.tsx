import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { makeDemoToneUrl, ReadAloudToolbar, toSegments, useReadingSegmentId, type SpeechSegment } from '@gaabe/speech';
import { Badge, Button, Lang, Notice } from '@gaabe/ui';
import { findLesson, findWorksheet, type ContentBlock } from '@gaabe/demo-data';
import { useProgress, useSubscription } from '../state';

const dirFor = (lang: string) => (lang === 'dv' || lang === 'ar' ? 'rtl' : 'ltr');

function Block({ block, reading }: { block: ContentBlock; reading: boolean }) {
  return (
    <div>
      <p
        lang={block.lang === 'dv' ? 'dv' : block.lang}
        dir={dirFor(block.lang)}
        className={reading ? 'reading-now' : undefined}
        style={{ fontSize: '1.1rem' }}
      >
        {block.text}
      </p>
      {block.unverified && (
        <Badge tone="muted">
          <T k="common.demo" /> · unverified
        </Badge>
      )}
    </div>
  );
}

export function LessonPage() {
  const { courseId, lessonId } = useParams();
  const { t } = useI18n();
  const found = findLesson(courseId, lessonId);
  const { isDone, toggle } = useProgress();
  const { active } = useSubscription();

  // Placeholder tone standing in for a teacher recording (NOT a real recording).
  const [demoAudio, setDemoAudio] = useState<string | null>(null);
  const wantsAudio = found?.lesson.hasDemoTeacherAudio === true;
  useEffect(() => {
    if (!wantsAudio) return;
    const url = makeDemoToneUrl();
    setDemoAudio(url);
    return () => URL.revokeObjectURL(url);
  }, [wantsAudio, lessonId]);

  const lesson = found?.lesson;
  const queueId = `lesson-${lesson?.id ?? 'none'}`;
  const segments = useMemo<SpeechSegment[]>(
    () => (lesson ? lesson.blocks.flatMap((b) => toSegments(b.id, b.text, b.lang)) : []),
    [lesson],
  );
  const readingId = useReadingSegmentId(queueId);

  if (!found || !lesson) {
    return (
      <div className="container page">
        <h1><T k="courses.notFound" /></h1>
        <Link className="btn" to="/courses"><T k="common.back" /></Link>
      </div>
    );
  }

  const { course, prev, next, index, total } = found;
  const locked = !lesson.free && !active;
  const worksheet = findWorksheet(lesson.worksheetId);

  return (
    <div className="container page stack">
      <div>
        <Link to={`/courses/${course.id}`}>← <Lang>{course.title}</Lang></Link>
        <h1 style={{ marginBlockStart: 8 }}><Lang>{lesson.title}</Lang></h1>
        <p className="muted">
          <T k="lesson.sectionN" vars={{ n: index + 1 }} /> / {total} · {lesson.minutes} min
        </p>
      </div>

      {locked ? (
        <div className="card stack" role="region" aria-label={t('common.locked')}>
          <Badge tone="gold"><T k="common.locked" /></Badge>
          <p><T k="courses.premiumLocked" /></p>
          <Link className="btn btn-gold" style={{ alignSelf: 'start' }} to="/pricing"><T k="home.hero.cta2" /></Link>
        </div>
      ) : (
        <>
          <ReadAloudToolbar queueId={queueId} segments={segments} />
          <article className="card stack" aria-label={lesson.title}>
            {lesson.blocks.map((b) => (
              <Block key={b.id} block={b} reading={readingId !== null && readingId.startsWith(`${b.id}-`)} />
            ))}
          </article>

          {demoAudio && (
            <section className="card stack" aria-labelledby="teacher-audio">
              <h2 id="teacher-audio"><T k="lesson.notes" /> — <T k="speech.mode.teacher" /></h2>
              <Notice><T k="speech.demoAudio" /></Notice>
              <ReadAloudToolbar
                compact
                queueId={`${queueId}-teacher`}
                label={t('speech.play')}
                segments={[{ id: `${lesson.id}-teacher`, text: '', lang: 'en', audioUrl: demoAudio, audioKind: 'teacher' }]}
              />
            </section>
          )}

          {worksheet && (
            <Link className="btn btn-ghost" style={{ alignSelf: 'start' }} to={`/worksheets/${worksheet.id}`}>
              <Lang>{worksheet.title}</Lang>
            </Link>
          )}

          <div className="row row-between">
            <Button variant={isDone(lesson.id) ? 'ghost' : 'primary'} aria-pressed={isDone(lesson.id)} onClick={() => toggle(lesson.id)}>
              {isDone(lesson.id) ? '✓ ' : ''}
              <T k={isDone(lesson.id) ? 'lesson.completed' : 'lesson.markComplete'} />
            </Button>
          </div>
        </>
      )}

      <nav className="row row-between" aria-label="Lesson navigation">
        {prev ? (
          <Link className="btn btn-ghost" to={`/courses/${course.id}/lessons/${prev.id}`}>
            <span className="flip-rtl" aria-hidden="true">←</span> <T k="common.previous" />
          </Link>
        ) : <span />}
        {next && (
          <Link className="btn btn-ghost" to={`/courses/${course.id}/lessons/${next.id}`}>
            <T k="common.next" /> <span className="flip-rtl" aria-hidden="true">→</span>
          </Link>
        )}
      </nav>
    </div>
  );
}
