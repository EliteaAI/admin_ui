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
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useAgentIdentityCreateMutation, useGovernanceAgentListQuery } from '@/api/governance.api';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import {
  DEFAULT_MODE,
  MODE_OPTIONS,
  RUNTIME_DOMAIN_MODE,
} from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';
import { modeLabel } from '@/pages/GovernancePage/components/IdentitiesTab/helpers/identities.helpers';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

const AGENT_LIMIT = 20;
const RUNTIME_DOMAIN_HINT =
  'Runtime domain bindings are switched off in the governance settings (Overview), so such an identity could not be activated.';

const isSameOption = (option, value) => option.id === value.id;
const showAllOptions = options => options;
const getName = option => option.name;

/**
 * Creates an agent identity in draft: pick an agent, one of its versions and the identity mode.
 * A mode that the chosen version already has an identity for is disabled, because the backend allows one per mode.
 * `runtimeDomainAllowed` is false only when the effective governance setting is known to forbid that mode.
 */
const CreateIdentityDialog = memo(props => {
  const { open, projectId, runtimeDomainAllowed = true, onClose, onCreated } = props;

  const styles = createIdentityDialogStyles();

  const [agent, setAgent] = useState(null);
  const [agentInput, setAgentInput] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [versionId, setVersionId] = useState('');
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounceValue(agentSearch, 300);

  const { data, isFetching } = useGovernanceAgentListQuery(
    { projectId, limit: AGENT_LIMIT, search: debouncedSearch },
    { skip: !open || !projectId, refetchOnMountOrArgChange: true },
  );

  const [createIdentity, { isLoading }] = useAgentIdentityCreateMutation();

  const options = useMemo(() => {
    const rows = data?.rows ?? [];
    // The agent in the field is read from the list again, so its versions show the identities they have now
    return agent && !rows.some(row => row.id === agent.id) ? [agent, ...rows] : rows;
  }, [data?.rows, agent]);

  const selectedAgent = useMemo(
    () => options.find(option => option.id === agent?.id) ?? null,
    [options, agent?.id],
  );

  const versions = useMemo(() => selectedAgent?.versions ?? [], [selectedAgent]);
  const selectedVersion = versions.find(version => version.id === versionId) ?? null;

  const takenModes = useMemo(
    () => new Set((selectedVersion?.bindings ?? []).map(binding => binding.identity_mode)),
    [selectedVersion],
  );

  const reset = useCallback(() => {
    setAgent(null);
    setAgentInput('');
    setAgentSearch('');
    setVersionId('');
    setMode(DEFAULT_MODE);
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleAgentChange = useCallback((_, next) => {
    setAgent(next);
    setVersionId('');
    setError(null);
  }, []);

  const handleAgentInputChange = useCallback((_, next, reason) => {
    setAgentInput(next);
    setAgentSearch(reason === 'input' ? next : '');
  }, []);

  const handleVersionChange = useCallback(event => {
    setVersionId(event.target.value);
    setError(null);
  }, []);

  const handleModeChange = useCallback(event => {
    setMode(event.target.value);
    setError(null);
  }, []);

  const modeTaken = takenModes.has(mode);
  const canSubmit = Boolean(selectedAgent && selectedVersion) && !modeTaken && !isLoading;

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      const result = await createIdentity({
        projectId,
        application_id: selectedAgent.id,
        version_id: selectedVersion.id,
        identity_mode: mode,
      }).unwrap();
      const created = { agentName: selectedAgent.name, versionName: selectedVersion.name, id: result.id };
      reset();
      onCreated(created);
    } catch (err) {
      setError(toGovernanceError(err, 'Failed to create the identity.'));
    }
  }, [createIdentity, projectId, selectedAgent, selectedVersion, mode, reset, onCreated]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="identity-create-dialog"
    >
      <DialogTitle>Create agent identity</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            The identity starts as a draft. Submit it for approval, then another operator activates it.
          </Typography>
          <Autocomplete
            size="small"
            value={selectedAgent}
            onChange={handleAgentChange}
            inputValue={agentInput}
            onInputChange={handleAgentInputChange}
            options={options}
            loading={isFetching}
            filterOptions={showAllOptions}
            getOptionLabel={getName}
            isOptionEqualToValue={isSameOption}
            noOptionsText="No agents found"
            renderInput={params => (
              <TextField
                {...params}
                label="Agent"
                inputProps={{ ...params.inputProps, 'data-testid': 'identity-create-agent' }}
              />
            )}
          />
          <FormControl
            size="small"
            disabled={!selectedAgent}
          >
            <InputLabel id="identity-create-version-label">Version</InputLabel>
            <Select
              labelId="identity-create-version-label"
              label="Version"
              value={versionId}
              onChange={handleVersionChange}
              SelectDisplayProps={{ 'data-testid': 'identity-create-version' }}
            >
              {versions.map(version => (
                <MenuItem
                  key={version.id}
                  value={version.id}
                  data-testid={`identity-create-version-${version.id}`}
                >
                  {version.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            size="small"
            disabled={!selectedVersion}
            error={modeTaken}
          >
            <InputLabel id="identity-create-mode-label">Identity mode</InputLabel>
            <Select
              labelId="identity-create-mode-label"
              label="Identity mode"
              value={mode}
              onChange={handleModeChange}
              SelectDisplayProps={{ 'data-testid': 'identity-create-mode' }}
            >
              {MODE_OPTIONS.map(option => {
                const runtimeBlocked = option === RUNTIME_DOMAIN_MODE && !runtimeDomainAllowed;
                const taken = takenModes.has(option);
                return (
                  <MenuItem
                    key={option}
                    value={option}
                    disabled={runtimeBlocked}
                    data-testid={`identity-create-mode-${option}`}
                  >
                    {runtimeBlocked ? (
                      <Tooltip
                        title={RUNTIME_DOMAIN_HINT}
                        placement="left"
                      >
                        <Box component="span">{modeLabel(option)}</Box>
                      </Tooltip>
                    ) : (
                      modeLabel(option)
                    )}
                    {taken ? ' (already has an identity)' : ''}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>
          {modeTaken && (
            <Typography
              variant="bodySmall"
              color="error"
              data-testid="identity-create-taken"
            >
              This version already has an identity in this mode. Choose another mode or version.
            </Typography>
          )}
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
          data-testid="identity-create-submit"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateIdentityDialog.displayName = 'CreateIdentityDialog';

/** @type {MuiSx} */
const createIdentityDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default CreateIdentityDialog;
