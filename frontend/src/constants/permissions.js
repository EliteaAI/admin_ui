/**
 * Administration mode permissions constants
 * These permissions control access to admin UI sections and actions
 */
export const PERMISSIONS = {
  // Users section
  users: {
    section: "admin.auth.users",
    view: "configuration.users.users.view",
    create: "configuration.users.users.create",
    edit: "configuration.users.users.edit",
    delete: "configuration.users.users.delete",
    superAdmin: "admin.auth.users.super_admin",
  },

  // Projects section
  projects: {
    section: "projects",
    list: "projects.projects",
    view: "projects.projects.projects.view",
    edit: "projects.projects.projects.edit",
  },

  // Roles/Permissions section
  roles: {
    section: "configuration.roles",
    view: "configuration.roles.roles.view",
    create: "configuration.roles.roles.create",
    edit: "configuration.roles.roles.edit",
    delete: "configuration.roles.roles.delete",
    permissions: {
      view: "configuration.roles.permissions.view",
      edit: "configuration.roles.permissions.edit",
    },
    userProjectPermissions: {
      view: "configuration.roles.user_project_permissions.view",
      edit: "configuration.roles.user_project_permissions.edit",
    },
  },

  // Configuration section
  configuration: {
    section: "configuration",
    users: "configuration.users",
    roles: "configuration.roles",
    advanced: "configuration.advanced",
    serviceDescriptors: "configuration.service_descriptors",
  },

  // Runtime section (super_admin only)
  runtime: {
    section: "runtime",
    plugins: "runtime.plugins",
  },

  // Migration section (super_admin only)
  migration: {
    section: "migration",
    db: "migration.db",
    permissions: "migration.permissions",
  },

  // Modes section
  modes: {
    section: "modes",
    users: "modes.users",
  },

  // Invites section
  invites: {
    section: "invites",
    platform: "invites.platform",
    bulkUsers: "invites.bulkusers",
    bulkProjects: "invites.bulkprojects",
  },

  // Secrets section
  secrets: {
    list: "configuration.secrets.secret.list",
    create: "configuration.secrets.secret.create",
  },

  // LiteLLM section
  litellm: {
    section: "configuration.litellm",
  },

  // Scheduling section
  scheduling: {
    view: "configuration.scheduling.schedules.view",
    edit: "configuration.scheduling.schedules.edit",
  },

  // Audit Trail
  auditTrail: {
    view: "models.admin.audit_trail.view",
  },
};

/**
 * Role names used in administration mode
 */
export const ADMIN_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  EDITOR: "editor",
  VIEWER: "viewer",
};

export const SIDEBAR_PERMISSIONS = {
  users: [PERMISSIONS.users.section],
  roles: [PERMISSIONS.roles.section, PERMISSIONS.roles.permissions.view],
  projects: [PERMISSIONS.projects.section, PERMISSIONS.projects.list],
  secrets: [PERMISSIONS.secrets.list, PERMISSIONS.secrets.create],
  litellm: [PERMISSIONS.litellm.section],
  configuration: [
    PERMISSIONS.configuration.section,
    PERMISSIONS.runtime.plugins,
  ],
  "audit-trail": [PERMISSIONS.auditTrail.view],
  "schedules-tasks": [PERMISSIONS.scheduling.view, PERMISSIONS.runtime.plugins],
};

export default PERMISSIONS;
