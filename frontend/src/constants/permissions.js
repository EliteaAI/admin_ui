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
    edit: "configuration.secrets.secret.edit",
    delete: "configuration.secrets.secret.delete",
  },

  // LiteLLM section
  litellm: {
    section: "configuration.litellm",
    edit: "configuration.litellm.edit",
  },

  // Model Prices section
  modelPrices: {
    view: "configuration.model_prices.prices.view",
    create: "configuration.model_prices.prices.create",
    edit: "configuration.model_prices.prices.edit",
    delete: "configuration.model_prices.prices.delete",
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

  // Project / user LLM spend budgets
  budgets: {
    view: "models.admin.project_budgets.view",
    edit: "models.admin.project_budgets.edit",
  },

  // Surveys
  surveys: {
    manage: "models.admin.surveys.manage",
    reports: "models.admin.surveys.reports.view",
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
  NONE: "",
};

export const SIDEBAR_PERMISSIONS = {
  users: [PERMISSIONS.users.section],
  roles: [PERMISSIONS.roles.section, PERMISSIONS.roles.permissions.view],
  projects: [PERMISSIONS.projects.section, PERMISSIONS.projects.list],
  budgets: [PERMISSIONS.budgets.view],
  secrets: [PERMISSIONS.secrets.list, PERMISSIONS.secrets.create],
  litellm: [PERMISSIONS.litellm.section],
  "model-prices": [PERMISSIONS.modelPrices.view],
  "app-requests": [PERMISSIONS.users.section],
  configuration: [
    PERMISSIONS.configuration.section,
    PERMISSIONS.runtime.plugins,
  ],
  features: [PERMISSIONS.configuration.section, PERMISSIONS.runtime.plugins],
  "audit-trail": [PERMISSIONS.auditTrail.view],
  "schedules-tasks": [PERMISSIONS.scheduling.view, PERMISSIONS.runtime.plugins],
  reports: [PERMISSIONS.surveys.reports],
};

/**
 * Permissions required for each Configuration page sub-section.
 * "advanced" and "service_descriptors" are restricted by super_admin role.
 * All other sections require the base configuration permission.
 */
export const CONFIG_SECTION_PERMISSIONS = {
  advanced: [PERMISSIONS.configuration.advanced],
  service_descriptors: [PERMISSIONS.configuration.serviceDescriptors],
};

/**
 * Permissions required to access each route.
 * Uses the same permission arrays as SIDEBAR_PERMISSIONS keyed by route path.
 * Routes not listed here are accessible to any authenticated user.
 */
export const ROUTE_PERMISSIONS = {
  "/users": SIDEBAR_PERMISSIONS.users,
  "/roles": SIDEBAR_PERMISSIONS.roles,
  "/projects": SIDEBAR_PERMISSIONS.projects,
  "/budgets": SIDEBAR_PERMISSIONS.budgets,
  "/secrets": SIDEBAR_PERMISSIONS.secrets,
  "/litellm": SIDEBAR_PERMISSIONS.litellm,
  "/model-prices": SIDEBAR_PERMISSIONS["model-prices"],
  "/app-requests": SIDEBAR_PERMISSIONS["app-requests"],
  "/configuration": SIDEBAR_PERMISSIONS.configuration,
  "/features": SIDEBAR_PERMISSIONS.configuration,
  "/audit-trail": SIDEBAR_PERMISSIONS["audit-trail"],
  "/schedules-tasks": SIDEBAR_PERMISSIONS["schedules-tasks"],
  "/reports": SIDEBAR_PERMISSIONS.reports,
};

export default PERMISSIONS;
