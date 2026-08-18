// Code scoring is deliberately absent: it needs a project-local script, so it cannot be
// shared through the registry.
export const ENGINES = [
  { value: "ai", label: "AI" },
  { value: "human", label: "Human" },
];

export const SCALE_TYPES = [
  { value: "continuous", label: "Continuous" },
  { value: "ordinal", label: "Ordinal" },
  { value: "binary", label: "Binary" },
];

export const POLARITIES = [
  { value: "higher_better", label: "Higher is better" },
  { value: "lower_better", label: "Lower is better" },
];

export const TARGET_OPERATORS = [
  { value: ">=", label: "≥" },
  { value: ">", label: ">" },
  { value: "<=", label: "≤" },
  { value: "<", label: "<" },
  { value: "==", label: "=" },
];

export const SCALE_TYPE_LABELS = Object.fromEntries(
  SCALE_TYPES.map((option) => [option.value, option.label]),
);

export const POLARITY_LABELS = Object.fromEntries(
  POLARITIES.map((option) => [option.value, option.label]),
);

export const ENGINE_LABELS = Object.fromEntries(
  ENGINES.map((option) => [option.value, option.label]),
);
