/**
 * Automated accessibility scan (axe-core: wcag2a, wcag2aa, wcag21aa, best-practice). Not part of `npm test`.
 *   node scripts/axe-check.cjs http://127.0.0.1:4173 / /courses /pricing      # student preview
 *   node scripts/axe-check.cjs http://127.0.0.1:4174 / /students              # admin preview
 * Waits for the first <h1> so lazy-loaded routes are scanned after they render (scanning too early
 * produces false "page-has-heading-one" hits). Automated checks catch only part of WCAG; manual and
 * screen-reader testing are still required.
 */
const { chromium } = require('playwright'); const fs = require('fs');
const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const base = process.argv[2]; const routes = process.argv.slice(3);
(async () => {
  const b = await chromium.launch(); const p = await b.newPage();
  let total = 0;
  for (const r of routes) {
    await p.goto(base + r); await p.locator('h1').first().waitFor({ timeout: 5000 }).catch(() => {}); await p.waitForTimeout(150); await p.evaluate(AXE);
    const v = await p.evaluate(async () => (await window.axe.run(document, { runOnly: ['wcag2a','wcag2aa','wcag21aa','best-practice'] })).violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, t: v.nodes.map(n => n.target.join(' ')).slice(0,2) })));
    total += v.length; console.log(r.padEnd(42), v.length ? JSON.stringify(v) : 'clean');
  }
  console.log('pages with violations summed:', total); await b.close();
})();
