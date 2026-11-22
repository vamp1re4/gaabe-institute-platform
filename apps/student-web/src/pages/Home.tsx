import { Link } from 'react-router-dom';
import { T, type MessageKey } from '@gaabe/i18n';
import { Badge, Lang } from '@gaabe/ui';
import { publishedCourses } from '@gaabe/demo-data';

const BENEFITS: { title: MessageKey; body: MessageKey }[] = [
  { title: 'home.benefit.interactive.title', body: 'home.benefit.interactive.body' },
  { title: 'home.benefit.listen.title', body: 'home.benefit.listen.body' },
  { title: 'home.benefit.bilingual.title', body: 'home.benefit.bilingual.body' },
  { title: 'home.benefit.progress.title', body: 'home.benefit.progress.body' },
];

export function Home() {
  return (
    <>
      <section className="hero" aria-labelledby="hero-title">
        <div className="container">
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
        <p className="muted">
          <T k="courses.subtitle" />
        </p>
        <div className="grid">
          {publishedCourses.slice(0, 3).map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="card glass-frosted card-link">
              <div className="row" style={{ marginBlockEnd: 8 }}>
                <Badge tone={c.free ? 'default' : 'gold'}>{c.free ? <T k="common.free" /> : <T k="common.premium" />}</Badge>
                <Badge tone="muted"><Lang>{c.level}</Lang></Badge>
              </div>
              <h3><Lang>{c.title}</Lang></h3>
              <p className="muted"><Lang>{c.summary}</Lang></p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container page" style={{ paddingBlockStart: 0 }} aria-labelledby="why">
        <h2 id="why">
          <T k="home.benefits" />
        </h2>
        <div className="grid">
          {BENEFITS.map((b) => (
            <div key={b.title} className="card glass-frosted">
              <h3>
                <T k={b.title} />
              </h3>
              <p className="muted">
                <T k={b.body} />
              </p>
            </div>
          ))}
        </div>
        <p className="muted" style={{ marginBlockStart: 24 }}>
          <T k="common.dhivehiDraftNotice" />
        </p>
      </section>
    </>
  );
}
