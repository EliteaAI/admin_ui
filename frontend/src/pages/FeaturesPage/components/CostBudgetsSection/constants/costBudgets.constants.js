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

export const COMPLEXITY_ENABLED_FIELD = {
  key: 'usage_complexity_enabled',
  title: 'Agent & Pipeline Complexity',
  hint: 'Calculated from usage metering data. Requires Cost Budgets Mode observe or enforce.',
};

export const COMPLEXITY_LEVELS = ['medium', 'high', 'extreme'];

export const COMPLEXITY_DEFAULT_THRESHOLDS = { medium: 10, high: 30, extreme: 100 };

export const COMPLEXITY_THRESHOLD_MIN = 0.1;
export const COMPLEXITY_THRESHOLD_MAX = 100000;

const levelTitle = level => level.charAt(0).toUpperCase() + level.slice(1);

export const COMPLEXITY_THRESHOLDS_INTRO =
  'Runs are labelled Low / Medium / High / Extreme by Complexity Units. Thresholds are calibrated automatically each night from real runs, once there are at least 200 runs across 10 agents. Until then the starting thresholds are used. A fixed threshold overrides both.';

export const COMPLEXITY_DEFAULT_GROUP = {
  title: 'Starting Thresholds (until calibrated)',
  hint: 'Used until enough runs exist to calibrate automatically.',
};

export const COMPLEXITY_PINNED_GROUP = {
  title: 'Fixed Thresholds (override calibration)',
  hint: 'Always used instead of the calibrated value. Leave empty to keep automatic calibration.',
};

export const COMPLEXITY_DEFAULT_FIELDS = COMPLEXITY_LEVELS.map(level => ({
  key: `usage_complexity_default_${level}`,
  level,
  title: levelTitle(level),
}));

export const COMPLEXITY_PINNED_FIELDS = COMPLEXITY_LEVELS.map(level => ({
  key: `usage_complexity_pinned_${level}`,
  level,
  title: levelTitle(level),
}));

// Mode select, the apply-defaults, dismissible and complexity toggles, plus every limit and threshold field
export const COST_BUDGETS_SETTINGS_COUNT =
  4 +
  DEFAULT_LIMIT_FIELDS.length +
  WARNING_THRESHOLD_FIELDS.length +
  COMPLEXITY_DEFAULT_FIELDS.length +
  COMPLEXITY_PINNED_FIELDS.length;
