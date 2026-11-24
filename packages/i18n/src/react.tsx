import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { LOCALES, type Locale, type MessageKey } from './messages';
import { reviewedContent } from './dhivehi-reviewed';
import { translate, type Translation, type Vars } from './translate';

/**
 * Default is English while the Dhivehi dictionary is an unreviewed draft with low coverage.
 * Switch to 'dv' (the Dhivehi-first target) once native-speaker review has raised coverage.
 */
export const DEFAULT_LOCALE: Locale = 'en';
const STORAGE_KEY = 'gaabe.locale';

interface I18nValue {
  locale: Locale;
  dir: 'rtl' | 'ltr';
  setLocale: (l: Locale) => void;
  /** Plain string (fallback text included — use <T> when the language tag matters). */
  t: (key: MessageKey, vars?: Vars) => string;
  tx: (key: MessageKey, vars?: Vars) => Translation;
  /** Owner-reviewed translation for visible demo/static content. */
  c: (english: string) => string;
}

const Ctx = createContext<I18nValue | null>(null);

function readStored(): Locale {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'dv' || v === 'en') return v;
  } catch {
    /* storage unavailable */
  }
  return DEFAULT_LOCALE;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStored);
  const dir = LOCALES[locale].dir;

  useEffect(() => {
    const root = document.documentElement;
    root.lang = LOCALES[locale].bcp47;
    root.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      dir,
      setLocale,
      t: (key, vars) => translate(locale, key, vars).text,
      tx: (key, vars) => translate(locale, key, vars),
      c: (english) => locale === 'dv' ? reviewedContent[english as keyof typeof reviewedContent] ?? english : english,
    }),
    [locale, dir, setLocale],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>');
  return v;
}

/**
 * Renders a translated string. When Dhivehi falls back to English, the text is wrapped in
 * lang="en" dir="ltr" so the browser, screen readers and bidi algorithm treat it correctly.
 */
export function T({ k, vars }: { k: MessageKey; vars?: Vars }) {
  const { tx, locale } = useI18n();
  const r = tx(k, vars);
  if (r.fallback && locale === 'dv') {
    return (
      <span lang="en" dir="ltr">
        {r.text}
      </span>
    );
  }
  return <>{r.text}</>;
}
