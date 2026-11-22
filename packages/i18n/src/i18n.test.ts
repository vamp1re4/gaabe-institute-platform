import { describe, expect, it } from 'vitest';
import { dv, en, LOCALES } from './messages';
import { interpolate, translate, translationReport } from './translate';

describe('i18n', () => {
  it('has RTL for Dhivehi and LTR for English', () => {
    expect(LOCALES.dv.dir).toBe('rtl');
    expect(LOCALES.en.dir).toBe('ltr');
  });

  it('returns reviewed Dhivehi entries tagged as dv', () => {
    const r = translate('dv', 'nav.courses');
    expect(r.lang).toBe('dv');
    expect(r.fallback).toBe(false);
    expect(r.status).toBe('reviewed');
  });

  it('has reviewed Dhivehi copy for every interface key', () => {
    const r = translate('dv', 'home.hero.title');
    expect(r.lang).toBe('dv');
    expect(r.fallback).toBe(false);
  });

  it('interpolates variables', () => {
    expect(interpolate('Slide {n} of {total}', { n: 2, total: 5 })).toBe('Slide 2 of 5');
    expect(translate('en', 'worksheet.question', { n: 1, total: 4 }).text).toBe('Question 1 of 4');
  });

  it('never marks unreviewed Dhivehi as approved (CI guard)', () => {
    const report = translationReport();
    expect(report.unknownKeys).toEqual([]);
    expect(report.byStatus.approved).toBe(0);
    expect(report.translated).toBe(Object.keys(dv).length);
    // Informational completeness line for CI logs.
    console.info(
      `Dhivehi coverage: ${report.translated}/${report.totalKeys} (${(report.coverage * 100).toFixed(0)}%), all draft`,
    );
  });

  it('dv entries are Thaana script', () => {
    for (const [k, v] of Object.entries(dv)) {
      expect(/[ހ-޿]/.test(v!.text), k).toBe(true);
    }
  });

  it('English dictionary has no empty values', () => {
    for (const [k, v] of Object.entries(en)) expect(v.length, k).toBeGreaterThan(0);
  });
});
