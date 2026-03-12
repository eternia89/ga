import { describe, it, expect } from 'vitest';
import { z } from 'zod';

/**
 * Unit tests for the updateUserCompanyAccess Zod schema.
 *
 * The schema is redeclared inline to avoid importing from the action file
 * (which uses 'use server' and next-safe-action — server-only dependencies).
 */
const updateUserCompanyAccessSchema = z.object({
  userId: z.string().uuid(),
  companyIds: z.array(z.string().uuid()),
});

const VALID_UUID_1 = '00000000-0000-4000-a000-000000000001';
const VALID_UUID_2 = '00000000-0000-4000-a000-000000000002';

describe('updateUserCompanyAccess schema', () => {
  it('Test 1: valid input passes schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: VALID_UUID_1,
      companyIds: [VALID_UUID_2],
    });
    expect(result.success).toBe(true);
  });

  it('Test 2: non-UUID userId fails schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: 'not-a-uuid',
      companyIds: [VALID_UUID_1],
    });
    expect(result.success).toBe(false);
  });

  it('Test 3: non-UUID string in companyIds array fails schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: VALID_UUID_1,
      companyIds: ['not-a-uuid'],
    });
    expect(result.success).toBe(false);
  });

  it('Test 4: empty companyIds array is valid (clearing all access)', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: VALID_UUID_1,
      companyIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('Test 5: missing userId field fails schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      companyIds: [VALID_UUID_1],
    });
    expect(result.success).toBe(false);
  });

  it('Test 6: companyIds as a string (not array) fails schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: VALID_UUID_1,
      companyIds: VALID_UUID_2,
    });
    expect(result.success).toBe(false);
  });

  it('Test 7: null companyIds fails schema', () => {
    const result = updateUserCompanyAccessSchema.safeParse({
      userId: VALID_UUID_1,
      companyIds: null,
    });
    expect(result.success).toBe(false);
  });
});
