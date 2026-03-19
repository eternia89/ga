import { describe, it, expect } from 'vitest';
import type {
  ActionResponse,
  ActionOk,
  BulkDeactivateResponse,
  PhotosResponse,
  InvoicesResponse,
  DeleteAttachmentsResponse,
  ChecklistProgressResponse,
  ChecklistCompleteResponse,
  AdvanceScheduleResponse,
} from '@/lib/types/action-responses';

/**
 * These tests verify the ActionResponse type system at runtime.
 * TypeScript enforces compile-time compliance, but these tests document
 * the expected shapes and catch regressions if types are refactored.
 */
describe('ActionResponse type system', () => {
  it('ActionOk is { success: true }', () => {
    const response: ActionOk = { success: true };
    expect(response.success).toBe(true);
    expect(Object.keys(response)).toEqual(['success']);
  });

  it('ActionResponse<T> includes success + extra fields', () => {
    const response: ActionResponse<{ movementId: string }> = {
      success: true,
      movementId: 'abc-123',
    };
    expect(response.success).toBe(true);
    expect(response.movementId).toBe('abc-123');
  });

  it('BulkDeactivateResponse includes deleted and blocked', () => {
    const response: BulkDeactivateResponse = {
      success: true,
      deleted: 3,
      blocked: 1,
    };
    expect(response.success).toBe(true);
    expect(response.deleted).toBe(3);
    expect(response.blocked).toBe(1);
  });

  it('PhotosResponse includes photos array', () => {
    const response: PhotosResponse = {
      success: true,
      photos: [
        {
          id: '1',
          entity_type: 'asset_creation',
          entity_id: 'asset-1',
          file_name: 'photo.jpg',
          url: 'https://example.com/photo.jpg',
          created_at: '2026-03-18T00:00:00.000Z',
        },
      ],
    };
    expect(response.success).toBe(true);
    expect(response.photos).toHaveLength(1);
    expect(response.photos[0].file_name).toBe('photo.jpg');
  });

  it('InvoicesResponse includes invoices array', () => {
    const response: InvoicesResponse = {
      success: true,
      invoices: [],
    };
    expect(response.success).toBe(true);
    expect(response.invoices).toEqual([]);
  });

  it('DeleteAttachmentsResponse includes deleted count', () => {
    const response: DeleteAttachmentsResponse = {
      success: true,
      deleted: 5,
    };
    expect(response.deleted).toBe(5);
  });

  it('ChecklistProgressResponse includes completedCount and totalCount', () => {
    const response: ChecklistProgressResponse = {
      success: true,
      completedCount: 3,
      totalCount: 10,
    };
    expect(response.completedCount).toBe(3);
    expect(response.totalCount).toBe(10);
  });

  it('ChecklistCompleteResponse includes completedCount', () => {
    const response: ChecklistCompleteResponse = {
      success: true,
      completedCount: 10,
    };
    expect(response.completedCount).toBe(10);
  });

  it('AdvanceScheduleResponse includes advanced and optional nextDueAt', () => {
    const withNext: AdvanceScheduleResponse = {
      success: true,
      advanced: true,
      nextDueAt: '2026-04-18T00:00:00.000Z',
    };
    expect(withNext.advanced).toBe(true);
    expect(withNext.nextDueAt).toBeDefined();

    const withoutNext: AdvanceScheduleResponse = {
      success: true,
      advanced: false,
    };
    expect(withoutNext.advanced).toBe(false);
    expect(withoutNext.nextDueAt).toBeUndefined();
  });
});
