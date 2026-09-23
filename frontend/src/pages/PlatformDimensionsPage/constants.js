// Evaluator types - single selection (only one can be active per dimension)
export const EVALUATORS = [
  { value: 'ai', label: 'AI' },
  { value: 'human', label: 'Human' },
  { value: 'code', label: 'Code' },
];

// Legacy constants kept for backward compatibility with existing dimensions
export const ENGINES = [
  { value: 'ai', label: 'AI' },
  { value: 'human', label: 'Human' },
];

// Scale type presets with automatic min/max configuration
export const SCALE_TYPE_PRESETS = [
  { value: 'score', label: 'Score (1-100)' },
  { value: 'rating', label: 'Rating (1-5)' },
  { value: 'pass_fail', label: 'Pass/Fail' },
  { value: 'custom', label: 'Custom' },
];

// Maps preset to actual scale_type, min, max for API
export const SCALE_TYPE_PRESET_CONFIG = {
  score: { scaleType: 'continuous', min: 1, max: 100 },
  rating: { scaleType: 'ordinal', min: 1, max: 5 },
  pass_fail: { scaleType: 'binary', min: 0, max: 1 },
  custom: { scaleType: 'continuous', min: null, max: null },
};

// Legacy scale types (for display and backward compatibility)
export const SCALE_TYPES = [
  { value: 'continuous', label: 'Continuous' },
  { value: 'ordinal', label: 'Ordinal' },
  { value: 'binary', label: 'Binary' },
];

export const POLARITIES = [
  { value: 'higher_better', label: 'Higher is better' },
  { value: 'lower_better', label: 'Lower is better' },
];

// Success criteria options (simplified from full TARGET_OPERATORS)
export const SUCCESS_CRITERIA_OPTIONS = [
  { value: '>=', label: 'At least (≥)' },
  { value: '<=', label: 'At most (≤)' },
  { value: '==', label: 'Exactly (=)' },
];

// Legacy target operators (kept for backward compatibility)
export const TARGET_OPERATORS = [
  { value: '>=', label: '≥' },
  { value: '>', label: '>' },
  { value: '<=', label: '≤' },
  { value: '<', label: '<' },
  { value: '==', label: '=' },
];

// Importance levels (replaces numeric default_weight)
export const IMPORTANCE_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const IMPORTANCE_WEIGHT_MAP = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

// Evaluation target options (evidence scope)
export const EVIDENCE_SCOPE_OPTIONS = [
  { key: 'output', label: 'Output' },
  { key: 'input', label: 'Input' },
  { key: 'structure', label: 'Agent Instructions' },
];

// Default evidence scope for new dimensions
export const DEFAULT_EVIDENCE_SCOPE = {
  output: true,
  input: false,
  structure: false,
};

// Label lookup helpers
export const SCALE_TYPE_LABELS = Object.fromEntries(SCALE_TYPES.map(option => [option.value, option.label]));

export const POLARITY_LABELS = Object.fromEntries(POLARITIES.map(option => [option.value, option.label]));

export const ENGINE_LABELS = Object.fromEntries(ENGINES.map(option => [option.value, option.label]));

export const EVALUATOR_LABELS = Object.fromEntries(EVALUATORS.map(option => [option.value, option.label]));

export const IMPORTANCE_LABELS = Object.fromEntries(
  IMPORTANCE_OPTIONS.map(option => [option.value, option.label]),
);
