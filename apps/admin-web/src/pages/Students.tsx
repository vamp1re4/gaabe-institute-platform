import { useState, type FormEvent } from 'react';
import { Badge, Button, Notice, ProgressBar } from '@gaabe/ui';
import type { DemoStudent } from '@gaabe/demo-data';
import { uid, useStudents } from '../state';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type Filter = 'all' | DemoStudent['status'];

export function StudentsPage() {
  const [students, setStudents] = useStudents();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [error, setError] = useState<string | null>(null);

  const list = students.filter(
    (s) =>
      (filter === 'all' || s.status === filter) &&
      `${s.name} ${s.email}`.toLowerCase().includes(query.trim().toLowerCase()),
  );

  function setStatus(id: string, status: DemoStudent['status']) {
    setStudents(students.map((s) => (s.id === id ? { ...s, status } : s)));
  }

  function invite(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const name = String(f.get('name') ?? '').trim();
    const email = String(f.get('email') ?? '').trim().toLowerCase();
    if (name.length < 2) return setError('Enter the student’s name.');
    if (!EMAIL.test(email)) return setError('Enter a valid email address.');
    if (students.some((s) => s.email === email)) return setError('A student with that email already exists.');
    setError(null);
    setStudents([
      { id: uid('st'), name, email, plan: 'free', progress: 0, status: 'invited', joined: new Date().toISOString().slice(0, 10) },
      ...students,
    ]);
    form.reset();
  }

  return (
    <div className="stack">
      <h1>Student management</h1>
      <Notice>Fictional demo students. Inviting a student creates a local record only — no email is sent.</Notice>

      <form className="card stack" onSubmit={invite} noValidate aria-labelledby="inv">
        <h2 id="inv">Invite a student</h2>
        <div className="row" style={{ alignItems: 'end' }}>
          <div className="field" style={{ flex: '1 1 12rem' }}>
            <label htmlFor="inv-name">Name</label>
            <input id="inv-name" name="name" type="text" autoComplete="off" />
          </div>
          <div className="field" style={{ flex: '1 1 14rem' }}>
            <label htmlFor="inv-email">Email</label>
            <input id="inv-email" name="email" type="email" autoComplete="off" />
          </div>
          <Button type="submit">Add student</Button>
        </div>
        {error && <p role="alert" style={{ color: 'var(--danger)', margin: 0 }}>{error}</p>}
      </form>

      <div className="row">
        <div className="field" style={{ flex: '1 1 14rem' }}>
          <label htmlFor="stu-search" className="sr-only">Search students</label>
          <input id="stu-search" type="search" placeholder="Search name or email" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="stu-filter" className="sr-only">Status</label>
          <select id="stu-filter" value={filter} onChange={(e) => setFilter(e.target.value as Filter)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="invited">Invited</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <caption className="sr-only">Students</caption>
          <thead>
            <tr><th scope="col">Student</th><th scope="col">Plan</th><th scope="col">Progress</th><th scope="col">Status</th><th scope="col">Actions</th></tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id}>
                <td><strong>{s.name}</strong><br /><span className="muted">{s.email}</span></td>
                <td>{s.plan}</td>
                <td style={{ minWidth: 140 }}><ProgressBar value={s.progress} label={`${s.name} progress`} /></td>
                <td><Badge tone={s.status === 'active' ? 'default' : s.status === 'suspended' ? 'danger' : 'muted'}>{s.status}</Badge></td>
                <td>
                  {s.status === 'suspended' ? (
                    <Button size="sm" variant="ghost" onClick={() => setStatus(s.id, 'active')}>Reinstate</Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => window.confirm(`Suspend ${s.name}?`) && setStatus(s.id, 'suspended')}>Suspend</Button>
                  )}
                </td>
              </tr>
            ))}
            {list.length === 0 && <tr><td colSpan={5} className="muted">No students match.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
