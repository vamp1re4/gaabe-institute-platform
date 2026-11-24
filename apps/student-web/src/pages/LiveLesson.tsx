import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Button, Lang, Notice } from '@gaabe/ui';
import { useLiveLessonProgress, usePublishedCourses } from '../production-content';

function textFromBody(body: { content?: unknown }) {
  return typeof body?.content === 'string' ? body.content : '';
}

export function LiveLessonPage() {
  const { courseId, lessonId } = useParams();
  const { courses, loading } = usePublishedCourses(courseId);
  const course = courses[0];
  const lessons = course?.course_modules.flatMap((module) => module.lessons) ?? [];
  const lesson = lessons.find((item) => item.id === lessonId);
  const { completed, markComplete, signedIn } = useLiveLessonProgress(lessons.map((item) => item.id));
  const [error, setError] = useState('');

  if (loading) return <div className="container page"><p className="muted">Loading lesson…</p></div>;
  if (!course || !lesson) return <div className="container page"><h1><T k="courses.notFound" /></h1><Link className="btn" to="/courses"><T k="common.back" /></Link></div>;

  const currentLesson = lesson;
  const index = lessons.findIndex((item) => item.id === currentLesson.id);
  const previous = lessons[index - 1];
  const next = lessons[index + 1];
  const body = textFromBody(currentLesson.body);
  async function complete() {
    setError('');
    try { await markComplete(currentLesson.id); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Progress could not be saved.'); }
  }

  return <div className="container page stack">
    <div>
      <Link to={`/courses/${course.id}`}>← <Lang>{course.title}</Lang></Link>
      <h1 style={{ marginBlockStart: 8 }}><Lang>{currentLesson.title}</Lang></h1>
      {currentLesson.duration_minutes && <p className="muted">{currentLesson.duration_minutes} min</p>}
    </div>
    <article className="card stack" aria-label={currentLesson.title}>
      {body ? <p style={{ whiteSpace: 'pre-wrap' }}><Lang>{body}</Lang></p> : <Notice>This lesson has no written content yet.</Notice>}
    </article>
    {!signedIn && <Notice><Link to="/sign-in"><T k="nav.signIn" /></Link> to save your progress.</Notice>}
    {error && <Notice tone="error">{error}</Notice>}
    <Button disabled={!signedIn || Boolean(completed[currentLesson.id])} onClick={() => void complete()} style={{ alignSelf: 'start' }}>
      {completed[currentLesson.id] ? '✓ ' : ''}<T k={completed[currentLesson.id] ? 'lesson.completed' : 'lesson.markComplete'} />
    </Button>
    <nav className="row row-between" aria-label="Lesson navigation">
      {previous ? <Link className="btn btn-ghost" to={`/courses/${course.id}/lessons/${previous.id}`}><T k="common.previous" /></Link> : <span />}
      {next ? <Link className="btn btn-ghost" to={`/courses/${course.id}/lessons/${next.id}`}><T k="common.next" /></Link> : <span />}
    </nav>
  </div>;
}
