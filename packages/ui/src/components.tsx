import {
  Component,
  useEffect,
  useState,
  type ButtonHTMLAttributes,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { LOCALES, T, useI18n, type Locale, type MessageKey } from '@gaabe/i18n';

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
    <div className="demo-banner" role="note">
      <T k={messageKey} />
    </div>
  );
}

/* ---------- language + theme ---------- */

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div className="row" role="group" aria-label={t('nav.language')} style={{ gap: 4 }}>
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
      {theme === 'dark' ? '☾' : theme === 'light' ? '☀' : '◐'}
    </button>
  );
}

/* ---------- header / shell ---------- */

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
}

export function SiteShell({ nav, renderLink, homeLink, brandSuffix, tools, children, demoBanner }: ShellProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>
      {demoBanner}
      <header className="site-header">
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
              {tools}
              <LanguageSwitcher />
              <ThemeToggle />
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
    </>
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
