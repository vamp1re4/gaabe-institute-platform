import { useEffect, type ReactNode } from 'react';

/**
 * Optional motion enhancement shared by both applications.
 * Content stays visible without JavaScript; reduced-motion users retain native scrolling.
 */
export function MotionProvider({ children, enabled = true }: { children: ReactNode; enabled?: boolean }) {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: { raf: (time: number) => void; destroy: () => void } | undefined;
    let killMainTween: (() => void) | undefined;
    let frame = 0;
    let cancelled = false;
    let generation = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lenis?.destroy();
      lenis = undefined;
      killMainTween?.();
      killMainTween = undefined;
    };

    const start = () => {
      stop();
      const request = ++generation;
      if (!enabled || preference.matches) {
        document.documentElement.dataset.motion = 'reduced';
        return;
      }
      document.documentElement.dataset.motion = 'enhanced';
      void Promise.all([import('lenis'), import('gsap')]).then(([lenisModule, gsapModule]) => {
        if (cancelled || request !== generation || preference.matches || !enabled) return;
        const Lenis = lenisModule.default;
        const gsap = gsapModule.gsap;
        lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
        const tick = (time: number) => {
          lenis?.raf(time);
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);

        const main = document.querySelector('main');
        if (main) {
          gsap.fromTo(main, { autoAlpha: 0, y: 8 }, { autoAlpha: 1, y: 0, duration: 0.28, ease: 'power2.out', clearProps: 'opacity,transform,visibility' });
        }
        killMainTween = () => gsap.killTweensOf('main');
      });
    };

    start();
    preference.addEventListener('change', start);
    return () => {
      preference.removeEventListener('change', start);
      cancelled = true;
      stop();
      delete document.documentElement.dataset.motion;
    };
  }, [enabled]);

  return <>{children}</>;
}
