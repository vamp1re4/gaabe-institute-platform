/**
 * DEMONSTRATION DATA — every record here is fictional placeholder content used to exercise the UI.
 * It contains NO real course material, NO religious text and NO verified translations. Real content must be
 * written or approved by Gaabe Sir and loaded from a backend that does not exist yet.
 */
import type { SpeechLang } from '@gaabe/speech';
import type { Worksheet } from '@gaabe/worksheets';

export * from './demoPdf';

export const DEMO_LABEL = 'DEMO';

export interface ContentBlock {
  id: string;
  text: string;
  /** Stored language of this block — used for display direction and Read Aloud routing. */
  lang: SpeechLang;
  /** Marks content whose wording has not been reviewed by a qualified person. */
  unverified?: boolean;
}

export interface Lesson {
  id: string;
  title: string;
  free: boolean;
  minutes: number;
  blocks: ContentBlock[];
  /** When true the demo attaches a generated placeholder tone, NOT a real recording. */
  hasDemoTeacherAudio?: boolean;
  worksheetId?: string;
}

export interface Module {
  id: string;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  id: string;
  title: string;
  summary: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  free: boolean;
  status: 'published' | 'draft';
  modules: Module[];
}

const PLACEHOLDER =
  'This is placeholder lesson text used to test layout and Read Aloud. Replace it with material written or approved by Gaabe Sir. It is not real course content.';

function lesson(id: string, title: string, free: boolean, extra: Partial<Lesson> = {}): Lesson {
  return {
    id,
    title,
    free,
    minutes: 10,
    blocks: [
      { id: `${id}-b1`, lang: 'en', text: PLACEHOLDER },
      {
        id: `${id}-b2`,
        lang: 'en',
        text: 'A second paragraph lets you try the previous and next controls. Each sentence is read separately so the current sentence can be followed.',
      },
      // One-word Thaana sample taken from the DRAFT dictionary. Exists to prove RTL rendering and the
      // truthful "Dhivehi narration unavailable" state. Not a translation of the English above.
      { id: `${id}-b3`, lang: 'dv', text: 'ދަރުސްތައް', unverified: true },
    ],
    ...extra,
  };
}

export const courses: Course[] = [
  {
    id: 'sample-foundations',
    title: 'Sample Course A — Foundations',
    summary: 'Placeholder beginner course showing how modules and lessons are laid out.',
    level: 'Beginner',
    free: true,
    status: 'published',
    modules: [
      {
        id: 'a-m1',
        title: 'Module 1 (sample)',
        lessons: [
          lesson('a-l1', 'Sample lesson 1', true, { hasDemoTeacherAudio: true, worksheetId: 'ws-sample-1' }),
          lesson('a-l2', 'Sample lesson 2', true),
        ],
      },
      { id: 'a-m2', title: 'Module 2 (sample)', lessons: [lesson('a-l3', 'Sample lesson 3', false)] },
    ],
  },
  {
    id: 'sample-practice',
    title: 'Sample Course B — Guided Practice',
    summary: 'Placeholder intermediate course with premium lessons to demonstrate locked content.',
    level: 'Intermediate',
    free: false,
    status: 'published',
    modules: [
      {
        id: 'b-m1',
        title: 'Module 1 (sample)',
        lessons: [lesson('b-l1', 'Sample lesson 1', true), lesson('b-l2', 'Sample premium lesson 2', false)],
      },
    ],
  },
  {
    id: 'sample-revision',
    title: 'Sample Course C — Revision',
    summary: 'Placeholder revision course used by the exam preparation screens.',
    level: 'Advanced',
    free: false,
    status: 'published',
    modules: [{ id: 'c-m1', title: 'Module 1 (sample)', lessons: [lesson('c-l1', 'Sample lesson 1', false)] }],
  },
  {
    id: 'sample-draft',
    title: 'Sample Course D — Unpublished draft',
    summary: 'Draft course visible only in the admin app.',
    level: 'Beginner',
    free: false,
    status: 'draft',
    modules: [{ id: 'd-m1', title: 'Module 1 (sample)', lessons: [lesson('d-l1', 'Sample lesson 1', false)] }],
  },
];

export const publishedCourses = courses.filter((c) => c.status === 'published');

export function findCourse(id: string | undefined): Course | undefined {
  return courses.find((c) => c.id === id);
}

export function findLesson(courseId: string | undefined, lessonId: string | undefined) {
  const course = findCourse(courseId);
  if (!course) return undefined;
  const flat = course.modules.flatMap((m) => m.lessons);
  const index = flat.findIndex((l) => l.id === lessonId);
  const lesson = flat[index];
  if (!lesson) return undefined;
  return { course, lesson, prev: flat[index - 1], next: flat[index + 1], index, total: flat.length };
}

/* ---------- worksheets (neutral general-knowledge items; NOT religious content) ---------- */

export const worksheets: Worksheet[] = [
  {
    id: 'ws-sample-1',
    title: 'Sample worksheet (demonstration)',
    instructions:
      'Demonstration questions covering every question type. They are neutral general-knowledge items, not course material.',
    questions: [
      {
        id: 's1-q1', type: 'mcq', points: 1, promptLang: 'en',
        prompt: 'How many days are there in a week?',
        options: [{ id: 'a', text: 'Five' }, { id: 'b', text: 'Seven' }, { id: 'c', text: 'Ten' }],
        correct: 'b', explanation: 'A week has seven days.',
      },
      {
        id: 's1-q2', type: 'multi', points: 2, promptLang: 'en',
        prompt: 'Select all the even numbers.',
        options: [{ id: 'a', text: '2' }, { id: 'b', text: '3' }, { id: 'c', text: '8' }, { id: 'd', text: '9' }],
        correct: ['a', 'c'], explanation: '2 and 8 are divisible by two.',
      },
      {
        id: 's1-q3', type: 'truefalse', points: 1, promptLang: 'en',
        prompt: 'The Maldives is made up of coral atolls.',
        correct: true, explanation: 'The Maldives is an archipelago of atolls in the Indian Ocean.',
      },
      {
        id: 's1-q4', type: 'short', points: 2, promptLang: 'en',
        prompt: 'Type the number that comes after six, as a word.',
        accepted: ['seven', '7'], explanation: 'Seven (7).',
      },
      {
        id: 's1-q5', type: 'match', points: 3, promptLang: 'en',
        prompt: 'Match each item with its colour.',
        left: [{ id: 'l1', text: 'Grass' }, { id: 'l2', text: 'Sky' }, { id: 'l3', text: 'Snow' }],
        right: [{ id: 'r1', text: 'Green' }, { id: 'r2', text: 'Blue' }, { id: 'r3', text: 'White' }],
        pairs: { l1: 'r1', l2: 'r2', l3: 'r3' },
      },
      {
        id: 's1-q6', type: 'order', points: 3, promptLang: 'en',
        prompt: 'Put these numbers in ascending order using the arrows.',
        // Authored in a deliberately SCRAMBLED order: the display order must never reveal the answer key.
        items: [{ id: 'n3', text: '30' }, { id: 'n1', text: '10' }, { id: 'n2', text: '20' }],
        order: ['n1', 'n2', 'n3'],
      },
      {
        id: 's1-q7', type: 'essay', points: 5, promptLang: 'en',
        prompt: 'In a few sentences, describe your favourite place to study.',
      },
    ],
  },
  {
    id: 'ws-exam-practice',
    title: 'Practice paper (demonstration)',
    instructions: 'A short objective-only practice paper using neutral placeholder questions.',
    questions: [
      {
        id: 'ex-q1', type: 'mcq', points: 1, promptLang: 'en',
        prompt: 'Which of these is a prime number?',
        options: [{ id: 'a', text: '9' }, { id: 'b', text: '11' }, { id: 'c', text: '15' }],
        correct: 'b',
      },
      { id: 'ex-q2', type: 'truefalse', points: 1, promptLang: 'en', prompt: 'Zero is an even number.', correct: true },
      {
        id: 'ex-q3', type: 'short', points: 1, promptLang: 'en',
        prompt: 'What is 6 multiplied by 7?', accepted: ['42', 'forty-two', 'forty two'],
      },
    ],
  },
];

export function findWorksheet(id: string | undefined): Worksheet | undefined {
  return worksheets.find((w) => w.id === id);
}

/* ---------- exam preparation (generic study-skill checklist; no subject claims) ---------- */

export const revisionChecklist = [
  { id: 'rc1', text: 'Re-read your lesson notes' },
  { id: 'rc2', text: 'Complete the practice paper without notes' },
  { id: 'rc3', text: 'Review the questions you got wrong' },
  { id: 'rc4', text: 'Ask your teacher about anything unclear' },
];

/* ---------- presentation ---------- */

export interface Slide {
  id: string;
  title: string;
  bullets: string[];
  lang: SpeechLang;
  notes?: string;
}

export interface Presentation {
  id: string;
  title: string;
  status: 'published' | 'draft';
  slides: Slide[];
}

export const presentations: Presentation[] = [
  {
    id: 'pres-sample',
    title: 'Sample presentation (demonstration)',
    status: 'published',
    slides: [
      { id: 'sl1', lang: 'en', title: 'Welcome', bullets: ['Placeholder slide one', 'Slides are hand-written demo data'] },
      { id: 'sl2', lang: 'en', title: 'Navigation', bullets: ['Use the arrow keys or buttons', 'Open the thumbnails to jump', 'Try full screen'] },
      { id: 'sl3', lang: 'en', title: 'Read Aloud', bullets: ['English uses your browser voice', 'Dhivehi shows an honest unavailable message'] },
      { id: 'sl4', lang: 'dv', title: 'ދަރުސްތައް', bullets: ['ދަރުސްތައް'], notes: 'Unverified one-word Thaana sample for RTL testing.' },
    ],
  },
  { id: 'pres-draft', title: 'Unpublished sample deck', status: 'draft', slides: [{ id: 'sd1', lang: 'en', title: 'Draft', bullets: ['Not published'] }] },
];

/* ---------- document ---------- */

export const sampleDocument = {
  id: 'doc-sample',
  title: 'Sample study document (demonstration)',
  paragraphs: [
    { id: 'dp1', lang: 'en' as SpeechLang, text: 'This structured sample stands in for a converted PDF. Each paragraph can be read aloud separately.' },
    { id: 'dp2', lang: 'en' as SpeechLang, text: 'Real PDFs need a server-side pipeline for text extraction, page images and access control. That pipeline is not built yet.' },
    { id: 'dp3', lang: 'dv' as SpeechLang, text: 'ދަރުސްތައް' },
  ],
};

/* ---------- plans ---------- */

export interface Plan {
  id: string;
  name: string;
  /** PLACEHOLDER price in MVR — not a real fee. */
  priceMVR: number;
  period: 'month' | 'term' | 'year';
  features: string[];
  highlight?: boolean;
}

export const plans: Plan[] = [
  { id: 'free', name: 'Free sample', priceMVR: 0, period: 'month', features: ['Free lessons', 'Sample worksheet'] },
  { id: 'monthly', name: 'Monthly (placeholder)', priceMVR: 150, period: 'month', features: ['All premium lessons', 'All worksheets', 'Exam practice'], highlight: true },
  { id: 'term', name: 'Term (placeholder)', priceMVR: 400, period: 'term', features: ['Everything in Monthly', 'Presentations & documents'] },
];

/* ---------- admin demo records ---------- */

export interface DemoStudent {
  id: string;
  name: string;
  email: string;
  plan: string;
  progress: number;
  status: 'active' | 'suspended' | 'invited';
  joined: string;
}

export const students: DemoStudent[] = [
  { id: 'st1', name: 'Demo Student 01', email: 'demo01@example.invalid', plan: 'monthly', progress: 62, status: 'active', joined: '2026-09-02' },
  { id: 'st2', name: 'Demo Student 02', email: 'demo02@example.invalid', plan: 'term', progress: 35, status: 'active', joined: '2026-09-14' },
  { id: 'st3', name: 'Demo Student 03', email: 'demo03@example.invalid', plan: 'free', progress: 8, status: 'invited', joined: '2026-10-01' },
  { id: 'st4', name: 'Demo Student 04', email: 'demo04@example.invalid', plan: 'monthly', progress: 90, status: 'suspended', joined: '2026-08-20' },
];

export const adminStats = { students: students.length, activeSubscriptions: 2, publishedCourses: publishedCourses.length, draftItems: 2 };
