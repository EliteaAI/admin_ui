const UUID_RE = /_([a-f0-9]{8})-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

// Pylon ids carry a UUID suffix per instance; the base name ("pylon_indexer") is what the instances share
export const pylonBaseName = pylonId => {
  if (!pylonId) return '';
  return pylonId.replace(UUID_RE, '');
};

export const buildPylonLabels = pylonIds => {
  const bases = {};
  for (const pid of pylonIds) {
    const base = pylonBaseName(pid);
    if (!bases[base]) bases[base] = [];
    bases[base].push(pid);
  }
  const labels = {};
  for (const [base, pids] of Object.entries(bases)) {
    if (pids.length === 1) {
      labels[pids[0]] = base;
    } else {
      for (const pid of pids) {
        const match = pid.match(UUID_RE);
        const short = match ? match[1] : '';
        labels[pid] = `${base} (${short})`;
      }
    }
  }
  return labels;
};

// A field with visible_when is shown only while every condition matches the current values
export const isFieldVisible = (field, values) => {
  if (!field.visible_when) return true;
  const conditions = Array.isArray(field.visible_when) ? field.visible_when : [field.visible_when];
  return conditions.every(({ field: condField, value: condValue }) => {
    const currentValue = values[condField];
    if (typeof currentValue === 'string' && typeof condValue === 'string') {
      return currentValue.toLowerCase() === condValue.toLowerCase();
    }
    return currentValue === condValue;
  });
};

// Check if a field renders a JSON editor (should expand to fill space)
export const isJsonEditor = field => {
  if (field.type === 'object' && !field.additionalProperties?.type) return true;
  if (
    field.type === 'array' &&
    field.items?.type !== 'string' &&
    !(field.items?.type === 'integer' && field.enum_source) &&
    !(field.items?.type === 'object' && field.items?.properties?.login)
  )
    return true;
  return false;
};
