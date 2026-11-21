/**
 * Message catalogue.
 *
 * ENGLISH is the source dictionary and defines every key.
 *
 * DHIVEHI entries below are DRAFTS. They have NOT been reviewed by a fluent
 * Dhivehi speaker and must not be presented as verified. Every entry carries a
 * review status (draft → reviewed → approved). Keys with no Dhivehi entry fall
 * back to English and the UI tags that fallback text lang="en" dir="ltr".
 * Marketing copy and anything religious is deliberately NOT drafted here.
 */
export type Locale = 'dv' | 'en';
export type ReviewStatus = 'draft' | 'reviewed' | 'approved';

export const en = {
  // brand / navigation
  'brand.name': 'Gaabe Institute',
  'brand.tagline': 'Islamic studies tuition, taught with care',
  'nav.home': 'Home',
  'nav.courses': 'Courses',
  'nav.pricing': 'Pricing',
  'nav.dashboard': 'Dashboard',
  'nav.worksheets': 'Worksheets',
  'nav.exams': 'Exam preparation',
  'nav.presentations': 'Presentations',
  'nav.documents': 'Documents',
  'nav.signIn': 'Sign in',
  'nav.register': 'Register',
  'nav.signOut': 'Sign out',
  'nav.menu': 'Menu',
  'nav.skipToContent': 'Skip to content',
  'nav.language': 'Language',
  'nav.theme': 'Theme',
  // common
  'common.continue': 'Continue',
  'common.start': 'Start',
  'common.submit': 'Submit',
  'common.next': 'Next',
  'common.previous': 'Previous',
  'common.save': 'Save',
  'common.cancel': 'Cancel',
  'common.free': 'Free',
  'common.premium': 'Premium',
  'common.locked': 'Locked',
  'common.progress': 'Progress',
  'common.price': 'Price',
  'common.lessons': 'Lessons',
  'common.students': 'Students',
  'common.teacher': 'Teacher',
  'common.search': 'Search',
  'common.status': 'Status',
  'common.actions': 'Actions',
  'common.back': 'Back',
  'common.demo': 'Demonstration data',
  'common.demoNotice':
    'Demonstration data — sample content and prices are placeholders, not real courses or fees. No backend is connected.',
  'common.dhivehiDraftNotice':
    'Dhivehi interface text is an unreviewed draft awaiting review by a fluent Dhivehi speaker. Untranslated text appears in English.',
  // home
  'home.hero.title': 'Learn Islamic studies with a teacher you can trust',
  'home.hero.subtitle':
    'Structured lessons, interactive worksheets and guided revision for students in the Maldives.',
  'home.hero.cta': 'Browse courses',
  'home.hero.cta2': 'See pricing',
  'home.featured': 'Featured courses',
  'home.benefits': 'Why learn here',
  'home.benefit.interactive.title': 'Interactive worksheets',
  'home.benefit.interactive.body':
    'Answer questions inside the platform with instant feedback on objective questions.',
  'home.benefit.listen.title': 'Listen as you learn',
  'home.benefit.listen.body':
    'Read Aloud for English today. Dhivehi narration will be switched on only after a verified voice is integrated.',
  'home.benefit.bilingual.title': 'Dhivehi and English',
  'home.benefit.bilingual.body':
    'Right-to-left Dhivehi and left-to-right English layouts with correct Thaana rendering.',
  'home.benefit.progress.title': 'Track your progress',
  'home.benefit.progress.body': 'Pick up where you left off on any device.',
  // courses
  'courses.title': 'Courses',
  'courses.subtitle': 'Sample catalogue (demonstration data)',
  'courses.filter.all': 'All',
  'courses.filter.free': 'Free',
  'courses.filter.premium': 'Premium',
  'courses.modules': 'Modules',
  'courses.enrol': 'Enrol',
  'courses.premiumLocked': 'Premium lesson — subscribe to unlock',
  'courses.notFound': 'Course not found',
  // lesson
  'lesson.markComplete': 'Mark as complete',
  'lesson.completed': 'Completed',
  'lesson.notes': 'Teacher notes',
  'lesson.sectionN': 'Section {n}',
  // read aloud
  'speech.readAloud': 'Read aloud',
  'speech.play': 'Play',
  'speech.pause': 'Pause',
  'speech.resume': 'Resume',
  'speech.stop': 'Stop',
  'speech.replay': 'Replay',
  'speech.previous': 'Previous section',
  'speech.next': 'Next section',
  'speech.speed': 'Speed',
  'speech.voice': 'Voice',
  'speech.mode': 'Narration mode',
  'speech.mode.original': 'Original text',
  'speech.mode.translation': 'Approved translation',
  'speech.mode.teacher': 'Teacher explanation',
  'speech.unavailable.dv':
    'Dhivehi narration is not available yet. No verified Dhivehi speech engine has been integrated, and other languages will not be substituted.',
  'speech.unavailable.ar':
    'Arabic is only played from approved recordings by qualified reciters. No approved recording is attached, and synthetic speech is not used for Quranic text.',
  'speech.unavailable.en':
    'English speech is not available in this browser or no English voice is installed.',
  'speech.unavailable.teacher': 'No teacher recording has been uploaded for this section.',
  'speech.error': 'Playback failed. Please try again.',
  'speech.nowReading': 'Now reading',
  'speech.demoAudio':
    'Placeholder tone for testing the audio player — this is not a recording of Gaabe Sir.',
  // worksheet
  'worksheet.title': 'Worksheets',
  'worksheet.question': 'Question {n} of {total}',
  'worksheet.points': '{n} points',
  'worksheet.answered': '{answered} of {total} answered',
  'worksheet.submit': 'Submit worksheet',
  'worksheet.confirmSubmit': 'Submit your answers? You cannot change them afterwards.',
  'worksheet.score': 'Score: {score} / {max}',
  'worksheet.correct': 'Correct',
  'worksheet.incorrect': 'Incorrect',
  'worksheet.partial': 'Partly correct',
  'worksheet.pendingReview': 'Awaiting teacher review',
  'worksheet.retry': 'Try again',
  'worksheet.autosaved': 'Answers saved on this device',
  'worksheet.demoGrading':
    'Demo grading runs in your browser. In production, answer keys stay on the server and grading is server-authoritative.',
  'worksheet.typeAnswer': 'Type your answer',
  'worksheet.moveUp': 'Move up',
  'worksheet.moveDown': 'Move down',
  'worksheet.matchChoose': 'Choose a match',
  'worksheet.trueLabel': 'True',
  'worksheet.falseLabel': 'False',
  // exam
  'exam.title': 'Exam preparation',
  'exam.subtitle': 'Practice papers and revision checklists',
  'exam.practice': 'Practice worksheet',
  'exam.checklist': 'Revision checklist',
  'exam.timer': 'Practice timer (browser-only, not server-authoritative)',
  // presentation
  'presentation.title': 'Presentations',
  'presentation.slideN': 'Slide {n} of {total}',
  'presentation.fullscreen': 'Full screen',
  'presentation.exitFullscreen': 'Exit full screen',
  'presentation.thumbnails': 'Slide thumbnails',
  'presentation.noDownload':
    'Viewing only. This demo renders hand-written sample slides; real PowerPoint conversion needs the server pipeline.',
  'presentation.readSlide': 'Read this slide',
  'presentation.readAll': 'Read all slides',
  // documents
  'document.title': 'Study documents',
  'document.paragraphN': 'Paragraph {n}',
  'document.readParagraph': 'Read this paragraph',
  'document.sampleNotice':
    'Sample structured document. Real PDFs are converted and text-extracted by the server pipeline, which is not built yet.',
  // pricing
  'pricing.title': 'Pricing',
  'pricing.subtitle': 'Sample plans — prices are placeholders pending the client',
  'pricing.perMonth': 'per month',
  'pricing.perTerm': 'per term',
  'pricing.perYear': 'per year',
  'pricing.choose': 'Choose plan',
  'pricing.checkoutTitle': 'Simulated checkout',
  'pricing.checkoutBody':
    'This is a demonstration. No payment is taken and no card details are collected. Confirming only unlocks premium sample lessons in this browser.',
  'pricing.confirm': 'Confirm demo purchase',
  'pricing.active': 'Demo subscription active',
  'pricing.reset': 'Reset demo subscription',
  // auth
  'auth.signIn.title': 'Sign in',
  'auth.register.title': 'Create an account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.name': 'Full name',
  'auth.guardian': 'I am registering on behalf of a student under 18',
  'auth.demoNotice':
    'Demo only: no account is created and no password is stored or checked. Real authentication is not built yet.',
  'auth.signedInAs': 'Signed in (demo) as {name}',
  // dashboard
  'dashboard.title': 'Your dashboard',
  'dashboard.enrolled': 'Your courses',
  'dashboard.recent': 'Recent activity',
  'dashboard.nothing': 'Nothing here yet.',
  'dashboard.subscription': 'Subscription',
  'dashboard.noSubscription': 'No active subscription',
  // errors
  'error.title': 'Something went wrong',
  'error.body': 'An unexpected error occurred. You can reload the page.',
  'error.reload': 'Reload',
  'error.notFound': 'Page not found',
  'error.goHome': 'Go to home',
  // admin
  'admin.title': 'Administration',
  'admin.nav.dashboard': 'Dashboard',
  'admin.nav.students': 'Students',
  'admin.nav.courses': 'Courses',
  'admin.nav.lessons': 'Lesson editor',
  'admin.nav.worksheets': 'Worksheet builder',
  'admin.nav.documents': 'Document upload',
  'admin.nav.presentations': 'Presentations',
  'admin.nav.subscriptions': 'Subscriptions',
  'admin.nav.publishing': 'Publishing',
  'admin.mockNotice':
    'Mock data: nothing on this screen is saved to a server. Authentication and permissions are not enforced yet.',
} as const;

export type MessageKey = keyof typeof en;

const draft = (text: string) => ({ text, status: 'draft' as ReviewStatus });

/** DRAFT Dhivehi. Not verified. See file header. */
export const dv: Partial<Record<MessageKey, { text: string; status: ReviewStatus }>> = {
  'nav.home': draft('ހޯމް'),
  'nav.courses': draft('ކޯސްތައް'),
  'nav.pricing': draft('އަގުތައް'),
  'nav.dashboard': draft('ޑޭޝްބޯޑް'),
  'nav.worksheets': draft('ވަރކްޝީޓްތައް'),
  'nav.signIn': draft('ލޮގިން'),
  'nav.register': draft('ރަޖިސްޓަރ'),
  'nav.language': draft('ބަސް'),
  'common.continue': draft('ކުރިއަށް'),
  'common.submit': draft('ހުށަހަޅާ'),
  'common.next': draft('ދެން'),
  'common.previous': draft('ފަހަތަށް'),
  'common.free': draft('ފްރީ'),
  'common.progress': draft('ޕްރޮގްރެސް'),
  'common.price': draft('އަގު'),
  'common.lessons': draft('ދަރުސްތައް'),
  'common.students': draft('ދަރިވަރުން'),
  'common.teacher': draft('އުސްތާޛު'),
  'courses.title': draft('ކޯސްތައް'),
  'admin.nav.students': draft('ދަރިވަރުން'),
  'admin.nav.courses': draft('ކޯސްތައް'),
};

export const LOCALES: Record<
  Locale,
  { nativeLabel: string; label: string; dir: 'rtl' | 'ltr'; bcp47: string }
> = {
  dv: { nativeLabel: 'ދިވެހި', label: 'Dhivehi', dir: 'rtl', bcp47: 'dv-MV' },
  en: { nativeLabel: 'English', label: 'English', dir: 'ltr', bcp47: 'en' },
};
