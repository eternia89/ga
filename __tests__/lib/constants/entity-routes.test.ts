import { describe, it, expect } from 'vitest';
import { getEntityRoute, ENTITY_ROUTES } from '@/lib/constants/entity-routes';

describe('ENTITY_ROUTES', () => {
  it('maps all expected table names', () => {
    const expectedTables = [
      'requests',
      'jobs',
      'inventory_items',
      'companies',
      'divisions',
      'locations',
      'categories',
      'user_profiles',
      'maintenance_templates',
      'maintenance_schedules',
      'job_comments',
      'notifications',
      'media_attachments',
      'inventory_movements',
      'job_status_changes',
    ];
    for (const table of expectedTables) {
      expect(ENTITY_ROUTES).toHaveProperty(table);
    }
  });
});

describe('getEntityRoute', () => {
  it('returns # for unknown table names', () => {
    expect(getEntityRoute('unknown_table', 'abc-123')).toBe('#');
    expect(getEntityRoute('foo', 'bar')).toBe('#');
  });

  it('returns # for entities with empty base path (notifications, media_attachments)', () => {
    expect(getEntityRoute('notifications', 'abc-123')).toBe('#');
    expect(getEntityRoute('media_attachments', 'abc-123')).toBe('#');
  });

  it('returns base path without ID for settings entities', () => {
    // Settings entities have no individual detail pages
    expect(getEntityRoute('companies', 'abc-123')).toBe('/admin/settings');
    expect(getEntityRoute('divisions', 'abc-123')).toBe('/admin/settings');
    expect(getEntityRoute('locations', 'abc-123')).toBe('/admin/settings');
    expect(getEntityRoute('categories', 'abc-123')).toBe('/admin/settings');
  });

  it('returns basePath/recordId for entities with detail pages', () => {
    const recordId = 'abc-123-def-456';
    expect(getEntityRoute('requests', recordId)).toBe(`/requests/${recordId}`);
    expect(getEntityRoute('jobs', recordId)).toBe(`/jobs/${recordId}`);
    expect(getEntityRoute('inventory_items', recordId)).toBe(`/inventory/${recordId}`);
    expect(getEntityRoute('user_profiles', recordId)).toBe(`/admin/users/${recordId}`);
    expect(getEntityRoute('maintenance_templates', recordId)).toBe(`/maintenance/templates/${recordId}`);
    expect(getEntityRoute('maintenance_schedules', recordId)).toBe(`/maintenance/${recordId}`);
  });

  it('returns parent basePath/recordId for child entities', () => {
    // Child entities (comments, movements, status changes) resolve using their record ID
    // In practice, caller passes the parent ID — the function just appends
    const parentId = 'parent-job-id';
    expect(getEntityRoute('job_comments', parentId)).toBe(`/jobs/${parentId}`);
    expect(getEntityRoute('inventory_movements', parentId)).toBe(`/inventory/${parentId}`);
    expect(getEntityRoute('job_status_changes', parentId)).toBe(`/jobs/${parentId}`);
  });
});
