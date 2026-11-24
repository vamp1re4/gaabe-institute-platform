import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { T, useI18n } from '@gaabe/i18n';
import { ReadAloudToolbar, toSegments } from '@gaabe/speech';
import { Button, Lang, Notice } from '@gaabe/ui';
import { presentations } from '@gaabe/demo-data';

export function PresentationPage() {
  const { t, dir } = useI18n();
  const deck = presentations.find((p) => p.status === 'published')!;
  const [i, setI] = useState(0);
  const [thumbs, setThumbs] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const total = deck.slides.length;
  const slide = deck.slides[i]!;

  const go = useCallback((n: number) => setI(Math.max(0, Math.min(total - 1, n))), [total]);

  // Arrow keys follow reading direction: in RTL the left arrow advances.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight';
      const back = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === forward || e.key === 'PageDown') go(i + 1);
      else if (e.key === back || e.key === 'PageUp') go(i - 1);
      else if (e.key === 'Home') go(0);
      else if (e.key === 'End') go(total - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dir, go, i, total]);

  const slideSegments = useMemo(
    () => toSegments(`slide-${slide.id}`, [slide.title, ...slide.bullets].join('. ') + '.', slide.lang),
    [slide],
  );
  const allSegments = useMemo(
    () => deck.slides.flatMap((s) => toSegments(`deck-${s.id}`, [s.title, ...s.bullets].join('. ') + '.', s.lang)),
    [deck],
  );

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await stage.current?.requestFullscreen();
    } catch {
      /* Fullscreen can be refused (e.g. iOS Safari); the viewer still works inline. */
    }
  }

  const slideDir = slide.lang === 'dv' || slide.lang === 'ar' ? 'rtl' : 'ltr';

  return (
    <div className="container page stack">
      <h1><Lang>{deck.title}</Lang></h1>
      <Notice><T k="presentation.noDownload" /></Notice>

      <div ref={stage} style={{ background: 'var(--bg)' }}>
        <section className="slide" aria-roledescription="slide" aria-label={t('presentation.slideN', { n: i + 1, total })} lang={slide.lang} dir={slideDir}>
          <h2><Lang code={slide.lang}>{slide.title}</Lang></h2>
          <ul>
            {slide.bullets.map((b) => <li key={b}><Lang code={slide.lang}>{b}</Lang></li>)}
          </ul>
        </section>
      </div>
      {slide.notes && <p className="muted"><Lang code={slide.lang}>{slide.notes}</Lang></p>}

      <div className="row row-between">
        <div className="row">
          <Button variant="ghost" onClick={() => go(i - 1)} disabled={i === 0}>
            <span className="flip-rtl" aria-hidden="true">←</span> <T k="common.previous" />
          </Button>
          <span aria-live="polite"><T k="presentation.slideN" vars={{ n: i + 1, total }} /></span>
          <Button variant="ghost" onClick={() => go(i + 1)} disabled={i === total - 1}>
            <T k="common.next" /> <span className="flip-rtl" aria-hidden="true">→</span>
          </Button>
        </div>
        <div className="row">
          <Button variant="ghost" size="sm" aria-expanded={thumbs} onClick={() => setThumbs((v) => !v)}>
            <T k="presentation.thumbnails" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}><T k="presentation.fullscreen" /></Button>
        </div>
      </div>

      {thumbs && (
        <div className="thumbs" role="list">
          {deck.slides.map((s, n) => (
            <Button key={s.id} role="listitem" className="thumb" size="sm" variant={n === i ? 'primary' : 'ghost'} aria-current={n === i} onClick={() => go(n)} lang={s.lang} dir={s.lang === 'dv' ? 'rtl' : 'ltr'}>
              {n + 1}. {s.title}
            </Button>
          ))}
        </div>
      )}

      <ReadAloudToolbar queueId={`slide-${slide.id}`} label={t('presentation.readSlide')} segments={slideSegments} />
      <ReadAloudToolbar queueId="deck-all" label={t('presentation.readAll')} segments={allSegments} compact />
    </div>
  );
}
