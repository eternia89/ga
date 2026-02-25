// Maps database table names to their application route paths.
// Used by audit trail viewer (Plan 02) and GPS links in job timeline.

export const ENTITY_ROUTES: Record<string, string> = {
  requests: '/requests',
  jobs: '/jobs',
  inventory_items: '/inventory',
  companies: '/admin/settings',
  divisions: '/admin/settings',
  locations: '/admin/settings',
  categories: '/admin/settings',
  user_profiles: '/admin/users',
  maintenance_templates: '/maintenance/templates',
  maintenance_schedules: '/maintenance',
  job_comments: '/jobs',
  notifications: '',
  media_attachments: '',
  inventory_movements: '/inventory',
  job_status_changes: '/jobs',
};

/**
 * Returns the application route for a given table name and record ID.
 *
 * - Entities with individual detail pages: returns /path/recordId
 * - Settings entities (no individual detail page): returns the base path
 * - Entities with no detail page: returns '#'
 *
 * Entities that link to their parent (job_comments, inventory_movements,
 * job_status_changes) require the parent ID, not the record's own ID.
 */
export function getEntityRoute(tableName: string, recordId: string): string {
  const basePath = ENTITY_ROUTES[tableName];

  if (basePath === undefined) {
    return '#';
  }

  if (basePath === '') {
    return '#';
  }

  // Settings entities — no individual detail pages
  const settingsEntities = ['companies', 'divisions', 'locations', 'categories'];
  if (settingsEntities.includes(tableName)) {
    return basePath;
  }

  // Entities with detail pages
  return `${basePath}/${recordId}`;
}
