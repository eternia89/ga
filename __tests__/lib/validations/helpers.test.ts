import { describe, it, expect } from 'vitest';
import { optionalUuid } from '@/lib/validations/helpers';

describe('optionalUuid', () => {
  const schema = optionalUuid();

  it('accepts a valid UUID and returns it unchanged', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(schema.parse(uuid)).toBe(uuid);
  });

  it('transforms empty string to null', () => {
    expect(schema.parse('')).toBeNull();
  });

  it('passes null through as null', () => {
    expect(schema.parse(null)).toBeNull();
  });

  it('passes undefined through as null', () => {
    expect(schema.parse(undefined)).toBeNull();
  });

  it('rejects invalid non-UUID strings', () => {
    expect(() => schema.parse('not-a-uuid')).toThrow();
  });

  it('accepts custom error message', () => {
    const custom = optionalUuid('Custom error');
    expect(() => custom.parse('bad')).toThrow('Custom error');
  });
});
