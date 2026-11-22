import { useStored } from '@gaabe/ui';
import {
  courses as seedCourses,
  plans as seedPlans,
  presentations as seedPresentations,
  students as seedStudents,
  worksheets as seedWorksheets,
  type Course,
  type DemoStudent,
  type Plan,
  type Presentation,
} from '@gaabe/demo-data';
import type { Worksheet } from '@gaabe/worksheets';

/**
 * MOCK STORES. Everything the admin app "saves" lives in this browser's localStorage under
 * `gaabe.admin.*`. There is no server, no authentication and no permission check. The admin app
 * MUST NOT be deployed until real authentication, authorisation and an API exist.
 */
const K = (n: string) => `gaabe.admin.${n}`;

export const useStudents = () => useStored<DemoStudent[]>(K('students'), seedStudents);
export const useCourses = () => useStored<Course[]>(K('courses'), seedCourses);
export const useWorksheets = () => useStored<Worksheet[]>(K('worksheets'), seedWorksheets);
export const usePresentations = () => useStored<Presentation[]>(K('presentations'), seedPresentations);
export const usePlans = () => useStored<(Plan & { active: boolean })[]>(K('plans'), seedPlans.map((p) => ({ ...p, active: true })));

export interface UploadRecord {
  id: string;
  name: string;
  size: number;
  type: string;
  addedAt: string;
  /** Always 'local-only' in this prototype: the file bytes are never sent anywhere. */
  storage: 'local-only';
}
export const useUploads = () => useStored<UploadRecord[]>(K('uploads'), []);

export type PublishStatus = 'draft' | 'in_review' | 'published';
export interface PublishChecks {
  titleOk: boolean;
  contentReviewed: boolean;
  dhivehiVerified: boolean;
  religiousContentApproved: boolean;
}
export interface PublishRecord {
  status: PublishStatus;
  checks: PublishChecks;
}
export const useStatuses = () => useStored<Record<string, PublishRecord>>(K('publish'), {});

export interface AuditEntry {
  id: string;
  at: string;
  text: string;
}
export const useAudit = () => useStored<AuditEntry[]>(K('audit'), []);

export const EMPTY_CHECKS: PublishChecks = {
  titleOk: false,
  contentReviewed: false,
  dhivehiVerified: false,
  religiousContentApproved: false,
};

export function uid(prefix: string): string {
  const r = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${r.slice(0, 8)}`;
}

export function canPublish(c: PublishChecks): boolean {
  return c.titleOk && c.contentReviewed && c.dhivehiVerified && c.religiousContentApproved;
}
