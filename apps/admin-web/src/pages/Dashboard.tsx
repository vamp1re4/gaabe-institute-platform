import { Link } from 'react-router-dom';
import { Badge, Notice } from '@gaabe/ui';
import { useAudit, useCourses, usePlans, useStatuses, useStudents } from '../state';

export function Dashboard() {
  const [students] = useStudents();
  const [courses] = useCourses();
  const [plans] = usePlans();
  const [statuses] = useStatuses();
  const [audit] = useAudit();

  const paying = students.filter((s) => s.plan !== 'free' && s.status === 'active').length;
  const published = Object.values(statuses).filter((s) => s.status === 'published').length;
  const inReview = Object.values(statuses).filter((s) => s.status === 'in_review').length;
  const stats = [
    { label: 'Students', value: students.length },
    { label: 'Active paid (demo)', value: paying },
    { label: 'Courses', value: courses.length },
    { label: 'Published items', value: published },
    { label: 'Awaiting review', value: inReview },
    { label: 'Active plans', value: plans.filter((p) => p.active).length },
  ];

  return (
    <div className="stack">
      <h1>Administration dashboard</h1>
      <div className="grid" role="list">
        {stats.map((s) => (
          <div key={s.label} role="listitem" className="card">
            <div className="muted">{s.label}</div>
            <div className="stat">{s.value}</div>
          </div>
        ))}
      </div>

      <section className="card stack" aria-labelledby="real">
        <h2 id="real">What is real and what is mock</h2>
        <ul style={{ paddingInlineStart: 18, margin: 0 }} className="stack">
          <li><Badge>Works</Badge> Editing, validation and previews run in this browser.</li>
          <li><Badge tone="gold">Mock</Badge> Every record is saved only in this browser&apos;s local storage and is lost if it is cleared.</li>
          <li><Badge tone="danger">Missing</Badge> Sign-in, roles, permissions, audit integrity, file storage, payments, email.</li>
        </ul>
        <Notice tone="error">Do not deploy this app publicly until real authentication and server-side authorisation exist.</Notice>
      </section>

      <section className="card stack" aria-labelledby="quick">
        <h2 id="quick">Quick actions</h2>
        <div className="row">
          <Link className="btn" to="/lessons">Edit a lesson</Link>
          <Link className="btn btn-ghost" to="/worksheets">Build a worksheet</Link>
          <Link className="btn btn-ghost" to="/publishing">Review &amp; publish</Link>
        </div>
      </section>

      <section className="card stack" aria-labelledby="log">
        <h2 id="log">Recent publishing activity</h2>
        {audit.length === 0 ? (
          <p className="muted">No activity yet.</p>
        ) : (
          <ul style={{ paddingInlineStart: 18, margin: 0 }}>
            {audit.slice(0, 6).map((a) => (
              <li key={a.id}>
                {a.text} <span className="muted">({new Date(a.at).toLocaleString('en-GB', { timeZone: 'Indian/Maldives' })})</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
