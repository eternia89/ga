import { describe, it, expect } from 'vitest';
import { formatIDR, parseIDR, formatNumber, emptyToNull } from '@/lib/utils';

describe('formatIDR', () => {
  it('formats 1500000 as IDR currency', () => {
    const result = formatIDR(1500000);
    // Intl.NumberFormat('id-ID') uses non-breaking space and dot separators
    expect(result).toMatch(/Rp\s*1[.,]500[.,]000/);
  });

  it('formats 0 as Rp 0', () => {
    const result = formatIDR(0);
    expect(result).toMatch(/Rp\s*0/);
  });

  it('formats small amount 500 without separators', () => {
    const result = formatIDR(500);
    expect(result).toMatch(/Rp\s*500/);
  });
});

describe('formatNumber', () => {
  it('formats 1500000 with dot separators', () => {
    const result = formatNumber(1500000);
    expect(result).toMatch(/1[.,]500[.,]000/);
  });

  it('formats 0 as "0"', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('parseIDR', () => {
  it('parses "Rp 1.500.000" to 1500000', () => {
    expect(parseIDR('Rp 1.500.000')).toBe(1500000);
  });

  it('parses plain number string "1500000" to 1500000', () => {
    expect(parseIDR('1500000')).toBe(1500000);
  });

  it('returns 0 for empty string', () => {
    expect(parseIDR('')).toBe(0);
  });

  it('parses "Rp 0" to 0', () => {
    expect(parseIDR('Rp 0')).toBe(0);
  });

  it('strips non-digit characters', () => {
    expect(parseIDR('Rp 10.000.000')).toBe(10000000);
  });
});

describe('emptyToNull', () => {
  it('converts empty strings to null', () => {
    const result = emptyToNull({ name: 'test', phone: '' });
    expect(result.name).toBe('test');
    expect(result.phone).toBeNull();
  });

  it('converts undefined to null', () => {
    const result = emptyToNull({ name: 'test', phone: undefined });
    expect(result.phone).toBeNull();
  });

  it('preserves non-empty values', () => {
    const result = emptyToNull({ name: 'test', count: 0, active: false });
    expect(result.name).toBe('test');
    expect(result.count).toBe(0);
    expect(result.active).toBe(false);
  });
});
