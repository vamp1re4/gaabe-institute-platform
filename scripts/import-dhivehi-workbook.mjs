import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const [workbookPath] = process.argv.slice(2);
if (!workbookPath) throw new Error('Usage: node scripts/import-dhivehi-workbook.mjs <workbook.txt>');

const root = resolve(new URL('..', import.meta.url).pathname);
const workbook = await readFile(workbookPath, 'utf8');
const source = await readFile(resolve(root, 'packages/i18n/src/messages.ts'), 'utf8');
const keyLine = /^(?:[A-Za-z]+\.)+[A-Za-z0-9_]+(?:\.\d+)?\t/;
const rows = new Map();
const lines = workbook.split(/\r?\n/);
for (let i = 0; i < lines.length; i += 1) {
  if (!keyLine.test(lines[i])) continue;
  const [id, english, inline] = lines[i].split('\t');
  const dhivehi = inline || (lines[i + 1]?.startsWith('\t') ? lines[++i].slice(1).trim() : '');
  if (!dhivehi) throw new Error(`Missing Dhivehi translation for ${id}`);
  rows.set(id, { english, dhivehi });
}

const catalogueBody = source.slice(source.indexOf('export const en = {'), source.indexOf('} as const;'));
const catalogueKeys = [...catalogueBody.matchAll(/'([^']+)':\s*(?:'[^']*'|\n\s*'[^']*'),/g)].map(([, key]) => key);
const missing = catalogueKeys.filter((key) => !rows.has(key));
if (missing.length) throw new Error(`Workbook lacks catalogue keys: ${missing.join(', ')}`);

const object = (entries) => JSON.stringify(Object.fromEntries(entries), null, 2);
const catalogue = catalogueKeys.map((key) => [key, rows.get(key).dhivehi]);
const content = [...rows.values()].map(({ english, dhivehi }) => [english, dhivehi]);
const output = `/** Generated from the owner-reviewed Dhivehi translation workbook. Do not edit by hand. */\n\nexport const reviewedDhivehi = ${object(catalogue)} as const;\n\n/** Maps visible English source copy to owner-reviewed Dhivehi for content not yet keyed in the main catalogue. */\nexport const reviewedContent = ${object(content)} as const;\n`;
await writeFile(resolve(root, 'packages/i18n/src/dhivehi-reviewed.ts'), output, 'utf8');
console.log(`Imported ${rows.size} reviewed translations (${catalogue.length} catalogue entries).`);
