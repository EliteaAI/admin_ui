import { memo, useCallback, useMemo, useRef, useState } from 'react';

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Skeleton,
  TextField,
  Typography,
} from '@mui/material';

import { useConfigurationTypeListQuery, useCredentialMaterialPutMutation } from '@/api/governance.api';
import {
  groupSecretFields,
  secretFields,
  typeMetadata,
  typeProperties,
} from '@/pages/GovernancePage/components/CredentialsTab/helpers/credentials.helpers';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import { STALE_CODES } from '@/pages/GovernancePage/constants/governance.constants';
import {
  personName,
  referenceTitle,
  toGovernanceError,
} from '@/pages/GovernancePage/helpers/governance.helpers';

import MaterialEntriesField from './MaterialEntriesField';
import PersonalCredentialNotice from './PersonalCredentialNotice';

const WILDCARD = '.*';

const isWildcard = field => field.path.endsWith(WILDCARD);

/**
 * Sets the value of a personal credential. Write-only: the fields are password inputs, the value is sent once and
 * never shown again, and everything typed is cleared when the dialog closes or the value is sent. The names of the
 * fields come from the schema of the configuration type (a map of passwords asks for the names of its entries too).
 * The fields are alternatives (a token, or a password, or a key): none is required, the filled ones are sent, and the
 * schema's subsections, when it has them, group the fields by authentication method.
 * The write is sent with the generation the operator saw (`expected_generation`).
 * `onDone({ outcome: 'done' | 'stale', row, generation })`.
 */
const SetPersonalValueDialog = memo(props => {
  const { open, row, projectId, onClose, onDone } = props;

  const styles = setPersonalValueDialogStyles();

  const [values, setValues] = useState({});
  const [entries, setEntries] = useState({});
  const [error, setError] = useState(null);
  const nextId = useRef(0);

  const {
    data: types,
    isLoading: typesLoading,
    error: typesError,
  } = useConfigurationTypeListQuery({ section: 'credentials' }, { skip: !open });

  const [putMaterial, { isLoading, reset: resetMutation }] = useCredentialMaterialPutMutation();

  const fields = useMemo(() => (row ? secretFields(typeProperties(types, row.provider)) : []), [types, row]);
  const groups = useMemo(
    () => groupSecretFields(fields, typeMetadata(types, row?.provider)),
    [fields, types, row?.provider],
  );
  const plainFields = useMemo(() => fields.filter(field => !isWildcard(field)), [fields]);
  const wildcardFields = useMemo(() => fields.filter(isWildcard), [fields]);

  // An entry of a map is sent when it has a name and a value; one with only half of that, or a repeated name, blocks
  const entriesState = wildcardFields.map(field => {
    const list = entries[field.path] ?? [];
    const complete = list.filter(entry => entry.key.trim() && entry.value);
    const half = list.some(entry => Boolean(entry.key.trim()) !== Boolean(entry.value));
    const keys = complete.map(entry => entry.key.trim());
    return { field, complete, valid: !half && new Set(keys).size === keys.length };
  });
  const filledPlain = plainFields.filter(field => values[field.path]);
  const filledCount = filledPlain.length + entriesState.reduce((sum, item) => sum + item.complete.length, 0);
  const canSubmit =
    fields.length > 0 && filledCount > 0 && entriesState.every(item => item.valid) && !isLoading;

  // Nothing typed outlives the dialog
  const clear = useCallback(() => {
    setValues({});
    setEntries({});
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    clear();
    onClose();
  }, [isLoading, clear, onClose]);

  const handleValueChange = useCallback(
    path => event => {
      const { value } = event.target;
      setValues(prev => ({ ...prev, [path]: value }));
    },
    [],
  );

  const handleAddEntry = useCallback(
    path => () => {
      nextId.current += 1;
      const entry = { id: nextId.current, key: '', value: '' };
      setEntries(prev => ({ ...prev, [path]: [...(prev[path] ?? []), entry] }));
    },
    [],
  );

  const handleEntryChange = useCallback(
    path => (id, change) =>
      setEntries(prev => ({
        ...prev,
        [path]: (prev[path] ?? []).map(entry => (entry.id === id ? { ...entry, ...change } : entry)),
      })),
    [],
  );

  const handleEntryRemove = useCallback(
    path => id =>
      setEntries(prev => ({ ...prev, [path]: (prev[path] ?? []).filter(entry => entry.id !== id) })),
    [],
  );

  const handleSubmit = useCallback(async () => {
    setError(null);
    const body = {};
    // Only what the operator filled in: the other fields belong to other authentication methods
    filledPlain.forEach(field => {
      body[field.path] = values[field.path];
    });
    entriesState.forEach(({ field, complete }) => {
      const prefix = field.path.slice(0, -WILDCARD.length);
      complete.forEach(entry => {
        body[`${prefix}.${entry.key.trim()}`] = entry.value;
      });
    });
    try {
      const result = await putMaterial({
        projectId,
        referenceId: row.id,
        fields: body,
        expected_generation: row.generation,
      }).unwrap();
      clear();
      onDone({ outcome: 'done', row, generation: result?.generation });
    } catch (err) {
      const refusal = toGovernanceError(err, 'Failed to store the value.');
      if (STALE_CODES.includes(refusal.code)) {
        clear();
        onDone({ outcome: 'stale', row });
      } else {
        setError(refusal);
      }
    } finally {
      // The mutation state keeps the arguments of the call; drop them with the value
      resetMutation();
    }
  }, [filledPlain, entriesState, values, putMaterial, projectId, row, clear, onDone, resetMutation]);

  if (!row) return null;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="credential-value-dialog"
    >
      <DialogTitle>Set personal value: {referenceTitle(row)}</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <GovernanceErrorAlert
            error={
              typesError
                ? toGovernanceError(typesError, 'Failed to read the fields of this credential.')
                : null
            }
          />
          <Typography variant="bodyMedium">
            For {personName(row.owner) ?? 'the owner'} · generation {row.generation ?? 0} →{' '}
            {(row.generation ?? 0) + 1}. The value is write-only: it is never shown again, not even to you.
            The reference goes back to pending, and another operator has to approve the new value.
          </Typography>
          <PersonalCredentialNotice />
          {typesLoading && (
            <Skeleton
              variant="rectangular"
              height="3rem"
            />
          )}
          {!typesLoading && !typesError && fields.length === 0 && (
            <Typography
              variant="bodySmall"
              color="error"
              data-testid="credential-value-no-fields"
            >
              The secret fields of this credential type could not be read, so no value can be set.
            </Typography>
          )}
          {fields.length > 0 && (
            <Typography
              variant="bodySmall"
              sx={styles.muted}
              data-testid="credential-value-hint"
            >
              Fill in the field(s) your authentication method uses; the others stay empty.
            </Typography>
          )}
          {groups.map(group => (
            <Box
              key={group.name ?? 'fields'}
              sx={styles.group}
              data-testid="credential-value-group"
            >
              {group.name && (
                <Typography
                  variant="labelSmall"
                  sx={styles.muted}
                  data-testid="credential-value-caption"
                >
                  {group.name}
                </Typography>
              )}
              {group.fields.map(field =>
                isWildcard(field) ? (
                  <MaterialEntriesField
                    key={field.path}
                    label={field.label}
                    entries={entries[field.path] ?? []}
                    onAdd={handleAddEntry(field.path)}
                    onChange={handleEntryChange(field.path)}
                    onRemove={handleEntryRemove(field.path)}
                    testId={`credential-value-${field.path}`}
                  />
                ) : (
                  <TextField
                    key={field.path}
                    type="password"
                    autoComplete="new-password"
                    size="small"
                    label={field.label}
                    value={values[field.path] ?? ''}
                    onChange={handleValueChange(field.path)}
                    helperText={field.label === field.path ? undefined : field.path}
                    inputProps={{ 'data-testid': `credential-value-${field.path}` }}
                  />
                ),
              )}
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit}
          data-testid="credential-value-submit"
        >
          Store value
        </Button>
      </DialogActions>
    </Dialog>
  );
});

SetPersonalValueDialog.displayName = 'SetPersonalValueDialog';

/** @type {MuiSx} */
const setPersonalValueDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  group: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default SetPersonalValueDialog;
