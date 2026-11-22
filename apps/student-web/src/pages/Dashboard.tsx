import { Link } from 'react-router-dom';
import { formatDate, T, useI18n } from '@gaabe/i18n';
import { Badge, Button, Lang, Notice, ProgressBar } from '@gaabe/ui';
import { courses, plans } from '@gaabe/demo-data';
import { useDemoUser, useProgress, useSubscription } from '../state';

export function Dashboard() {
  const { locale } = useI18n();
  const { user } = useDemoUser();
  const { done } = useProgress();
  const { planId, reset } = useSubscription();
  const published = courses.filter((c) => c.status === 'published');
  const started = published.filter((c) => c.modules.some((m) => m.lessons.some((l) => l.id in done)));
  const recent = Object.entries(done).sort((a, b) => b[1].localeCompare(a[1])).slice(0, 5);
  const lessonTitle = (id: string) =>
    published.flatMap((c) => c.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, courseId: c.id })))).find((l) => l.id === id);
  const plan = plans.find((p) => p.id === planId);

  return (
    <div className="container page stack">
      <h1><T k="dashboard.title" /></h1>
      {user ? (
        <p><T k="auth.signedInAs" vars={{ name: user.name }} /></p>
      ) : (
        <Notice>
          <Link to="/sign-in"><T k="nav.signIn" /></Link> — <T k="auth.demoNotice" />
        </Notice>
      )}

      <div className="grid">
        <section className="card" aria-labelledby="sub">
          <h2 id="sub"><T k="dashboard.subscription" /></h2>
          {plan && plan.id !== 'free' ? (
            <>
              <p><Badge tone="gold"><T k="pricing.active" /></Badge> <Lang>{plan.name}</Lang></p>
              <Button size="sm" variant="ghost" onClick={reset}><T k="pricing.reset" /></Button>
            </>
          ) : (
            <>
              <p className="muted"><T k="dashboard.noSubscription" /></p>
              <Link className="btn btn-gold btn-sm" to="/pricing"><T k="nav.pricing" /></Link>
            </>
          )}
        </section>
        <section className="card" aria-labelledby="recent">
          <h2 id="recent"><T k="dashboard.recent" /></h2>
          {recent.length === 0 ? (
            <p className="muted"><T k="dashboard.nothing" /></p>
          ) : (
            <ul className="stack" style={{ paddingInlineStart: 18, margin: 0 }}>
              {recent.map(([id, at]) => {
                const l = lessonTitle(id);
                return (
                  <li key={id}>
                    {l ? <Link to={`/courses/${l.courseId}/lessons/${l.id}`}><Lang>{l.title}</Lang></Link> : id}{' '}
                    <span className="muted">{formatDate(locale, at)}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>

      <h2><T k="dashboard.enrolled" /></h2>
      {started.length === 0 ? (
        <p className="muted"><T k="dashboard.nothing" /> <Link to="/courses"><T k="home.hero.cta" /></Link></p>
      ) : (
        <div className="grid">
          {started.map((c) => {
            const ls = c.modules.flatMap((m) => m.lessons);
            const n = ls.filter((l) => l.id in done).length;
            return (
              <Link key={c.id} to={`/courses/${c.id}`} className="card card-link stack">
                <h3><Lang>{c.title}</Lang></h3>
                <ProgressBar value={(n / ls.length) * 100} label={`${c.title}: progress`} />
                <span className="muted">{n}/{ls.length} <T k="common.lessons" /></span>
              </Link>
            );
          })}
        </div>
      )}
      <p className="muted"><T k="common.demoNotice" /></p>
    </div>
  );
}
