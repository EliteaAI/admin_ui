import {
  ACTIONS,
  ACTION_ORDER,
  CHECK_STATES,
  OWNER_ONLY_HINT,
  SELF_APPROVAL_HINT,
  STORE_LABELS,
  VALUE_STATES,
} from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { isPersonal, referenceTitle } from '@/pages/GovernancePage/helpers/governance.helpers';

const MAX_SCHEMA_DEPTH = 4;

export const storeLabel = value => STORE_LABELS[value] ?? value;

const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);

const isPasswordSchema = schema =>
  schema.format === 'password' ||
  (Array.isArray(schema.anyOf) &&
    schema.anyOf.some(option => isObject(option) && option.format === 'password'));

// A map or an array of passwords: its keys are not known from the schema
const isSecretCollection = schema =>
  [schema, ...(Array.isArray(schema.anyOf) ? schema.anyOf : [])].some(
    option =>
      isObject(option) &&
      ['additionalProperties', 'items'].some(key => isObject(option[key]) && isPasswordSchema(option[key])),
  );

/**
 * The secret fields of a configuration type, from its schema: `[{ path, label }]`. This is the walk the backend does
 * to check a personal value (nested objects joined with `.`, a map or array of passwords as `<path>.*`), so the names
 * sent are the names it accepts.
 */
export const secretFields = (properties, prefix = '', depth = 0) =>
  Object.entries(isObject(properties) ? properties : {}).flatMap(([name, schema]) => {
    if (!isObject(schema)) return [];
    const path = `${prefix}${name}`;
    if (isPasswordSchema(schema)) return [{ path, label: schema.title ?? path }];
    if (isSecretCollection(schema)) return [{ path: `${path}.*`, label: schema.title ?? path }];
    if (isObject(schema.properties) && depth < MAX_SCHEMA_DEPTH) {
      return secretFields(schema.properties, `${path}.`, depth + 1);
    }
    return [];
  });

const firstSegment = path => path.split('.')[0];

/**
 * The secret fields grouped by the authentication method they belong to: `[{ name, fields }]`. The groups come from
 * `metadata.sections.*.subsections` of the type's schema (`[{ name, fields }]`), in their order, and list only the
 * secret fields. Fields no subsection names come last, as "Other" when there are groups, and a type without
 * subsections gives one group without a name.
 */
export const groupSecretFields = (fields, metadata) => {
  const sections = isObject(metadata?.sections) ? Object.values(metadata.sections) : [];
  const subsections = sections
    .flatMap(section => (Array.isArray(section?.subsections) ? section.subsections : []))
    .filter(subsection => isObject(subsection) && Array.isArray(subsection.fields));

  const placed = new Set();
  const groups = subsections
    .map(subsection => {
      const members = fields.filter(
        field =>
          !placed.has(field.path) &&
          (subsection.fields.includes(field.path) || subsection.fields.includes(firstSegment(field.path))),
      );
      members.forEach(field => placed.add(field.path));
      return { name: String(subsection.name ?? ''), fields: members };
    })
    .filter(group => group.fields.length > 0);

  const rest = fields.filter(field => !placed.has(field.path));
  if (groups.length === 0) return rest.length > 0 ? [{ name: null, fields: rest }] : [];
  return rest.length > 0 ? [...groups, { name: 'Other', fields: rest }] : groups;
};

// The metadata of a type (label, sections and their subsections), from the list of registered types
export const typeMetadata = (types, provider) =>
  (Array.isArray(types) ? types : []).find(entry => entry.type === provider)?.config_schema?.metadata;

// The schema of a type's data, from the list of registered types
export const typeProperties = (types, provider) =>
  (Array.isArray(types) ? types : []).find(entry => entry.type === provider)?.config_schema?.properties?.data
    ?.properties;

// Only the owner sets a personal value; the backend refuses anyone else (OWNER_ONLY)
const isNotOwner = (row, userId) => userId == null || row.owner?.id !== userId;

const isOwnApproval = (row, userId) =>
  userId != null && [row.created_by?.id, row.written_by?.id].some(id => id != null && id === userId);

const isAvailable = (action, row) => {
  switch (action) {
    case 'setValue':
      return isPersonal(row) && VALUE_STATES.includes(row.state);
    case 'import':
      return !isPersonal(row) && ['pending', 'validated'].includes(row.state);
    case 'probe':
      return (
        (row.state === 'pending' && row.generation >= 1) ||
        (isPersonal(row) && CHECK_STATES.includes(row.state) && row.generation >= 1)
      );
    case 'approve':
      return row.state === 'validated' && !row.approved_by;
    case 'activate':
      return row.state === 'validated' && Boolean(row.approved_by);
    case 'suspend':
      return row.state === 'active';
    case 'resume':
      return row.state === 'suspended';
    case 'retire':
      return ['pending', 'validated', 'active', 'suspended'].includes(row.state);
    default:
      return false;
  }
};

const permissionOf = (action, { canManage, canProbe, canApprove }) => {
  if (action === 'probe') return canProbe;
  if (action === 'approve') return canApprove;
  return canManage;
};

/**
 * The actions the menu offers for a row: those valid from its state that the operator may run. Each entry is
 * `{ action, label, disabled, hint }`; `hint` says why an entry is disabled. Setting a personal value is offered
 * disabled to everyone but the owner of the reference.
 */
export const getRowActions = (row, permissions) =>
  ACTION_ORDER.filter(action => isAvailable(action, row) && permissionOf(action, permissions)).map(action => {
    const ownApproval = action === 'approve' && isOwnApproval(row, permissions.userId);
    const notOwner = action === 'setValue' && isNotOwner(row, permissions.userId);
    return {
      action,
      label: action === 'import' && row.generation >= 1 ? 'Import again' : ACTIONS[action].label,
      disabled: ownApproval || notOwner,
      hint: (ownApproval && SELF_APPROVAL_HINT) || (notOwner && OWNER_ONLY_HINT) || undefined,
    };
  });

export const buildListParams = ({
  projectId,
  state,
  ownershipClass,
  storeKind,
  owner,
  search,
  page,
  pageSize,
  sort,
}) => ({
  projectId,
  limit: pageSize,
  offset: page * pageSize,
  state: state || undefined,
  ownership_class: ownershipClass || undefined,
  store_kind: storeKind || undefined,
  owner_user_id: owner?.id,
  search: search || undefined,
  sort_by: sort.field,
  sort_order: sort.direction,
});

export const successMessage = (row, action) => `${referenceTitle(row)} ${ACTIONS[action].success}.`;
