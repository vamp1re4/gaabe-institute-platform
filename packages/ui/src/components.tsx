import {
  Component,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { LOCALES, T, useI18n, type Locale, type MessageKey } from '@gaabe/i18n';

/**
 * Marks a run of CONTENT (not UI chrome) with its own language and direction, isolated from the
 * surrounding bidi context. Without this, English text inside an RTL page gets its punctuation
 * (e.g. a trailing full stop) reordered to the wrong end. Content records should always carry
 * their language; never infer it from the text.
 */
export function Lang({ code = 'en', children }: { code?: 'en' | 'dv' | 'ar'; children: ReactNode }) {
  const { locale, c } = useI18n();
  const translated = code === 'en' && locale === 'dv' && typeof children === 'string' ? c(children) : children;
  const outputCode = code === 'en' && locale === 'dv' && translated !== children ? 'dv' : code;
  return (
    <bdi lang={outputCode} dir={outputCode === 'en' ? 'ltr' : 'rtl'}>
      {translated}
    </bdi>
  );
}

/* ---------- primitives ---------- */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'gold' | 'ghost' | 'danger';
  size?: 'md' | 'sm';
};

export function Button({ variant = 'primary', size = 'md', className = '', type = 'button', ...rest }: ButtonProps) {
  const v = variant === 'primary' ? '' : `btn-${variant}`;
  const s = size === 'sm' ? 'btn-sm' : '';
  return <button type={type} className={`btn ${v} ${s} ${className}`.trim()} {...rest} />;
}

export function Badge({ tone = 'default', children }: { tone?: 'default' | 'gold' | 'muted' | 'danger'; children: ReactNode }) {
  const cls = tone === 'default' ? 'badge' : `badge badge-${tone}`;
  return <span className={cls}>{children}</span>;
}

export function ProgressBar({ value, label }: { value: number; label: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
    >
      <span style={{ inlineSize: `${pct}%` }} />
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'error' | 'ok'; children: ReactNode }) {
  const cls = tone === 'info' ? 'notice' : `notice notice-${tone}`;
  return (
    <div className={cls} role={tone === 'error' ? 'alert' : 'note'}>
      {children}
    </div>
  );
}

/** Persistent banner that labels fictional content as demonstration data. */
export function DemoBanner({ messageKey = 'common.demoNotice' }: { messageKey?: MessageKey }) {
  return (
    <aside className="demo-banner" aria-label="Demonstration data notice">
      <T k={messageKey} />
    </aside>
  );
}

/* ---------- language + theme ---------- */

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="lang-switch" role="group" aria-label={t('nav.language')}>
      {(Object.keys(LOCALES) as Locale[]).map((l) => (
        <button
          key={l}
          type="button"
          className="btn btn-ghost btn-sm"
          lang={LOCALES[l].bcp47}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          style={locale === l ? { background: 'rgb(255 255 255 / 0.18)' } : undefined}
        >
          {LOCALES[l].nativeLabel}
        </button>
      ))}
    </div>
  );
}

type Theme = 'light' | 'dark' | 'system';
const THEME_KEY = 'gaabe.theme';

export function ThemeToggle() {
  const { t } = useI18n();
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const v = localStorage.getItem(THEME_KEY);
      if (v === 'light' || v === 'dark') return v;
    } catch {
      /* ignore */
    }
    return 'system';
  });
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    try {
      if (theme === 'system') localStorage.removeItem(THEME_KEY);
      else localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);
  const next: Theme = theme === 'system' ? 'dark' : theme === 'dark' ? 'light' : 'system';
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={() => setTheme(next)}
      aria-label={`${t('nav.theme')}: ${theme}`}
      title={`${t('nav.theme')}: ${theme}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {theme === 'dark' ? (
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        ) : theme === 'light' ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </>
        ) : (
          <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
          </>
        )}
      </svg>
    </button>
  );
}

/* ---------- header / shell ---------- */

function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(query).matches : false));
  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [query]);
  return matches;
}


export interface NavItem {
  to: string;
  labelKey: MessageKey;
}

export interface ShellProps {
  nav: NavItem[];
  /** Renders a router link. Injected so the ui package does not depend on react-router. */
  renderLink: (item: { to: string; className?: string; children: ReactNode; onClick?: () => void }) => ReactNode;
  homeLink: (children: ReactNode) => ReactNode;
  brandSuffix?: ReactNode;
  tools?: ReactNode;
  children: ReactNode;
  demoBanner?: ReactNode;
  /** 'sidebar': nav lives in a sidebar rendered by the app on wide screens; the header only shows it in the menu on narrow ones. */
  navMode?: 'top' | 'sidebar';
  /** Each portal has a deliberately different visual surface treatment. */
  visualMode?: 'frosted' | 'liquid';
}

export function SiteShell({ nav, renderLink, homeLink, brandSuffix, tools, children, demoBanner, navMode = 'top', visualMode }: ShellProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  // Controls render exactly once: in the header on wide screens, inside the menu on narrow ones.
  const wide = useMediaQuery('(min-width: 48rem)');
  const controls = (
    <>
      {tools}
      <LanguageSwitcher />
      <ThemeToggle />
    </>
  );
  return (
    <div className={`app-shell${visualMode ? ` app-shell-${visualMode}` : ''}`}>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      {demoBanner}
      <header className="site-header" data-nav={navMode}>
        <div className="container">
          <div className="bar">
            {homeLink(
              <>
                <span className="brand-mark" aria-hidden="true">
                  G
                </span>
                <span>
                  <T k="brand.name" />
                  {brandSuffix}
                </span>
              </>,
            )}
            <nav className="nav-links" aria-label="Primary">
              {nav.map((n) => (
                <span key={n.to}>{renderLink({ to: n.to, children: <T k={n.labelKey} /> })}</span>
              ))}
            </nav>
            <div className="header-tools">
              {wide && controls}
              <button
                type="button"
                className="btn btn-ghost btn-sm menu-button"
                aria-expanded={open}
                aria-controls="mobile-menu"
                onClick={() => setOpen((o) => !o)}
              >
                <span aria-hidden="true">{open ? '✕' : '☰'}</span>
                <span className="sr-only">{t('nav.menu')}</span>
              </button>
            </div>
          </div>
          <nav id="mobile-menu" className="mobile-menu" data-open={open} aria-label="Mobile">
            {!wide && <div className="mobile-tools">{controls}</div>}
            {nav.map((n) => (
              <span key={n.to}>
                {renderLink({ to: n.to, children: <T k={n.labelKey} />, onClick: () => setOpen(false) })}
              </span>
            ))}
          </nav>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

/* ---------- error handling ---------- */

interface EBProps {
  children: ReactNode;
}
interface EBState {
  error: Error | null;
}

export class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { error: null };
  static getDerivedStateFromError(error: Error): EBState {
    return { error };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Real reporting (Sentry etc.) is not configured. Log locally only.
    console.error('UI error boundary caught:', error, info.componentStack);
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <ErrorPanel />;
  }
}

function ErrorPanel() {
  return (
    <div className="container page" role="alert">
      <h1>
        <T k="error.title" />
      </h1>
      <p>
        <T k="error.body" />
      </p>
      <Button onClick={() => window.location.reload()}>
        <T k="error.reload" />
      </Button>
    </div>
  );
}

export function NotFoundPanel({ homeLink }: { homeLink: ReactNode }) {
  return (
    <div className="container page">
      <h1>
        <T k="error.notFound" />
      </h1>
      <p>{homeLink}</p>
    </div>
  );
}
