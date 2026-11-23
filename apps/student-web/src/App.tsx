import { lazy, Suspense, useEffect, type ReactNode } from 'react';
import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import { T } from '@gaabe/i18n';
import { Button, DemoBanner, MotionProvider, NotFoundPanel, SiteShell, type NavItem } from '@gaabe/ui';
import { useDemoUser } from './state';
import { productionAuthEnabled, signOutProduction, useProductionUser } from './production-auth';
import { Home } from './pages/Home';
import { Courses } from './pages/Courses';
import { CourseDetail } from './pages/CourseDetail';
import { Pricing } from './pages/Pricing';
import { PaymentReturn } from './pages/PaymentReturn';
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
  useEffect(() => {
    // Some embedded mobile WebViews reject programmatic scrolling. Navigation
    // must still succeed when that optional polish cannot run.
    try {
      window.scrollTo(0, 0);
    } catch {
      // Preserve the current scroll position rather than failing the route.
    }
  }, [pathname]);
  return null;
}

const PAGE_META: Record<string, { title: string; description: string }> = {
  '/': { title: 'Islamic studies tuition', description: 'Structured Islamic studies lessons, guided revision and worksheets for students in the Maldives.' },
  '/courses': { title: 'Courses', description: 'Browse Gaabe Institute demonstration courses.' },
  '/pricing': { title: 'Pricing', description: 'View demonstration plans for Gaabe Institute.' },
  '/payment/success': { title: 'Payment verification', description: 'Your test payment is being verified by Gaabe Institute.' },
  '/sign-in': { title: 'Sign in', description: 'Sign in to the Gaabe Institute demonstration.' },
  '/register': { title: 'Create an account', description: 'Create a demonstration account for Gaabe Institute.' },
};

function pageMeta(pathname: string) {
  if (pathname.startsWith('/courses/') && pathname.includes('/lessons/'))
    return { title: 'Lesson', description: 'Study a Gaabe Institute demonstration lesson.' };
  if (pathname.startsWith('/courses/'))
    return { title: 'Course details', description: 'View a Gaabe Institute demonstration course.' };
  if (pathname === '/worksheets' || pathname.startsWith('/worksheets/'))
    return { title: 'Worksheets', description: 'Complete a Gaabe Institute demonstration worksheet.' };
  if (pathname === '/exams') return { title: 'Exam preparation', description: 'Practice and revise with Gaabe Institute.' };
  if (pathname === '/presentations') return { title: 'Presentations', description: 'View Gaabe Institute demonstration presentations.' };
  if (pathname === '/documents') return { title: 'Study documents', description: 'Read Gaabe Institute demonstration study documents.' };
  if (pathname === '/dashboard') return { title: 'Dashboard', description: 'Track progress in the Gaabe Institute demonstration.' };
  return PAGE_META[pathname] ?? { title: 'Page not found', description: 'The requested Gaabe Institute page was not found.' };
}

function PageMetadata() {
  const { pathname } = useLocation();
  useEffect(() => {
    const meta = pageMeta(pathname);
    document.title = `${meta.title} | Gaabe Institute`;
    document.querySelector('meta[name="description"]')?.setAttribute('content', meta.description);
  }, [pathname]);
  return null;
}

function AuthTools() {
  const { user, signOut } = useDemoUser();
  const productionUser = useProductionUser();
  if (productionAuthEnabled && productionUser)
    return (
      <Button size="sm" variant="ghost" onClick={() => void signOutProduction()} style={{ color: 'inherit' }}>
        <T k="nav.signOut" />
      </Button>
    );
  if (!productionAuthEnabled && user)
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
  // Lenis/GSAP is an enhancement, not a navigation dependency. Keep native
  // scrolling while the public demo is being validated on mobile WebViews.
  return (
    <MotionProvider enabled={false}>
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
        <PageMetadata />
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
            <Route path="/payment/success" element={<PaymentReturn />} />
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
    </MotionProvider>
  );
}
