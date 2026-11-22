import { Suspense, lazy, useEffect, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { T, useI18n } from '@gaabe/i18n';
import { DemoBanner, Notice, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { Dashboard } from './pages/Dashboard';
import { StudentsPage } from './pages/Students';
import { CoursesPage } from './pages/Courses';

const LessonEditor = lazy(() => import('./pages/LessonEditor').then((m) => ({ default: m.LessonEditor })));
const WorksheetBuilder = lazy(() => import('./pages/WorksheetBuilder').then((m) => ({ default: m.WorksheetBuilder })));
const Documents = lazy(() => import('./pages/Documents').then((m) => ({ default: m.DocumentUpload })));
const Presentations = lazy(() => import('./pages/Presentations').then((m) => ({ default: m.PresentationsPage })));
const Subscriptions = lazy(() => import('./pages/Subscriptions').then((m) => ({ default: m.SubscriptionsPage })));
const Publishing = lazy(() => import('./pages/Publishing').then((m) => ({ default: m.PublishingPage })));

const NAV: NavItem[] = [
  { to: '/', labelKey: 'admin.nav.dashboard' },
  { to: '/students', labelKey: 'admin.nav.students' },
  { to: '/courses', labelKey: 'admin.nav.courses' },
  { to: '/lessons', labelKey: 'admin.nav.lessons' },
  { to: '/worksheets', labelKey: 'admin.nav.worksheets' },
  { to: '/documents', labelKey: 'admin.nav.documents' },
  { to: '/presentations', labelKey: 'admin.nav.presentations' },
  { to: '/subscriptions', labelKey: 'admin.nav.subscriptions' },
  { to: '/publishing', labelKey: 'admin.nav.publishing' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

/**
 * The admin body is English-only for now. In Dhivehi mode the shell chrome flips to RTL but the page
 * content is isolated as lang=en/ltr so English text and punctuation are never reordered.
 */
function AdminBody({ children }: { children: ReactNode }) {
  const { locale } = useI18n();
  return (
    <div lang="en" dir="ltr" className="admin-main">
      {locale === 'dv' && (
        <Notice>Administration screens are English-only for now. Dhivehi admin text has not been written or reviewed.</Notice>
      )}
      {children}
    </div>
  );
}

export function App() {
  const link = ({ to, children, onClick }: { to: string; className?: string; children: ReactNode; onClick?: () => void }) => (
    <NavLink to={to} end={to === '/'} onClick={onClick}>
      {children}
    </NavLink>
  );
  return (
    <SiteShell
      navMode="sidebar"
      nav={NAV}
      demoBanner={<DemoBanner messageKey="admin.mockNotice" />}
      brandSuffix={<span className="muted" style={{ color: 'var(--gold-300)', marginInlineStart: 8, fontWeight: 500 }}><T k="admin.title" /></span>}
      homeLink={(children) => <Link to="/" className="brand">{children}</Link>}
      renderLink={link}
    >
      <ScrollToTop />
      <div className="admin-layout">
        <aside className="admin-side" aria-label="Administration">
          <nav className="stack" style={{ gap: 4 }}>
            {NAV.map((n) => (
              <span key={n.to}>{link({ to: n.to, children: <T k={n.labelKey} /> })}</span>
            ))}
          </nav>
        </aside>
        <AdminBody>
          <Suspense fallback={<div aria-busy="true">…</div>}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/students" element={<StudentsPage />} />
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/lessons" element={<LessonEditor />} />
              <Route path="/worksheets" element={<WorksheetBuilder />} />
              <Route path="/documents" element={<Documents />} />
              <Route path="/presentations" element={<Presentations />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/publishing" element={<Publishing />} />
              <Route path="*" element={<NotFoundPanel homeLink={<Link className="btn" to="/"><T k="error.goHome" /></Link>} />} />
            </Routes>
          </Suspense>
        </AdminBody>
      </div>
    </SiteShell>
  );
}
