import { useState } from 'react';
import { Link } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { Badge, Button, Lang } from '@gaabe/ui';
import { usePublishedCourses } from '../production-content';

type Filter = 'all' | 'free' | 'premium';

export function Courses() {
  const { t } = useI18n();
  const { courses, loading, error } = usePublishedCourses();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const list = courses.filter(
    (c) =>
      (filter === 'all' || filter === c.access_tier) &&
      `${c.title} ${c.summary}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  const filters: { id: Filter; label: 'courses.filter.all' | 'courses.filter.free' | 'courses.filter.premium' }[] = [
    { id: 'all', label: 'courses.filter.all' },
    { id: 'free', label: 'courses.filter.free' },
    { id: 'premium', label: 'courses.filter.premium' },
  ];
  return (
    <div className="container page stack">
      <div>
        <h1>
          <T k="courses.title" />
        </h1>
      </div>
      <div className="row">
        <div className="field" style={{ flex: '1 1 14rem' }}>
          <label htmlFor="course-search" className="sr-only">
            {t('common.search')}
          </label>
          <input id="course-search" type="search" placeholder={t('common.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div role="group" aria-label={t('common.status')} className="row">
          {filters.map((f) => (
            <Button key={f.id} size="sm" variant={filter === f.id ? 'primary' : 'ghost'} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              <T k={f.label} />
            </Button>
          ))}
        </div>
      </div>
      <div className="grid" aria-live="polite">
        {list.map((c) => (
          <Link key={c.id} to={`/courses/${c.id}`} className="card card-link">
            <div className="row" style={{ marginBlockEnd: 8 }}>
              <Badge tone={c.access_tier === 'free' ? 'default' : 'gold'}>{c.access_tier === 'free' ? <T k="common.free" /> : <T k="common.premium" />}</Badge>
            </div>
            <h2><Lang>{c.title}</Lang></h2>
            <p className="muted"><Lang>{c.summary}</Lang></p>
            <p className="muted" style={{ margin: 0 }}>
              {c.course_modules.reduce((n, m) => n + m.lessons.length, 0)} <T k="common.lessons" />
            </p>
          </Link>
        ))}
        {loading && <p className="muted">Loading courses…</p>}
        {error && <p className="muted">{error}</p>}
        {!loading && !error && list.length === 0 && <p className="muted">No published courses are available yet.</p>}
      </div>
    </div>
  );
}
