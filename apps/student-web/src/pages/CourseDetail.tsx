import { Link, useParams } from 'react-router-dom';
import { C, T } from '@gaabe/i18n';
import { Badge, Lang } from '@gaabe/ui';
import { useLiveLessonProgress, usePublishedCourses } from '../production-content';

export function CourseDetail() {
  const { courseId } = useParams();
  const { courses, loading } = usePublishedCourses(courseId);
  const course = courses[0];
  const lessons = course?.course_modules.flatMap((m) => m.lessons) ?? [];
  const { completed } = useLiveLessonProgress(lessons.map((lesson) => lesson.id));

  if (!loading && !course) {
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
  if (!course) return <div className="container page"><p className="muted"><C>Loading course…</C></p></div>;

  return (
    <div className="container page stack">
      <div>
        <Link to="/courses">← <T k="common.back" /></Link>
        <h1 style={{ marginBlockStart: 8 }}><Lang>{course.title}</Lang></h1>
        <p className="muted"><Lang>{course.summary}</Lang></p>
        <div className="row">
          <Badge tone={course.access_tier === 'free' ? 'default' : 'gold'}>{course.access_tier === 'free' ? <T k="common.free" /> : <T k="common.premium" />}</Badge>
        </div>
      </div>
      {course.teacher && <section className="card stack" aria-label="Teacher information">
        <h2>{course.teacher.teacher_name}</h2>
        {course.teacher.teacher_bio && <p className="muted">{course.teacher.teacher_bio}</p>}
        {course.teacher.contact_email && <a href={`mailto:${course.teacher.contact_email}`}>{course.teacher.contact_email}</a>}
      </section>}
      <p className="muted">{lessons.length} <T k="common.lessons" /></p>
      <h2><T k="courses.modules" /></h2>
      {course.course_modules.map((m) => (
        <section key={m.id} className="card" aria-labelledby={m.id}>
          <h3 id={m.id}><Lang>{m.title}</Lang></h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">
            {m.lessons.map((l) => {
              return (
                <li key={l.id} className="row row-between">
                  <Link to={`/courses/${course.id}/lessons/${l.id}`}><Lang>{l.title}</Lang></Link>
                  <span className="row">
                    {completed[l.id] && <span aria-label="Completed">✓</span>}
                    {l.duration_minutes && <span className="muted">{l.duration_minutes} <C>min</C></span>}
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
