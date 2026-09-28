export const DEFAULT_LIMIT_FIELDS = [
  {
    key: 'cost_budgets_project_monthly_limit',
    title: 'Default Team Project Limit',
    hint: 'Monthly limit in USD for team projects with no limit set explicitly. Leave empty for unlimited.',
  },
  {
    key: 'cost_budgets_personal_project_monthly_limit',
    title: 'Default User Limit',
    hint: "Monthly limit in USD for each user's own budget. API and token calls made without a project are billed here. Leave empty for unlimited.",
  },
  {
    key: 'cost_budgets_user_monthly_limit',
    title: 'Default Per-Member Limit Inside A Project',
    hint: "Monthly limit in USD for a single member's spend within a project, so one member cannot consume the whole project budget. Leave empty for unlimited.",
  },
];

export const WARNING_THRESHOLD_FIELDS = [
  {
    key: 'usage_project_warning_pct',
    title: 'Team Project Budget Warning Threshold',
    hint: "Show a usage alert when a team project's spend reaches this percentage of its budget limit.",
  },
  {
    key: 'usage_personal_project_warning_pct',
    title: 'Personal Project Budget Warning Threshold',
    hint: "Show a usage alert when a user's own project spend reaches this percentage of its budget limit.",
  },
  {
    key: 'usage_user_warning_pct',
    title: 'Default Per-Member Budget Warning Threshold',
    hint: "Show a usage alert when a member's spend inside a team project reaches this percentage of their own budget limit.",
  },
];

export const WARNING_DISMISSIBLE_FIELD = {
  key: 'usage_warnings_dismissible',
  title: 'Allow Users To Dismiss Budget Warnings',
  hint: 'Show a close button on the budget warning banner. A dismissed warning returns when spend reaches the next level (90% and 95%).',
};

// Mode select, the apply-defaults and dismissible toggles, plus every limit and threshold field
export const COST_BUDGETS_SETTINGS_COUNT = 3 + DEFAULT_LIMIT_FIELDS.length + WARNING_THRESHOLD_FIELDS.length;
