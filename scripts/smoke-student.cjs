/**
 * Headless-browser smoke test for the STUDENT app (not run by `npm test`; needs a running preview server).
 *   npm run build -w @gaabe/student-web && npm run preview -w @gaabe/student-web   # serves :4173
 *   NODE_PATH=$(npm root -g) node scripts/smoke-student.cjs   # requires Playwright + Chromium installed globally
 * Env: SMOKE_BASE (default http://127.0.0.1:4173), SMOKE_OUT (screenshot dir, default OS temp).
 * Prints PASS/FAIL counts and the name of every failed check. Known gap: cannot hear speech output.
 */
const { chromium } = require('playwright');
const OUT = process.env.SMOKE_OUT || require('os').tmpdir();
const BASE = process.env.SMOKE_BASE || 'http://127.0.0.1:4173';
const results = [];
const ok = (name, cond, extra = '') => { results.push({ name, pass: !!cond, extra }); };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });

  // Home
  await page.goto(BASE + '/');
  ok('home renders hero', await page.locator('h1').first().innerText().then((t) => t.includes('Islamic studies')));
  ok('demo banner visible', await page.locator('.demo-banner').isVisible());
  ok('html lang/dir default en/ltr', (await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir])).join() === 'en,ltr');
  await page.screenshot({ path: OUT + '/home-en.png' });

  // Language switch -> RTL
  await page.getByRole('button', { name: 'ދިވެހި' }).click();
  const dvAttrs = await page.evaluate(() => [document.documentElement.lang, document.documentElement.dir]);
  ok('switch to Dhivehi sets dv-MV + rtl', dvAttrs.join() === 'dv-MV,rtl', dvAttrs.join());
  ok('fallback English wrapped lang=en dir=ltr', (await page.locator('span[lang="en"][dir="ltr"]').count()) > 0);
  const thaana = await page.evaluate(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].filter((f) => f.family.replace(/["']/g, '') === 'Noto Sans Thaana');
    return { declared: faces.length, loaded: faces.filter((f) => f.status === 'loaded').length };
  });
  ok('Thaana webfont faces declared AND at least one loaded', thaana.declared > 0 && thaana.loaded > 0, JSON.stringify(thaana));
  await page.screenshot({ path: OUT + '/home-dv.png' });
  await page.getByRole('button', { name: 'English' }).click();

  // Courses filter + detail + lesson
  await page.goto(BASE + '/courses');
  await page.getByRole('button', { name: 'Free', exact: true }).click();
  ok('free filter leaves 1 course', (await page.locator('a.card-link').count()) === 1, String(await page.locator('a.card-link').count()));
  await page.getByRole('button', { name: 'All', exact: true }).click();
  await page.goto(BASE + '/courses/sample-foundations/lessons/a-l1');
  await page.getByText('Read aloud').first().waitFor({ timeout: 5000 });
  ok('lesson shows read aloud toolbar', await page.getByText('Read aloud').first().isVisible());
  // Dhivehi block must be rtl + lang dv
  const dvBlock = page.locator('p[lang="dv"]').first();
  ok('dv block dir=rtl', (await dvBlock.getAttribute('dir')) === 'rtl');
  // Premium lesson locked without subscription
  await page.goto(BASE + '/courses/sample-foundations/lessons/a-l3');
  await page.getByRole('heading', { level: 1 }).waitFor({ timeout: 5000 });
  ok('premium lesson locked', await page.getByText('Premium lesson — subscribe to unlock').isVisible());
  // mark complete on free lesson
  await page.goto(BASE + '/courses/sample-foundations/lessons/a-l1');
  await page.getByRole('button', { name: /Mark as complete/ }).click();
  ok('mark complete toggles', await page.getByRole('button', { name: /Completed/ }).isVisible());

  // Read aloud: Dhivehi segment must report truthful unavailable (play whole lesson -> hits dv at the end? start at dv)
  // Use the document page where the first paragraphs are English; verify unavailable message appears for dv via slides deck.
  await page.goto(BASE + '/presentations');
  await page.getByRole('button', { name: /Next/ }).click();
  await page.getByRole('button', { name: /Next/ }).click();
  await page.getByRole('button', { name: /Next/ }).click();
  ok('slide 4 is dv rtl', (await page.locator('section.slide').getAttribute('dir')) === 'rtl');
  const preflight = await page.locator('.readaloud').first().innerText();
  ok('dv slide read aloud shows unavailable message', /Dhivehi narration is not available/.test(preflight), preflight.slice(0, 120));
  await page.screenshot({ path: OUT + '/slide-dv.png' });
  // Presentation keyboard nav
  await page.keyboard.press('ArrowLeft');
  ok('ArrowLeft goes back one slide', (await page.getByText('Slide 3 of 4', { exact: true }).count()) === 1);

  // Worksheet end-to-end
  await page.goto(BASE + '/worksheets/ws-sample-1');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByLabel('Seven').check();
  await page.getByLabel('2', { exact: true }).check();
  await page.getByLabel('8', { exact: true }).check();
  await page.getByRole('radio', { name: 'True', exact: true }).first().check();
  await page.getByPlaceholder('Type your answer').first().fill(' Seven. ');
  await page.locator('textarea').first().fill('A quiet corner of the library.');
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Submit worksheet' }).click();
  const scoreText = await page.getByText(/Score:/).innerText();
  ok('worksheet graded (1+2+1+2 = 6 of 12)', /Score: 6 \/ 12/.test(scoreText), scoreText);
  ok('essay answered -> awaiting teacher review, score unchanged', (await page.getByText(/Awaiting teacher review/).count()) >= 1 && /Score: 6 \/ 12/.test(scoreText), scoreText);
  await page.screenshot({ path: OUT + '/worksheet-result.png', fullPage: true });

  // Pricing -> demo subscribe -> premium unlocked
  await page.goto(BASE + '/pricing');
  await page.getByRole('button', { name: 'Choose plan' }).first().click();
  ok('checkout states no payment taken', await page.getByText(/No payment is taken/).isVisible());
  await page.getByRole('button', { name: 'Confirm demo purchase' }).click();
  await page.goto(BASE + '/courses/sample-foundations/lessons/a-l3');
  ok('premium unlocked after demo purchase', (await page.getByText('Premium lesson').count()) === 0);

  // Auth validation
  await page.goto(BASE + '/sign-in');
  await page.getByRole('button', { name: 'Sign in', exact: true }).last().click();
  ok('auth validation shows errors', (await page.locator('[role="alert"]').count()) >= 2);

  // 404
  await page.goto(BASE + '/nope');
  ok('404 page', await page.getByText('Page not found').isVisible());

  // Mobile layout: no horizontal scroll, menu works
  const m = await browser.newContext({ viewport: { width: 375, height: 812 }, deviceScaleFactor: 2, isMobile: true });
  const mp = await m.newPage();
  for (const path of ['/', '/courses', '/pricing', '/worksheets/ws-sample-1', '/presentations']) {
    await mp.goto(BASE + path);
    const over = await mp.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    ok(`mobile no horizontal overflow ${path}`, over <= 1, 'overflow ' + over);
  }
  await mp.goto(BASE + '/');
  await mp.getByRole('button', { name: 'Menu' }).click();
  ok('mobile menu opens', await mp.locator('#mobile-menu[data-open="true"]').isVisible());
  await mp.screenshot({ path: OUT + '/mobile-menu.png' });
  await mp.getByRole('button', { name: 'ދިވެހި' }).click();
  await mp.goto(BASE + '/');
  await mp.screenshot({ path: OUT + '/mobile-home-dv.png' });

  ok('no console/page errors', errors.length === 0, errors.join(' | ').slice(0, 400));
  console.log('PASS', results.filter(r=>r.pass).length, 'FAIL', results.filter(r=>!r.pass).length);
  results.filter(r=>!r.pass).forEach(r=>console.log('FAILED:', r.name, '|', r.extra));
  await browser.close();
})().catch((e) => { console.error('SCRIPT FAIL', e); process.exit(1); });
