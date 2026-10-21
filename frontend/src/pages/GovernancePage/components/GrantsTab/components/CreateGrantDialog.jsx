import { memo, useCallback, useMemo, useState } from 'react';

import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import {
  useAgentIdentityGetQuery,
  useAgentIdentityListQuery,
  useCredentialGrantCreateMutation,
  useCredentialReferenceListQuery,
} from '@/api/governance.api';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import {
  parseValidUntil,
  toolkitTitle,
} from '@/pages/GovernancePage/components/GrantsTab/helpers/grants.helpers';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';
import {
  classLabel,
  isPersonal,
  referenceTitle,
  toGovernanceError,
} from '@/pages/GovernancePage/helpers/governance.helpers';

const BINDING_LIMIT = 50;
const REFERENCE_LIMIT = 100;
// A grant can be made for an identity that is in use or waiting for approval
const GRANTABLE_BINDING_STATES = ['active', 'pending_approval'];

const isSameOption = (option, value) => option.id === value.id;
const showAllOptions = options => options;
const getBindingLabel = option =>
  `${option.application?.name ?? 'Agent'} ${option.version?.name ?? ''}`.trim();

/**
 * Creates a grant: which toolkit of which agent identity may use which credential, for which user, and optionally
 * until when. A personal credential can be granted to its owner only, so choosing one fills in the owner.
 * The grant starts pending approval. `onCreated({ title })`.
 */
const CreateGrantDialog = memo(props => {
  const { open, projectId, onClose, onCreated } = props;

  const styles = createGrantDialogStyles();

  const [binding, setBinding] = useState(null);
  const [bindingInput, setBindingInput] = useState('');
  const [bindingSearch, setBindingSearch] = useState('');
  const [toolkitId, setToolkitId] = useState('');
  const [credentialId, setCredentialId] = useState('');
  const [subject, setSubject] = useState(null);
  const [validUntil, setValidUntil] = useState('');
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounceValue(bindingSearch, 300);

  const { data: bindingData, isFetching: bindingsFetching } = useAgentIdentityListQuery(
    { projectId, limit: BINDING_LIMIT, search: debouncedSearch },
    { skip: !open || !projectId, refetchOnMountOrArgChange: true },
  );

  const { currentData: bindingDetail } = useAgentIdentityGetQuery(
    { projectId, bindingId: binding?.id },
    { skip: !open || !binding },
  );

  const { data: referenceData } = useCredentialReferenceListQuery(
    { projectId, limit: REFERENCE_LIMIT },
    { skip: !open || !projectId || !toolkitId, refetchOnMountOrArgChange: true },
  );

  const [createGrant, { isLoading }] = useCredentialGrantCreateMutation();

  const bindingOptions = useMemo(() => {
    const rows = (bindingData?.rows ?? []).filter(row => GRANTABLE_BINDING_STATES.includes(row.state));
    return binding && !rows.some(row => row.id === binding.id) ? [binding, ...rows] : rows;
  }, [bindingData?.rows, binding]);

  const toolkits = useMemo(() => bindingDetail?.digest_inputs?.tools ?? [], [bindingDetail]);
  const toolkit = toolkits.find(item => String(item.id) === String(toolkitId)) ?? null;

  // The credentials of the toolkit's configuration, or all of the project's when the toolkit names none
  const credentials = useMemo(() => {
    if (!toolkit) return [];
    return (referenceData?.rows ?? []).filter(
      row =>
        row.state !== 'retired' &&
        (!toolkit.credential_configuration_uuid ||
          row.configuration?.uuid === toolkit.credential_configuration_uuid),
    );
  }, [referenceData?.rows, toolkit]);
  const credential = credentials.find(item => item.id === credentialId) ?? null;

  const credentialIsPersonal = credential ? isPersonal(credential) : false;

  const validity = parseValidUntil(validUntil);
  const canSubmit = Boolean(binding && toolkit && credential && subject) && !validity.problem && !isLoading;

  const reset = useCallback(() => {
    setBinding(null);
    setBindingInput('');
    setBindingSearch('');
    setToolkitId('');
    setCredentialId('');
    setSubject(null);
    setValidUntil('');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleBindingChange = useCallback((_, next) => {
    setBinding(next);
    setToolkitId('');
    setCredentialId('');
    setSubject(null);
    setError(null);
  }, []);

  const handleBindingInputChange = useCallback((_, next, reason) => {
    setBindingInput(next);
    setBindingSearch(reason === 'input' ? next : '');
  }, []);

  const handleToolkitChange = useCallback(event => {
    setToolkitId(event.target.value);
    setCredentialId('');
    setError(null);
  }, []);

  const handleCredentialChange = useCallback(
    event => {
      const next = credentials.find(item => item.id === event.target.value) ?? null;
      setCredentialId(event.target.value);
      // A personal credential belongs to one user, who is the only one it can be granted to
      if (next && isPersonal(next)) setSubject(next.owner ?? null);
      setError(null);
    },
    [credentials],
  );

  const handleValidUntilChange = useCallback(event => setValidUntil(event.target.value), []);

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      await createGrant({
        projectId,
        agent_binding_ref: binding.id,
        toolkit_id: Number(toolkit.id),
        credential_ref: credential.id,
        subject_user_id: subject.id,
        ...(validity.value && { valid_until: validity.value }),
      }).unwrap();
      const created = { title: `${getBindingLabel(binding)} · ${toolkitTitle(toolkit)}` };
      reset();
      onCreated(created);
    } catch (err) {
      setError(toGovernanceError(err, 'Failed to create the grant.'));
    }
  }, [createGrant, projectId, binding, toolkit, credential, subject, validity.value, reset, onCreated]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="grant-create-dialog"
    >
      <DialogTitle>Create grant</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            The grant starts pending approval. Another operator approves it before the agent can use the
            credential.
          </Typography>
          <Autocomplete
            size="small"
            value={binding}
            onChange={handleBindingChange}
            inputValue={bindingInput}
            onInputChange={handleBindingInputChange}
            options={bindingOptions}
            loading={bindingsFetching}
            filterOptions={showAllOptions}
            getOptionLabel={getBindingLabel}
            isOptionEqualToValue={isSameOption}
            noOptionsText="No active or pending agent identities found"
            renderInput={params => (
              <TextField
                {...params}
                label="Agent identity"
                required
                inputProps={{ ...params.inputProps, 'data-testid': 'grant-create-binding' }}
              />
            )}
          />
          <FormControl
            size="small"
            disabled={!binding}
          >
            <InputLabel id="grant-create-toolkit-label">Toolkit</InputLabel>
            <Select
              labelId="grant-create-toolkit-label"
              label="Toolkit"
              value={toolkitId}
              onChange={handleToolkitChange}
              SelectDisplayProps={{ 'data-testid': 'grant-create-toolkit' }}
            >
              {toolkits.map(item => (
                <MenuItem
                  key={item.id}
                  value={String(item.id)}
                  data-testid={`grant-create-toolkit-${item.id}`}
                >
                  {[toolkitTitle(item), item.type].filter(Boolean).join(' · ')}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            disabled={!toolkit}
          >
            <InputLabel id="grant-create-credential-label">Credential</InputLabel>
            <Select
              labelId="grant-create-credential-label"
              label="Credential"
              value={credentialId}
              onChange={handleCredentialChange}
              SelectDisplayProps={{ 'data-testid': 'grant-create-credential' }}
            >
              {credentials.map(item => (
                <MenuItem
                  key={item.id}
                  value={item.id}
                  data-testid={`grant-create-credential-${item.id}`}
                >
                  {referenceTitle(item)} · {classLabel(item.ownership_class)}
                  {isPersonal(item) && item.owner?.email ? ` (${item.owner.email})` : ''}
                </MenuItem>
              ))}
            </Select>
            {toolkit && credentials.length === 0 && (
              <FormHelperText data-testid="grant-create-no-credentials">
                No credential is registered for this toolkit’s configuration.
              </FormHelperText>
            )}
          </FormControl>
          <ProjectUserPicker
            projectId={projectId}
            value={subject}
            onChange={setSubject}
            label="User"
            required
            disabled={credentialIsPersonal}
            helperText={
              credentialIsPersonal ? 'A personal credential can be granted only to its owner.' : undefined
            }
            testId="grant-create-user"
            sx={styles.user}
          />
          <TextField
            size="small"
            type="datetime-local"
            label="Valid until (optional)"
            value={validUntil}
            onChange={handleValidUntilChange}
            error={Boolean(validity.problem)}
            helperText={validity.problem ?? 'Leave empty for no end date. At most 365 days ahead.'}
            InputLabelProps={{ shrink: true }}
            inputProps={{ 'data-testid': 'grant-create-valid-until' }}
          />
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
          onClick={handleCreate}
          disabled={!canSubmit}
          data-testid="grant-create-submit"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateGrantDialog.displayName = 'CreateGrantDialog';

/** @type {MuiSx} */
const createGrantDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  user: {
    width: '100%',
  },
});

export default CreateGrantDialog;
