import { Link } from 'react-router-dom';
import { C, T } from '@gaabe/i18n';
import { Notice, ProgressBar } from '@gaabe/ui';
import { useProductionUser } from '../production-auth';
import { useLiveLessonProgress, usePublishedCourses } from '../production-content';

export function Dashboard() {
  const user = useProductionUser();
  const { courses, loading } = usePublishedCourses();
  const lessons = courses.flatMap((course) => course.course_modules.flatMap((module) => module.lessons.map((lesson) => ({ ...lesson, course }))));
  const { completed } = useLiveLessonProgress(lessons.map((lesson) => lesson.id));

  return <div className="container page stack">
    <h1><T k="dashboard.title" /></h1>
    {!user && <Notice><Link to="/sign-in"><T k="nav.signIn" /></Link> <C>to save your learning progress across devices.</C></Notice>}
    {loading ? <p className="muted"><C>Loading learning progress…</C></p> : courses.length === 0 ? <p className="muted"><C>No approved courses are available yet.</C></p> : <>
      <h2><T k="dashboard.enrolled" /></h2>
      <div className="grid">
        {courses.map((course) => {
          const courseLessons = course.course_modules.flatMap((module) => module.lessons);
          const complete = courseLessons.filter((lesson) => completed[lesson.id]).length;
          return <Link key={course.id} to={`/courses/${course.id}`} className="card card-link stack">
            <h3>{course.title}</h3>
            <ProgressBar value={courseLessons.length ? (complete / courseLessons.length) * 100 : 0} label={`${course.title}: progress`} />
            <span className="muted">{complete}/{courseLessons.length} <T k="common.lessons" /></span>
          </Link>;
        })}
      </div>
    </>}
  </div>;
}
