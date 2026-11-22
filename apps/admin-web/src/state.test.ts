import { describe, expect, it } from 'vitest';
import { canPublish, EMPTY_CHECKS, uid } from './state';

describe('publishing gate', () => {
  it('blocks publishing until every check is ticked', () => {
    expect(canPublish(EMPTY_CHECKS)).toBe(false);
    expect(canPublish({ ...EMPTY_CHECKS, titleOk: true, contentReviewed: true, dhivehiVerified: true })).toBe(false);
    expect(
      canPublish({ titleOk: true, contentReviewed: true, dhivehiVerified: true, religiousContentApproved: true }),
    ).toBe(true);
  });

  it('religious-content approval alone is not enough', () => {
    expect(canPublish({ ...EMPTY_CHECKS, religiousContentApproved: true })).toBe(false);
  });

  it('generates unique prefixed ids', () => {
    const a = uid('x');
    const b = uid('x');
    expect(a).toMatch(/^x-/);
    expect(a).not.toBe(b);
  });
});
