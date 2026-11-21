import { dv, en, LOCALES, type Locale, type MessageKey, type ReviewStatus } from './messages';

export interface Translation {
  text: string;
  /** Language the returned text is actually written in. */
  lang: Locale;
  /** True when the requested locale had no entry and English was used. */
  fallback: boolean;
  status: ReviewStatus | 'source';
}

export type Vars = Record<string, string | number>;

export function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function translate(locale: Locale, key: MessageKey, vars?: Vars): Translation {
  if (locale === 'dv') {
    const entry = dv[key];
    if (entry) return { text: interpolate(entry.text, vars), lang: 'dv', fallback: false, status: entry.status };
  }
  return {
    text: interpolate(en[key], vars),
    lang: 'en',
    fallback: locale !== 'en',
    status: 'source',
  };
}

export interface TranslationReport {
  totalKeys: number;
  translated: number;
  missing: number;
  byStatus: Record<ReviewStatus, number>;
  coverage: number;
  unknownKeys: string[];
}

/** Completeness report for the Dhivehi dictionary (CI + future admin translation editor). */
export function translationReport(): TranslationReport {
  const keys = Object.keys(en) as MessageKey[];
  const byStatus: Record<ReviewStatus, number> = { draft: 0, reviewed: 0, approved: 0 };
  let translated = 0;
  for (const k of keys) {
    const e = dv[k];
    if (e) {
      translated++;
      byStatus[e.status]++;
    }
  }
  const unknownKeys = Object.keys(dv).filter((k) => !(k in en));
  return {
    totalKeys: keys.length,
    translated,
    missing: keys.length - translated,
    byStatus,
    coverage: keys.length ? translated / keys.length : 0,
    unknownKeys,
  };
}

/** Locale-aware number formatting. Falls back to English digits when the runtime lacks dv-MV data. */
function pickLocale(locale: Locale): string {
  const wanted = LOCALES[locale].bcp47;
  return Intl.NumberFormat.supportedLocalesOf([wanted]).length ? wanted : 'en-GB';
}

export function formatNumber(locale: Locale, n: number): string {
  return new Intl.NumberFormat(pickLocale(locale)).format(n);
}

export function formatMVR(locale: Locale, amount: number): string {
  return `MVR ${formatNumber(locale, amount)}`;
}

export function formatDate(locale: Locale, date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(pickLocale(locale), {
    dateStyle: 'medium',
    timeZone: 'Indian/Maldives',
  }).format(d);
}
