import { useEffect, type ReactNode } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';

/**
 * Optional motion enhancement shared by both applications.
 * Content stays visible without JavaScript; reduced-motion users retain native scrolling.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let lenis: Lenis | undefined;
    let frame = 0;

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      lenis?.destroy();
      lenis = undefined;
      gsap.killTweensOf('main');
    };

    const start = () => {
      stop();
      if (preference.matches) {
        document.documentElement.dataset.motion = 'reduced';
        return;
      }
      document.documentElement.dataset.motion = 'enhanced';
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
    };

    start();
    preference.addEventListener('change', start);
    return () => {
      preference.removeEventListener('change', start);
      stop();
      delete document.documentElement.dataset.motion;
    };
  }, []);

  return <>{children}</>;
}
