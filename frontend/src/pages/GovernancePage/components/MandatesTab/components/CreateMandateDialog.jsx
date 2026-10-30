import { memo, useCallback, useMemo, useState } from 'react';

import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material';

import {
  useGovernanceAgentListQuery,
  useGovernanceToolkitListQuery,
  useMandateCreateMutation,
} from '@/api/governance.api';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import {
  COVERS_AGENT,
  COVERS_TOOLKIT,
  DEFAULT_RUNTIME_MINUTES,
  DEFAULT_VALID_DAYS,
  INDEX_OPERATION,
  MAX_VALID_DAYS,
  OPERATION_OPTIONS,
} from '@/pages/GovernancePage/components/MandatesTab/constants/mandates.constants';
import {
  dayFromNow,
  identityLabel,
  validUntilOf,
} from '@/pages/GovernancePage/components/MandatesTab/helpers/mandates.helpers';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';
import { toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

const AGENT_LIMIT = 20;
const NO_IDENTITY = '';

const isSameOption = (option, value) => option.id === value.id;
const showAllOptions = options => options;
const getName = option => option.name;
const hasActiveIdentity = version => (version.bindings ?? []).some(binding => binding.state === 'active');

/**
 * Creates a mandate in draft: the agent version (it needs an active identity) or the toolkit whose index schedules it
 * covers (#7305), its owner, which runs it covers, how long a run may take, until when, and — when the platform allows
 * it — the identity its runs act with. `identitySources` are the identities the deployment allows (from the list).
 */
const CreateMandateDialog = memo(props => {
  const { open, projectId, identitySources = [], onClose, onCreated } = props;

  const styles = createMandateDialogStyles();

  const [covers, setCovers] = useState(COVERS_AGENT);
  const [toolkit, setToolkit] = useState(null);
  const [toolkitInput, setToolkitInput] = useState('');
  const [toolkitSearch, setToolkitSearch] = useState('');
  const [agent, setAgent] = useState(null);
  const [agentInput, setAgentInput] = useState('');
  const [agentSearch, setAgentSearch] = useState('');
  const [versionId, setVersionId] = useState('');
  const [owner, setOwner] = useState(null);
  const [operations, setOperations] = useState(['run:schedule']);
  const [minutes, setMinutes] = useState(String(DEFAULT_RUNTIME_MINUTES));
  const [validDay, setValidDay] = useState(() => dayFromNow(DEFAULT_VALID_DAYS));
  const [identity, setIdentity] = useState(NO_IDENTITY);
  const [error, setError] = useState(null);

  const forToolkit = covers === COVERS_TOOLKIT;
  const debouncedSearch = useDebounceValue(agentSearch, 300);
  const { data, isFetching } = useGovernanceAgentListQuery(
    { projectId, limit: AGENT_LIMIT, search: debouncedSearch },
    { skip: !open || !projectId || forToolkit, refetchOnMountOrArgChange: true },
  );
  const debouncedToolkitSearch = useDebounceValue(toolkitSearch, 300);
  const { data: toolkitData, isFetching: toolkitsFetching } = useGovernanceToolkitListQuery(
    { projectId, limit: AGENT_LIMIT, search: debouncedToolkitSearch },
    { skip: !open || !projectId || !forToolkit, refetchOnMountOrArgChange: true },
  );
  const [createMandate, { isLoading }] = useMandateCreateMutation();

  const options = useMemo(() => {
    const rows = data?.rows ?? [];
    return agent && !rows.some(row => row.id === agent.id) ? [agent, ...rows] : rows;
  }, [data?.rows, agent]);

  const selectedAgent = useMemo(
    () => options.find(option => option.id === agent?.id) ?? null,
    [options, agent?.id],
  );
  const toolkitOptions = useMemo(() => {
    const rows = toolkitData?.rows ?? [];
    return toolkit && !rows.some(row => row.id === toolkit.id) ? [toolkit, ...rows] : rows;
  }, [toolkitData?.rows, toolkit]);
  const versions = useMemo(() => selectedAgent?.versions ?? [], [selectedAgent]);
  const selectedVersion = versions.find(version => version.id === versionId) ?? null;

  const runtime = Number(minutes) * 60;
  const runtimeValid = Number.isInteger(runtime) && runtime >= 60 && runtime <= 86400;
  const covered = forToolkit
    ? Boolean(toolkit)
    : Boolean(selectedVersion && hasActiveIdentity(selectedVersion));
  const canSubmit =
    Boolean(covered && owner && (forToolkit || operations.length) && validDay) && runtimeValid && !isLoading;

  const reset = useCallback(() => {
    setCovers(COVERS_AGENT);
    setToolkit(null);
    setToolkitInput('');
    setToolkitSearch('');
    setAgent(null);
    setAgentInput('');
    setAgentSearch('');
    setVersionId('');
    setOwner(null);
    setOperations(['run:schedule']);
    setMinutes(String(DEFAULT_RUNTIME_MINUTES));
    setValidDay(dayFromNow(DEFAULT_VALID_DAYS));
    setIdentity(NO_IDENTITY);
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
  }, []);
  const handleAgentInputChange = useCallback((_, next, reason) => {
    setAgentInput(next);
    setAgentSearch(reason === 'input' ? next : '');
  }, []);
  const handleVersionChange = useCallback(event => setVersionId(event.target.value), []);
  const handleCoversChange = useCallback(event => setCovers(event.target.value), []);
  const handleToolkitChange = useCallback((_, next) => setToolkit(next), []);
  const handleToolkitInputChange = useCallback((_, next, reason) => {
    setToolkitInput(next);
    setToolkitSearch(reason === 'input' ? next : '');
  }, []);
  const handleOperationToggle = useCallback(
    value => event =>
      setOperations(current =>
        event.target.checked ? [...new Set([...current, value])] : current.filter(item => item !== value),
      ),
    [],
  );
  const handleMinutesChange = useCallback(event => setMinutes(event.target.value), []);
  const handleValidDayChange = useCallback(event => setValidDay(event.target.value), []);
  const handleIdentityChange = useCallback(event => setIdentity(event.target.value), []);

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      const result = await createMandate({
        projectId,
        ...(forToolkit
          ? { toolkit_id: toolkit.id, operations: [INDEX_OPERATION.value] }
          : { version_id: selectedVersion.id, operations }),
        owner_user_id: owner.id,
        max_runtime_s: runtime,
        valid_until: validUntilOf(validDay),
        ...(identity !== NO_IDENTITY && { identity }),
      }).unwrap();
      const title = forToolkit
        ? `Toolkit: ${toolkit.name}`
        : `${selectedAgent.name} ${selectedVersion.name}`.trim();
      const created = { title, id: result.id };
      reset();
      onCreated(created);
    } catch (err) {
      setError(toGovernanceError(err, 'Failed to create the mandate.'));
    }
  }, [
    createMandate,
    projectId,
    forToolkit,
    toolkit,
    selectedAgent,
    selectedVersion,
    owner,
    operations,
    runtime,
    validDay,
    identity,
    reset,
    onCreated,
  ]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="mandate-create-dialog"
    >
      <DialogTitle>Create mandate</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          <GovernanceErrorAlert error={error} />
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            The mandate starts as a draft. Submit it, then an operator who is neither you nor its owner
            approves it.
          </Typography>
          <FormControl size="small">
            <InputLabel id="mandate-create-covers-label">Covers</InputLabel>
            <Select
              labelId="mandate-create-covers-label"
              label="Covers"
              value={covers}
              onChange={handleCoversChange}
              SelectDisplayProps={{ 'data-testid': 'mandate-create-covers' }}
            >
              <MenuItem
                value={COVERS_AGENT}
                data-testid="mandate-create-covers-agent"
              >
                Agent version
              </MenuItem>
              <MenuItem
                value={COVERS_TOOLKIT}
                data-testid="mandate-create-covers-toolkit"
              >
                Toolkit index schedules
              </MenuItem>
            </Select>
          </FormControl>
          {forToolkit && (
            <Autocomplete
              size="small"
              value={toolkit}
              onChange={handleToolkitChange}
              inputValue={toolkitInput}
              onInputChange={handleToolkitInputChange}
              options={toolkitOptions}
              loading={toolkitsFetching}
              filterOptions={showAllOptions}
              getOptionLabel={getName}
              isOptionEqualToValue={isSameOption}
              noOptionsText="No toolkits found"
              renderInput={params => (
                <TextField
                  {...params}
                  label="Toolkit"
                  helperText="Covers the owner's index schedules of this toolkit."
                  inputProps={{ ...params.inputProps, 'data-testid': 'mandate-create-toolkit' }}
                />
              )}
            />
          )}
          {!forToolkit && (
            <>
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
                    inputProps={{ ...params.inputProps, 'data-testid': 'mandate-create-agent' }}
                  />
                )}
              />
              <FormControl
                size="small"
                disabled={!selectedAgent}
              >
                <InputLabel id="mandate-create-version-label">Version</InputLabel>
                <Select
                  labelId="mandate-create-version-label"
                  label="Version"
                  value={versionId}
                  onChange={handleVersionChange}
                  SelectDisplayProps={{ 'data-testid': 'mandate-create-version' }}
                >
                  {versions.map(version => (
                    <MenuItem
                      key={version.id}
                      value={version.id}
                      disabled={!hasActiveIdentity(version)}
                      data-testid={`mandate-create-version-${version.id}`}
                    >
                      {version.name}
                      {hasActiveIdentity(version) ? '' : ' (no active identity)'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </>
          )}
          <ProjectUserPicker
            projectId={projectId}
            value={owner}
            onChange={setOwner}
            label="Owner"
            required
            helperText="Runs act for this member; they need a linked identity."
            testId="mandate-create-owner"
            sx={styles.wide}
          />
          <FormGroup row>
            {forToolkit ? (
              <FormControlLabel
                label={INDEX_OPERATION.label}
                control={
                  <Checkbox
                    checked
                    disabled
                    inputProps={{ 'data-testid': `mandate-create-op-${INDEX_OPERATION.value}` }}
                  />
                }
              />
            ) : (
              OPERATION_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.value}
                  label={option.label}
                  control={
                    <Checkbox
                      checked={operations.includes(option.value)}
                      onChange={handleOperationToggle(option.value)}
                      inputProps={{ 'data-testid': `mandate-create-op-${option.value}` }}
                    />
                  }
                />
              ))
            )}
          </FormGroup>
          <Box sx={styles.row}>
            <TextField
              size="small"
              type="number"
              label="Longest run (minutes)"
              value={minutes}
              onChange={handleMinutesChange}
              error={!runtimeValid}
              helperText="1 to 1440"
              inputProps={{ min: 1, max: 1440, 'data-testid': 'mandate-create-minutes' }}
            />
            <TextField
              size="small"
              type="date"
              label="Valid until"
              value={validDay}
              onChange={handleValidDayChange}
              InputLabelProps={{ shrink: true }}
              helperText={`At most ${MAX_VALID_DAYS} days ahead`}
              inputProps={{
                min: dayFromNow(1),
                max: dayFromNow(MAX_VALID_DAYS),
                'data-testid': 'mandate-create-valid',
              }}
            />
          </Box>
          {identitySources.length > 0 && (
            <FormControl size="small">
              <InputLabel id="mandate-create-identity-label">Acts with</InputLabel>
              <Select
                labelId="mandate-create-identity-label"
                label="Acts with"
                value={identity}
                onChange={handleIdentityChange}
                SelectDisplayProps={{ 'data-testid': 'mandate-create-identity' }}
              >
                <MenuItem value={NO_IDENTITY}>{identityLabel(null)}</MenuItem>
                {identitySources.map(source => (
                  <MenuItem
                    key={source}
                    value={source}
                    data-testid={`mandate-create-identity-${source}`}
                  >
                    {identityLabel(source)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          {identity === 'owner_delegated' && (
            <Typography
              variant="bodySmall"
              sx={styles.muted}
            >
              After approval, the owner gives their consent here, signed in as themselves (Give consent).
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
          data-testid="mandate-create-submit"
        >
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateMandateDialog.displayName = 'CreateMandateDialog';

/** @type {MuiSx} */
const createMandateDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  row: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  wide: {
    width: '100%',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
});

export default CreateMandateDialog;
