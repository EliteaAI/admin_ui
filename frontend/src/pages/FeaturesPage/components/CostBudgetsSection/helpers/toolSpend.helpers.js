// Groups Tool Spend (field.feature) and Tool Pricing (field.backend) fields into one block per feature
export const groupToolSpendFields = ({ spendFields = [], pricingFields = [], features = [], spendValues = {} }) => {
  const groups = new Map();
  const ensure = (id, label) => {
    if (!groups.has(id)) groups.set(id, { id, label, spend: [], pricing: [] });
    return groups.get(id);
  };

  (features || []).forEach(item => ensure(item.feature, item.label || item.feature));

  spendFields.forEach(field => {
    if (!isVisible(field, spendValues)) return;
    ensure(field.feature || 'other', field.feature || 'Other').spend.push(field);
  });

  const backendFeature = new Map();
  (features || []).forEach(item => (item.backends || []).forEach(backend => backendFeature.set(backend, item.feature)));

  // A backend not used by any loaded feature still gets its price shown, in its own block
  pricingFields.forEach(field => {
    const feature = backendFeature.get(field.backend);
    const group = feature ? ensure(feature) : ensure(`backend:${field.backend || 'other'}`, `Backend: ${field.backend}`);
    group.pricing.push(field);
  });

  return [...groups.values()]
    .filter(group => group.spend.length || group.pricing.length)
    .map(group => ({
      ...group,
      spend: group.spend.map(field => withoutPrefix(field, group.label)),
      pricing: group.pricing.map(field => withoutPrefix(field, group.label)),
    }));
};

// "Web search: enabled" reads as "Enabled" under the Web search heading
const withoutPrefix = (field, label) => {
  const prefix = `${label}: `;
  if (!label || !field.title?.toLowerCase().startsWith(prefix.toLowerCase())) return field;
  const rest = field.title.slice(prefix.length);
  return { ...field, title: rest.charAt(0).toUpperCase() + rest.slice(1) };
};

const isVisible = (field, values) => {
  if (!field.visible_when) return true;
  const conditions = Array.isArray(field.visible_when) ? field.visible_when : [field.visible_when];
  return conditions.every(({ field: key, value }) => values?.[key] === value);
};

// Mirrors the field's value_schema, so Save is blocked instead of the backend rejecting it
export const toolSpendFieldError = (field, value) => {
  if (field.type !== 'number' && field.type !== 'integer') return '';
  if (value === null || value === undefined) {
    const nullable = Array.isArray(field.value_schema?.type) && field.value_schema.type.includes('null');
    return nullable ? '' : 'Required';
  }
  const number = Number(value);
  if (Number.isNaN(number)) return 'Must be a number';
  if (field.type === 'integer' && !Number.isInteger(number)) return 'Must be a whole number';
  const schema = field.value_schema || {};
  const minimum = schema.minimum ?? field.minimum;
  const maximum = schema.maximum ?? field.maximum;
  if (minimum !== undefined && number < minimum) return `Must be at least ${minimum}`;
  if (maximum !== undefined && number > maximum) return `Must be at most ${maximum}`;
  if (schema.exclusiveMinimum !== undefined && number <= schema.exclusiveMinimum) {
    return `Must be greater than ${schema.exclusiveMinimum}`;
  }
  return '';
};
