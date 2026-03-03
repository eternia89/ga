/**
 * Shared selector patterns based on actual component code.
 * No data-testid — uses accessible roles, labels, and CSS classes.
 */

export const SELECTORS = {
  // Login page (app/(auth)/login/page.tsx)
  login: {
    emailInput: '#email',
    passwordInput: '#password',
    signInButton: 'button[type="submit"]',
    googleButton: 'button:has-text("Sign in with Google")',
    errorAlert: '.bg-red-50',
    forgotPassword: 'a[href="/reset-password"]',
  },

  // Sidebar (components/sidebar.tsx)
  sidebar: {
    container: 'aside',
    sectionTitle: 'aside h2',
    navLink: 'aside a',
    activeLink: 'aside .bg-blue-50',
    companyName: 'aside h1',
  },

  // User menu (components/user-menu.tsx)
  userMenu: {
    trigger: 'aside .border-t button',
    dropdown: 'aside .border-t .absolute',
    profileButton: '[data-profile-trigger]',
    signOutButton: 'button:has-text("Sign out")',
    settingsLink: 'a[href="/admin/settings"]',
    userName: 'aside .border-t p.font-medium',
    roleBadge: 'aside .border-t p.text-xs',
  },

  // Inline feedback (components/inline-feedback.tsx)
  feedback: {
    success: '.bg-green-50',
    error: '.bg-red-50',
    dismiss: 'button[aria-label="Dismiss"]',
  },

  // Combobox (components/combobox.tsx)
  combobox: {
    trigger: '[role="combobox"]',
    searchInput: '[cmdk-input]',
    option: '[cmdk-item]',
    empty: '[cmdk-empty]',
  },

  // Delete confirm dialog (components/delete-confirm-dialog.tsx)
  deleteDialog: {
    container: '[role="alertdialog"]',
    confirmInput: '#confirm-text',
    deleteButton: 'button:has-text("Deactivate")',
    cancelButton: 'button:has-text("Cancel")',
    dependencyBlock: '.bg-destructive\\/10',
  },

  // Dialog (shadcn)
  dialog: {
    container: '[role="dialog"]',
    closeButton: 'button:has(.sr-only:text("Close"))',
  },

  // Data table
  dataTable: {
    searchInput: 'input[placeholder="Search..."]',
    table: 'table',
    thead: 'thead',
    tbody: 'tbody',
    row: 'tbody tr',
    sortButton: 'thead button',
    pagination: {
      next: 'button:has-text("Next")',
      previous: 'button:has-text("Previous")',
      pageInfo: 'text=/Page \\d+ of \\d+/',
      rowsPerPage: 'text=/\\d+ of \\d+ row/',
    },
  },

  // Photo upload (components/media/)
  photoUpload: {
    dropzone: 'input[type="file"]',
  },
} as const;
