import { Link, useParams } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Badge, Lang, ProgressBar } from '@gaabe/ui';
import { findCourse } from '@gaabe/demo-data';
import { useProgress, useSubscription } from '../state';

export function CourseDetail() {
  const { courseId } = useParams();
  const course = findCourse(courseId);
  const { isDone } = useProgress();
  const { active } = useSubscription();

  if (!course || course.status !== 'published') {
    return (
      <div className="container page">
        <h1>
          <T k="courses.notFound" />
        </h1>
        <Link className="btn" to="/courses">
          <T k="common.back" />
        </Link>
      </div>
    );
  }
  const lessons = course.modules.flatMap((m) => m.lessons);
  const doneCount = lessons.filter((l) => isDone(l.id)).length;
  const first = lessons.find((l) => !isDone(l.id)) ?? lessons[0];

  return (
    <div className="container page stack">
      <div>
        <Link to="/courses">← <T k="common.back" /></Link>
        <h1 style={{ marginBlockStart: 8 }}><Lang>{course.title}</Lang></h1>
        <p className="muted"><Lang>{course.summary}</Lang></p>
        <div className="row">
          <Badge tone={course.free ? 'default' : 'gold'}>{course.free ? <T k="common.free" /> : <T k="common.premium" />}</Badge>
          <Badge tone="muted"><Lang>{course.level}</Lang></Badge>
        </div>
      </div>
      <div className="card stack">
        <ProgressBar value={lessons.length ? (doneCount / lessons.length) * 100 : 0} label={`${course.title}: progress`} />
        <p className="muted" style={{ margin: 0 }}>
          {doneCount}/{lessons.length} <T k="common.lessons" />
        </p>
        {first && (
          <Link className="btn" style={{ alignSelf: 'start' }} to={`/courses/${course.id}/lessons/${first.id}`}>
            <T k={doneCount ? 'common.continue' : 'common.start'} />
          </Link>
        )}
      </div>
      <h2><T k="courses.modules" /></h2>
      {course.modules.map((m) => (
        <section key={m.id} className="card" aria-labelledby={m.id}>
          <h3 id={m.id}><Lang>{m.title}</Lang></h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
            {m.lessons.map((l) => {
              const locked = !l.free && !active;
              return (
                <li key={l.id} className="row row-between">
                  <Link to={`/courses/${course.id}/lessons/${l.id}`}>
                    {isDone(l.id) ? '✓ ' : ''}
                    <Lang>{l.title}</Lang>
                  </Link>
                  <span className="row">
                    <span className="muted">{l.minutes} min</span>
                    {locked ? <Badge tone="gold"><T k="common.locked" /></Badge> : l.free ? <Badge><T k="common.free" /></Badge> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
