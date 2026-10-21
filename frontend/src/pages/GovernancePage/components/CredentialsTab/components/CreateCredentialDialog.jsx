import { memo, useCallback, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import { useCredentialCandidateListQuery, useCredentialReferenceCreateMutation } from '@/api/governance.api';
import { useDebounceValue } from '@/hooks/useDebounceValue.hooks';
import {
  CORPORATE_VAULT_STORE,
  CREATE_CLASSES,
  CREATE_STORES,
  MIGRATION_HINT,
} from '@/pages/GovernancePage/components/CredentialsTab/constants/credentials.constants';
import { storeLabel } from '@/pages/GovernancePage/components/CredentialsTab/helpers/credentials.helpers';
import GovernanceErrorAlert from '@/pages/GovernancePage/components/GovernanceErrorAlert';
import ProjectUserPicker from '@/pages/GovernancePage/components/ProjectUserPicker';
import { classLabel, toGovernanceError } from '@/pages/GovernancePage/helpers/governance.helpers';

const CANDIDATE_LIMIT = 20;
const VAULT_HINT = 'Corporate Vault is not configured for this deployment.';
const NO_SECRETS_HINT = 'This configuration has no secret fields to register.';

const isSameOption = (option, value) => option.uuid === value.uuid;
const showAllOptions = options => options;
const getCandidateLabel = option => option.title ?? option.label ?? option.uuid;
const isUnusable = option => option.has_secret_fields === false;

/**
 * Registers a credential configuration of the project as a governed reference. It starts as pending: the value is
 * imported (or, for a personal reference, set by the operator), probed, approved and activated afterwards.
 * A personal reference belongs to one member of the project. `vaultAvailable` is false only when the governance
 * preflight is known to report Corporate Vault as not configured.
 * `onCreated({ title, personal })`.
 */
const CreateCredentialDialog = memo(props => {
  const { open, projectId, vaultAvailable = true, onClose, onCreated } = props;

  const styles = createCredentialDialogStyles();

  const [candidate, setCandidate] = useState(null);
  const [candidateInput, setCandidateInput] = useState('');
  const [candidateSearch, setCandidateSearch] = useState('');
  const [ownershipClass, setOwnershipClass] = useState('project_shared');
  const [owner, setOwner] = useState(null);
  const [storeKind, setStoreKind] = useState('database');
  const [error, setError] = useState(null);

  const debouncedSearch = useDebounceValue(candidateSearch, 300);

  const { data, isFetching } = useCredentialCandidateListQuery(
    { projectId, limit: CANDIDATE_LIMIT, search: debouncedSearch },
    { skip: !open || !projectId, refetchOnMountOrArgChange: true },
  );

  const [createReference, { isLoading }] = useCredentialReferenceCreateMutation();

  const options = useMemo(() => data?.rows ?? [], [data?.rows]);

  const personal = ownershipClass === 'personal';
  const canSubmit = Boolean(candidate) && (!personal || Boolean(owner)) && !isLoading;

  const reset = useCallback(() => {
    setCandidate(null);
    setCandidateInput('');
    setCandidateSearch('');
    setOwnershipClass('project_shared');
    setOwner(null);
    setStoreKind('database');
    setError(null);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    reset();
    onClose();
  }, [isLoading, reset, onClose]);

  const handleCandidateChange = useCallback((_, next) => {
    setCandidate(next);
    setError(null);
  }, []);

  const handleCandidateInputChange = useCallback((_, next, reason) => {
    setCandidateInput(next);
    setCandidateSearch(reason === 'input' ? next : '');
  }, []);

  const handleClassChange = useCallback(event => {
    setOwnershipClass(event.target.value);
    setError(null);
  }, []);

  const handleStoreChange = useCallback(event => setStoreKind(event.target.value), []);

  const handleCreate = useCallback(async () => {
    setError(null);
    try {
      await createReference({
        projectId,
        configuration_uuid: candidate.uuid,
        store_kind: storeKind,
        ownership_class: ownershipClass,
        // The owner goes with a personal reference only; the backend refuses it for any other class
        ...(personal && { owner_user_id: owner.id }),
      }).unwrap();
      const created = { title: getCandidateLabel(candidate), personal };
      reset();
      onCreated(created);
    } catch (err) {
      setError(toGovernanceError(err, 'Failed to register the credential.'));
    }
  }, [createReference, projectId, candidate, storeKind, ownershipClass, personal, owner, reset, onCreated]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      data-testid="credential-create-dialog"
    >
      <DialogTitle>Register credential</DialogTitle>
      <DialogContent>
        <Box sx={styles.content}>
          {error?.code === 'MIGRATION_REQUIRED' ? (
            <Alert
              severity="warning"
              data-testid="credential-migration-notice"
            >
              {MIGRATION_HINT}
            </Alert>
          ) : (
            <GovernanceErrorAlert error={error} />
          )}
          <Typography
            variant="bodySmall"
            sx={styles.muted}
          >
            The reference starts as pending. Its value is imported (or set, for a personal credential), then
            probed, approved by another operator and activated.
          </Typography>
          <Autocomplete
            size="small"
            value={candidate}
            onChange={handleCandidateChange}
            inputValue={candidateInput}
            onInputChange={handleCandidateInputChange}
            options={options}
            loading={isFetching}
            filterOptions={showAllOptions}
            getOptionLabel={getCandidateLabel}
            getOptionDisabled={isUnusable}
            isOptionEqualToValue={isSameOption}
            noOptionsText="No credential configurations found"
            renderOption={(optionProps, option) => (
              <Box
                component="li"
                {...optionProps}
                key={option.uuid}
              >
                <Tooltip
                  title={isUnusable(option) ? NO_SECRETS_HINT : ''}
                  placement="left"
                >
                  <Box sx={styles.option}>
                    <Typography variant="bodyMedium">{getCandidateLabel(option)}</Typography>
                    <Typography
                      variant="bodySmall"
                      sx={styles.muted}
                    >
                      {option.configuration_type}
                    </Typography>
                  </Box>
                </Tooltip>
              </Box>
            )}
            renderInput={params => (
              <TextField
                {...params}
                label="Configuration"
                required
                inputProps={{ ...params.inputProps, 'data-testid': 'credential-create-configuration' }}
              />
            )}
          />
          <FormControl>
            <FormLabel>Class</FormLabel>
            <RadioGroup
              row
              value={ownershipClass}
              onChange={handleClassChange}
            >
              {CREATE_CLASSES.map(value => (
                <FormControlLabel
                  key={value}
                  value={value}
                  label={classLabel(value)}
                  control={<Radio inputProps={{ 'data-testid': `credential-create-class-${value}` }} />}
                />
              ))}
            </RadioGroup>
          </FormControl>
          {personal && (
            <ProjectUserPicker
              projectId={projectId}
              value={owner}
              onChange={setOwner}
              label="Owner"
              required
              helperText="A personal credential belongs to one member of the project."
              testId="credential-create-owner"
              sx={styles.owner}
            />
          )}
          <FormControl>
            <FormLabel>Store</FormLabel>
            <RadioGroup
              row
              value={storeKind}
              onChange={handleStoreChange}
            >
              {CREATE_STORES.map(value => {
                const blocked = value === CORPORATE_VAULT_STORE && !vaultAvailable;
                return (
                  <Tooltip
                    key={value}
                    title={blocked ? VAULT_HINT : ''}
                  >
                    <Box component="span">
                      <FormControlLabel
                        value={value}
                        label={storeLabel(value)}
                        disabled={blocked}
                        control={<Radio inputProps={{ 'data-testid': `credential-create-store-${value}` }} />}
                      />
                    </Box>
                  </Tooltip>
                );
              })}
            </RadioGroup>
          </FormControl>
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
          data-testid="credential-create-submit"
        >
          Register
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CreateCredentialDialog.displayName = 'CreateCredentialDialog';

/** @type {MuiSx} */
const createCredentialDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.25rem',
  },
  muted: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  option: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  owner: {
    width: '100%',
  },
});

export default CreateCredentialDialog;
