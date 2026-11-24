import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(new URL('..', import.meta.url).pathname);
const read = (path) => readFile(resolve(root, path), 'utf8');
const escape = (text) => text.replaceAll('\\', '\\\\').replaceAll('\n', '\\n').replaceAll('\t', '\\t');

function catalogueEntries(source) {
  const body = source.slice(source.indexOf('export const en = {'), source.indexOf('} as const;'));
  const expression = /'([^']+)':\s*(?:'([^']*)'|\n\s*'([^']*)'),/g;
  return [...body.matchAll(expression)].map(([, key, oneLine, multiLine]) => [key, oneLine ?? multiLine]);
}

function quotedContent(source) {
  const values = [];
  const expression = /(?:title|summary|level|text|instructions|prompt|explanation|name|features|bullets|notes):\s*'([^']+)'/g;
  for (const [, value] of source.matchAll(expression)) values.push(value);
  for (const [, value] of source.matchAll(/const PLACEHOLDER\s*=\s*\n?\s*'([^']+)'/g)) values.push(value);
  for (const [, value] of source.matchAll(/lesson\([^,]+,\s*'([^']+)'/g)) values.push(value);
  for (const [, value] of source.matchAll(/(options:\s*\[[^\]]*\])/g)) {
    for (const [, option] of value.matchAll(/text:\s*'([^']+)'/g)) values.push(option);
  }
  for (const [, value] of source.matchAll(/(?:features|bullets|accepted):\s*\[([^\]]*)\]/g)) {
    for (const [, item] of value.matchAll(/'([^']+)'/g)) values.push(item);
  }
  return [...new Set(values)].filter((value) => /[A-Za-z]/.test(value));
}

const adminVisible = [
  'Administration screens are English-only for now. Dhivehi admin text has not been written or reviewed.',
  'Demonstration overview', 'Sample students', 'Fictional records', 'Published courses', 'sample lessons',
  'Teacher-graded prompts', 'Demo worksheet items', 'Production readiness',
  'What this demonstration can and cannot do is deliberately visible to staff.',
  'Course, worksheet, and document records below are fictional browser data.',
  'There is no real staff login, role check, audit log, file upload, payment verification, or publishing API.',
  'Do not use this screen to handle student records, payment evidence, or original learning materials.',
  'Search sample students', 'Fictional learner records for the administration demonstration', 'Name', 'Course',
  'Unknown sample course', 'No sample student matches that search.', 'Show unpublished sample courses',
  'published', 'draft', 'active', 'suspended', 'invited', 'modules', 'lessons', 'Edit (not connected)',
  'Editing needs a server-backed, authorised content API.',
  'Question authoring, answer keys, version publishing, and grading must be server-authorized. This list is read-only demo data.',
  'Fictional worksheets in the administration demonstration', 'Worksheet', 'Questions', 'Review state', 'Demo only',
  'Secure document processing',
  'No source document is uploaded through this prototype. A production pipeline must validate file type and size, malware-scan, store originals privately, queue conversion, preserve language metadata, and authorize every rendered page and audio segment.',
  'Upload document (not connected)', 'Uploading needs private storage and server-side file validation.', 'Read Aloud review',
  'English browser speech is a browser capability; Dhivehi speech remains unavailable until a verified provider and native-speaker review are complete. Quranic Arabic must use approved recordings, not generic synthesis.',
  'Payment and entitlement decisions are not implemented. Never grant paid access from browser state or this demonstration screen.',
  'Required production controls', 'Server-verified payment state machine with idempotency and audit events.',
  'Manual-transfer review that remains pending until authorized staff verify evidence.',
  'Short-lived, entitlement-checked access for premium lessons, media, documents, and audio.',
];

const clientVisible = [
  'Islamic studies tuition', 'Structured Islamic studies lessons, guided revision and worksheets for students in the Maldives.',
  'Browse Gaabe Institute demonstration courses.', 'View demonstration plans for Gaabe Institute.',
  'Sign in to the Gaabe Institute demonstration.', 'Create a demonstration account for Gaabe Institute.',
  'Lesson', 'Study a Gaabe Institute demonstration lesson.', 'Course details', 'View a Gaabe Institute demonstration course.',
  'Complete a Gaabe Institute demonstration worksheet.', 'Practice and revise with Gaabe Institute.',
  'View Gaabe Institute demonstration presentations.', 'Read Gaabe Institute demonstration study documents.',
  'Track progress in the Gaabe Institute demonstration.', 'Page not found', 'The requested Gaabe Institute page was not found.',
  'PDF', 'Sample PDF', 'Open PDF in a new tab', 'unverified', 'Lesson navigation', 'min', 'light', 'dark', 'system', 'Primary', 'Mobile',
];

const [messages, demo] = await Promise.all([
  read('packages/i18n/src/messages.ts'),
  read('packages/demo-data/src/index.ts'),
]);

const rows = (prefix, values) => values.map((value, index) =>
  `${prefix}.${String(index + 1).padStart(3, '0')}\t${escape(value)}\t`,
);
const catalogue = catalogueEntries(messages);
const catalogueSections = [
  ['1. Brand, navigation and shared actions', /^(brand|nav|common)\./],
  ['2. Home and course catalogue', /^(home|courses)\./],
  ['3. Lessons and Read Aloud', /^(lesson|speech)\./],
  ['4. Worksheets, exams and presentations', /^(worksheet|exam|presentation)\./],
  ['5. Documents, pricing, accounts and dashboard', /^(document|pricing|auth|dashboard)\./],
  ['6. Error states and shared admin navigation', /^(error|admin)\./],
];
const demoValues = quotedContent(demo);
const splitAt = (marker) => demoValues.indexOf(marker);
const worksheetStart = splitAt('Sample worksheet (demonstration)');
const presentationStart = splitAt('Sample presentation (demonstration)');
const documentStart = splitAt('Sample study document (demonstration)');
const planStart = splitAt('Free sample');
const studentStart = splitAt('Demo Student 01');

const lines = [
  '# GAABE INSTITUTE — DHIVEHI TRANSLATION WORKBOOK',
  '#',
  '# Fill in the blank third column only. Keep the identifier and English source unchanged.',
  '# Preserve placeholders such as {n}, {total}, {name}, {score}, and {max} exactly.',
  '# Do not translate URLs, e-mail addresses, technical IDs, or answer-key IDs.',
  '',
  '# ================================================================',
  '# A. CLIENT INTERFACE — REQUIRED',
  '# ================================================================',
  '# identifier\tEnglish source\tYour Dhivehi translation',
  ...catalogueSections.flatMap(([title, pattern]) => [
    '', `## ${title}`,
    ...catalogue.filter(([key]) => pattern.test(key)).map(([key, value]) => `${key}\t${escape(value)}\t`),
  ]),
  '',
  '# ================================================================',
  '# B. CLIENT PAGE TITLES, ACCESSIBILITY LABELS AND METADATA — REQUIRED',
  '# ================================================================',
  '# identifier\tEnglish source\tYour Dhivehi translation',
  ...rows('client.visible', clientVisible),
  '',
  '# ================================================================',
  '# C. ADMIN WEBSITE — REQUIRED',
  '# ================================================================',
  '# identifier\tEnglish source\tYour Dhivehi translation',
  ...rows('admin.visible', adminVisible),
  '',
  '# ================================================================',
  '# D. VISIBLE DEMO CONTENT — REQUIRED FOR A FULLY DHIVEHI DEMO',
  '# These are fictional placeholders, not approved teaching material.',
  '# ================================================================',
  '# identifier\tEnglish source\tYour Dhivehi translation',
  '', '## Courses, modules and lessons', ...rows('demo.course', demoValues.slice(0, worksheetStart)),
  '', '## Worksheets and exam practice', ...rows('demo.worksheet', demoValues.slice(worksheetStart, presentationStart)),
  '', '## Presentations', ...rows('demo.presentation', demoValues.slice(presentationStart, documentStart)),
  '', '## Documents', ...rows('demo.document', demoValues.slice(documentStart, planStart)),
  '', '## Plans and plan features', ...rows('demo.plan', demoValues.slice(planStart, studentStart)),
  '', '## Fictional students and remaining sample content', ...rows('demo.other', demoValues.slice(studentStart)),
  '',
  '# ================================================================',
  '# E. GENERATED SAMPLE PDF — REQUIRED',
  '# ================================================================',
  '# identifier\tEnglish source\tYour Dhivehi translation',
  'pdf.visible.001\tGaabe Institute - DEMO PDF\t',
  'pdf.visible.002\tThis generated sample is not course material.\t',
  'pdf.visible.003\tIt only proves that PDF viewing works in the browser.\t',
];

await writeFile(resolve(root, 'docs/DHIVEHI_FRONTEND_TRANSLATION_SOURCE.txt'), `${lines.join('\n')}\n`, 'utf8');
