import {
  COMPLEXITY_DEFAULT_FIELDS,
  COMPLEXITY_DEFAULT_THRESHOLDS,
  COMPLEXITY_PINNED_FIELDS,
  COMPLEXITY_THRESHOLD_MAX,
  COMPLEXITY_THRESHOLD_MIN,
} from '@/pages/FeaturesPage/components/CostBudgetsSection/constants/costBudgets.constants';

const isEmpty = value => value === '' || value === null || value === undefined;

const rangeError = value => {
  if (!Number.isFinite(Number(value))) return 'Must be a number';
  if (Number(value) < COMPLEXITY_THRESHOLD_MIN || Number(value) > COMPLEXITY_THRESHOLD_MAX)
    return `Must be between ${COMPLEXITY_THRESHOLD_MIN} and ${COMPLEXITY_THRESHOLD_MAX}`;
  return '';
};

// Each level must sit above the previous one, otherwise labels overlap
const orderErrors = (fields, numbers) => {
  const errors = {};
  let prev = null;
  fields.forEach(field => {
    const cur = numbers[field.key];
    if (cur === null) return;
    if (prev && cur <= prev.value) errors[field.key] = `Must be greater than ${prev.level}`;
    prev = { value: cur, level: field.level };
  });
  return errors;
};

export const defaultThresholdValue = (values, field) =>
  values?.[field.key] ?? COMPLEXITY_DEFAULT_THRESHOLDS[field.level];

export const complexityThresholdErrors = values => {
  const errors = {};
  const defaults = {};
  const pinned = {};

  COMPLEXITY_DEFAULT_FIELDS.forEach(field => {
    const value = defaultThresholdValue(values, field);
    errors[field.key] = isEmpty(value) ? 'Required' : rangeError(value);
    defaults[field.key] = errors[field.key] ? null : Number(value);
  });

  COMPLEXITY_PINNED_FIELDS.forEach(field => {
    const value = values?.[field.key];
    errors[field.key] = isEmpty(value) ? '' : rangeError(value);
    pinned[field.key] = isEmpty(value) || errors[field.key] ? null : Number(value);
  });

  // Range errors win over order errors on the same field
  const ordered = {
    ...orderErrors(COMPLEXITY_DEFAULT_FIELDS, defaults),
    ...orderErrors(COMPLEXITY_PINNED_FIELDS, pinned),
  };
  Object.entries(ordered).forEach(([key, msg]) => {
    if (!errors[key]) errors[key] = msg;
  });

  return errors;
};
