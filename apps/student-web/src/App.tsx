import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Button, DemoBanner, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { useDemoUser } from './state';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Pricing } from './pages/Pricing';
import { SignIn, Register } from './pages/Auth';

// Heavier / less-visited screens are code-split.
const LessonPage = lazy(() => import('./pages/Lesson').then((m) => ({ default: m.LessonPage })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Worksheets = lazy(() => import('./pages/Worksheets').then((m) => ({ default: m.Worksheets })));
const Exams = lazy(() => import('./pages/Exams').then((m) => ({ default: m.Exams })));
const PresentationPage = lazy(() => import('./pages/Presentation').then((m) => ({ default: m.PresentationPage })));
const DocumentsPage = lazy(() => import('./pages/Documents').then((m) => ({ default: m.DocumentsPage })));

const NAV: NavItem[] = [
  { to: '/', labelKey: 'nav.home' },
  { to: '/courses', labelKey: 'nav.courses' },
  { to: '/worksheets', labelKey: 'nav.worksheets' },
  { to: '/exams', labelKey: 'nav.exams' },
  { to: '/presentations', labelKey: 'nav.presentations' },
  { to: '/documents', labelKey: 'nav.documents' },
  { to: '/pricing', labelKey: 'nav.pricing' },
  { to: '/dashboard', labelKey: 'nav.dashboard' },
];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

function AuthTools() {
  const { user, signOut } = useDemoUser();
  if (user)
    return (
      <Button size="sm" variant="ghost" onClick={signOut} style={{ color: 'inherit' }}>
        <T k="nav.signOut" />
      </Button>
    );
  return (
    <Link className="btn btn-gold btn-sm" to="/sign-in">
      <T k="nav.signIn" />
    </Link>
  );
}

export function App() {
  return (
    <SiteShell
      nav={NAV}
      demoBanner={<DemoBanner />}
      tools={<AuthTools />}
      homeLink={(children: ReactNode) => (
        <Link to="/" className="brand">
          {children}
        </Link>
      )}
      renderLink={({ to, children, onClick }) => (
        <NavLink to={to} end={to === '/'} onClick={onClick}>
          {children}
        </NavLink>
      )}
    >
      <ScrollToTop />
      <Suspense fallback={<div className="container page" aria-busy="true">…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/courses/:courseId" element={<CourseDetail />} />
          <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/worksheets" element={<Worksheets />} />
          <Route path="/worksheets/:worksheetId" element={<Worksheets />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/presentations" element={<PresentationPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="*"
            element={
              <NotFoundPanel
                homeLink={
                  <Link className="btn" to="/">
                    <T k="error.goHome" />
                  </Link>
                }
              />
            }
          />
        </Routes>
      </Suspense>
    </SiteShell>
  );
}
