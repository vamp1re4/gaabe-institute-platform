import { Link } from 'react-router-dom';
import { C, T, type MessageKey } from '@gaabe/i18n';
import { Badge, Lang } from '@gaabe/ui';
import { usePublishedCourses } from '../production-content';

const BENEFITS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'home.benefit.interactive.title', body: 'home.benefit.interactive.body' },
  { title: 'home.benefit.listen.title', body: 'home.benefit.listen.body' },
  { title: 'home.benefit.bilingual.title', body: 'home.benefit.bilingual.body' },
  { title: 'home.benefit.progress.title', body: 'home.benefit.progress.body' },
];

export function Home() {
  const { courses, loading } = usePublishedCourses();
  return (
    <>
      <section className="hero spatial-hero" aria-labelledby="hero-title">
        <div className="container hero-content">
          <p style={{ margin: 0, color: 'var(--gold-300)', fontWeight: 700 }}>
            <T k="brand.tagline" />
          </p>
          <h1 id="hero-title">
            <T k="home.hero.title" />
          </h1>
          <p>
            <T k="home.hero.subtitle" />
          </p>
          <div className="row">
            <Link className="btn btn-gold" to="/courses">
              <T k="home.hero.cta" />
            </Link>
            <Link className="btn btn-ghost" to="/pricing">
              <T k="home.hero.cta2" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container page" aria-labelledby="featured">
        <h2 id="featured">
          <T k="home.featured" />
        </h2>
        <div className="card-rail" aria-label="Featured courses">
          {courses.slice(0, 3).map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="card glass-frosted card-link">
              <div className="row" style={{ marginBlockEnd: 8 }}>
                <Badge tone={c.access_tier === 'free' ? 'default' : 'gold'}>{c.access_tier === 'free' ? <T k="common.free" /> : <T k="common.premium" />}</Badge>
              </div>
              <h3><Lang>{c.title}</Lang></h3>
              <p className="muted"><Lang>{c.summary}</Lang></p>
            </Link>
          ))}
          {!loading && courses.length === 0 && <p className="muted"><C>Published courses will appear here after client approval.</C></p>}
        </div>
      </section>

      <section className="container page" style={{ paddingBlockStart: 0 }} aria-labelledby="why">
        <h2 id="why">
          <T k="home.benefits" />
        </h2>
        <div className="grid benefit-grid">
          {BENEFITS.slice(0, 3).map((b) => (
            <div key={b.title} className="card glass-frosted benefit-card">
              <h3>
                <T k={b.title} />
              </h3>
              <p className="muted">
                <T k={b.body} />
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
