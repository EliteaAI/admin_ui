import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormGroup,
  FormLabel,
  MenuItem,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import { useConfigSuggestionsQuery } from '@/api/configuration.api';
import {
  useOAuthAppCheckMutation,
  useOAuthAppCreateMutation,
  useOAuthAppUpdateMutation,
} from '@/api/oauthApps.api';
import {
  MICROSOFT_ENTRA,
  OAUTH_PROVIDERS,
  providerOf,
} from '@/pages/ConfigurationPage/components/OAuthAppsSection/constants/oauthApps.constants';

const allTypes = provider => provider.scopeGroups.map(group => group.type);

const recommendedScopes = provider =>
  Object.fromEntries(provider.scopeGroups.map(group => [group.type, group.recommended]));

const emptyForm = (providerId = MICROSOFT_ENTRA) => ({
  provider: providerId,
  name: '',
  client_id: '',
  client_secret: '',
  oauth_discovery_endpoint: OAUTH_PROVIDERS[providerId].defaultDiscoveryEndpoint,
  scopes: recommendedScopes(OAUTH_PROVIDERS[providerId]),
  credential_types: allTypes(OAUTH_PROVIDERS[providerId]),
  auto_refresh_token: true,
  is_default: false,
  enabled: true,
  allowed_project_ids: [],
});

const toForm = app => {
  if (!app) return emptyForm();
  const provider = providerOf(app);
  return {
    ...emptyForm(app.provider),
    ...app,
    provider: app.provider ?? MICROSOFT_ENTRA,
    // Write-only: the stored secret is never sent to the browser
    client_secret: '',
    scopes: Object.fromEntries(
      provider.scopeGroups.map(group => [group.type, app.scopes?.[group.type] ?? group.recommended]),
    ),
    // Unset on saved apps means every credential type of the provider
    credential_types: app.credential_types ?? allTypes(provider),
  };
};

const toggle = (list, value, checked) =>
  checked ? [...new Set([...list, value])] : list.filter(item => item !== value);

const OAuthAppDialog = memo(props => {
  const { open, app, onClose, onSaved } = props;

  const styles = useMemo(() => oauthAppDialogStyles(), []);
  const isEdit = Boolean(app);
  const [form, setForm] = useState(emptyForm);
  // The form as loaded: on edit, Save is enabled only once something differs from it
  const [initialForm, setInitialForm] = useState(emptyForm);
  const provider = providerOf(form);
  const [replaceSecret, setReplaceSecret] = useState(false);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState(null);

  const [createApp, { isLoading: isCreating }] = useOAuthAppCreateMutation();
  const [updateApp, { isLoading: isUpdating }] = useOAuthAppUpdateMutation();
  const [checkApp, { isLoading: isChecking }] = useOAuthAppCheckMutation();
  const isSaving = isCreating || isUpdating;

  const { data: projectSuggestions } = useConfigSuggestionsQuery({ source: 'projects' }, { skip: !open });
  const projectOptions = useMemo(() => projectSuggestions?.values ?? [], [projectSuggestions]);
  const projectLabels = useMemo(() => projectSuggestions?.labels ?? {}, [projectSuggestions]);

  useEffect(() => {
    if (open) {
      const loaded = toForm(app);
      setForm(loaded);
      setInitialForm(loaded);
      setReplaceSecret(!app);
      setError('');
      setCheckResult(null);
    }
  }, [open, app]);

  const setField = useCallback((field, value) => setForm(prev => ({ ...prev, [field]: value })), []);

  // Only on create: the provider of a saved app is fixed
  const handleProviderChange = useCallback(
    providerId =>
      setForm(prev => ({
        ...prev,
        provider: providerId,
        oauth_discovery_endpoint: OAUTH_PROVIDERS[providerId].defaultDiscoveryEndpoint,
        scopes: recommendedScopes(OAUTH_PROVIDERS[providerId]),
        credential_types: allTypes(OAUTH_PROVIDERS[providerId]),
      })),
    [],
  );

  const handleScopeToggle = useCallback(
    (type, scope, checked) =>
      setForm(prev => ({
        ...prev,
        scopes: { ...prev.scopes, [type]: toggle(prev.scopes[type] || [], scope, checked) },
      })),
    [],
  );

  const handleTypeToggle = useCallback(
    (type, checked) =>
      setForm(prev => ({ ...prev, credential_types: toggle(prev.credential_types, type, checked) })),
    [],
  );

  const handleScopesText = useCallback(
    (type, text) =>
      setForm(prev => ({
        ...prev,
        scopes: { ...prev.scopes, [type]: text.split(/[\s,]+/).filter(Boolean) },
      })),
    [],
  );

  const handleClose = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  const buildPayload = useCallback(
    () => ({
      provider: form.provider,
      name: form.name.trim(),
      client_id: form.client_id.trim(),
      oauth_discovery_endpoint: form.oauth_discovery_endpoint.trim(),
      // Scopes of a switched-off type are kept, so switching it on again restores them
      scopes: form.scopes,
      credential_types: form.credential_types,
      auto_refresh_token: form.auto_refresh_token,
      is_default: form.is_default,
      enabled: form.enabled,
      allowed_project_ids: form.allowed_project_ids,
      // Omitted on edit unless replaced: the backend keeps the stored secret
      ...(replaceSecret && { client_secret: form.client_secret }),
    }),
    [form, replaceSecret],
  );

  const handleCheck = useCallback(async () => {
    setCheckResult(null);
    try {
      const result = await checkApp({ id: app?.id, ...buildPayload() }).unwrap();
      setCheckResult(result);
    } catch (err) {
      setCheckResult({
        success: false,
        message: err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to test the connection.',
      });
    }
  }, [app, buildPayload, checkApp]);

  const handleSave = useCallback(async () => {
    const payload = buildPayload();
    try {
      if (isEdit) {
        await updateApp({ id: app.id, ...payload }).unwrap();
      } else {
        await createApp(payload).unwrap();
      }
      onSaved?.(isEdit);
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.data?.message ?? err?.error ?? 'Failed to save the app.');
    }
  }, [app, buildPayload, createApp, isEdit, onClose, onSaved, updateApp]);

  const isValid =
    form.name.trim() &&
    form.client_id.trim() &&
    form.oauth_discovery_endpoint.trim() &&
    form.credential_types.length > 0 &&
    form.allowed_project_ids.length > 0 &&
    (!replaceSecret || form.client_secret.trim());
  const isDirty = useMemo(
    () => !isEdit || replaceSecret || JSON.stringify(form) !== JSON.stringify(initialForm),
    [form, initialForm, isEdit, replaceSecret],
  );
  const canSave = isValid && isDirty;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>{isEdit ? `Edit ${provider.label} app` : 'New OAuth app'}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        <Box sx={styles.availability}>
          <Typography variant="labelMedium">General</Typography>
          <Typography
            variant="bodySmall"
            sx={styles.availabilityHint}
          >
            What users see and how they get this app in their {provider.credentialTypes} credentials.
          </Typography>
          <TextField
            select
            label="Provider"
            helperText="Identity provider of this app. Only Microsoft Entra ID is available."
            value={form.provider}
            onChange={event => handleProviderChange(event.target.value)}
            disabled
            required
            fullWidth
            size="small"
          >
            {Object.entries(OAUTH_PROVIDERS).map(([id, option]) => (
              <MenuItem
                key={id}
                value={id}
              >
                {option.label}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            label="Name"
            helperText="Shown to users when they pick an app"
            value={form.name}
            onChange={event => setField('name', event.target.value)}
            required
            fullWidth
            size="small"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.enabled}
                onChange={(_, checked) => setField('enabled', checked)}
              />
            }
            label="Enabled"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.is_default}
                onChange={(_, checked) => setField('is_default', checked)}
              />
            }
            label="Default app: users get this app and cannot choose a custom one"
          />
          <Autocomplete
            multiple
            size="small"
            options={projectOptions}
            value={form.allowed_project_ids}
            getOptionLabel={option => projectLabels[option] ?? String(option)}
            onChange={(_, value) => setField('allowed_project_ids', value)}
            renderInput={params => (
              <TextField
                {...params}
                label="Projects"
                required
                error={form.allowed_project_ids.length === 0}
                helperText="Required. The app applies only in the selected projects."
              />
            )}
          />
        </Box>
        <TextField
          label="Client ID"
          value={form.client_id}
          onChange={event => setField('client_id', event.target.value)}
          required
          fullWidth
          size="small"
        />
        {replaceSecret ? (
          <TextField
            label="Client secret"
            type="password"
            autoComplete="new-password"
            helperText={
              isEdit
                ? 'The new value replaces the stored secret for every credential that uses this app.'
                : 'Stored encrypted. It is never shown again once saved.'
            }
            value={form.client_secret}
            onChange={event => setField('client_secret', event.target.value)}
            required
            fullWidth
            size="small"
          />
        ) : (
          <Box sx={styles.secretRow}>
            <Typography variant="bodyMedium">
              Client secret: {app?.client_secret_set ? '••••••••  (set)' : 'not set'}
            </Typography>
            <Button
              size="small"
              onClick={() => setReplaceSecret(true)}
            >
              Replace
            </Button>
          </Box>
        )}
        <TextField
          label="OAuth discovery endpoint"
          helperText={provider.discoveryEndpointHint}
          value={form.oauth_discovery_endpoint}
          onChange={event => setField('oauth_discovery_endpoint', event.target.value)}
          required
          fullWidth
          size="small"
        />

        <FormLabel>Credential types and scopes</FormLabel>
        <Typography
          variant="bodySmall"
          sx={styles.hint}
        >
          Switch off a type to stop offering this app for those credentials. Scopes are requested when users
          sign in; the app registration must grant them.
        </Typography>
        {provider.scopeGroups.map(group => (
          <Box
            key={group.type}
            sx={styles.scopeGroup}
          >
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={form.credential_types.includes(group.type)}
                  onChange={(_, checked) => handleTypeToggle(group.type, checked)}
                  data-testid={`oauth-app-type-${group.type}`}
                />
              }
              label={<Typography variant="labelMedium">{group.label}</Typography>}
            />
            {!form.credential_types.includes(group.type) ? (
              <Typography
                variant="bodySmall"
                sx={styles.typeOff}
              >
                Off: {group.label} credentials cannot use this app.
              </Typography>
            ) : group.options ? (
              <FormGroup
                row
                sx={styles.scopeOptions}
              >
                {group.options.map(scope => (
                  <FormControlLabel
                    key={scope}
                    control={
                      <Checkbox
                        size="small"
                        checked={(form.scopes[group.type] || []).includes(scope)}
                        onChange={(_, checked) => handleScopeToggle(group.type, scope, checked)}
                      />
                    }
                    label={scope}
                  />
                ))}
              </FormGroup>
            ) : (
              <TextField
                size="small"
                fullWidth
                placeholder="e.g. Sites.Read.All Files.Read.All"
                helperText={provider.freeScopesHint}
                value={(form.scopes[group.type] || []).join(' ')}
                onChange={event => handleScopesText(group.type, event.target.value)}
              />
            )}
          </Box>
        ))}
        <FormControlLabel
          control={
            <Switch
              checked={form.auto_refresh_token}
              onChange={(_, checked) => setField('auto_refresh_token', checked)}
            />
          }
          label="Auto refresh token (offline_access): keep users signed in"
        />
      </DialogContent>
      {checkResult && (
        <Alert
          severity={checkResult.success ? (checkResult.warning ? 'warning' : 'success') : 'error'}
          sx={styles.checkResult}
        >
          {checkResult.message}
        </Alert>
      )}
      <DialogActions>
        <Button
          onClick={handleCheck}
          disabled={isSaving || isChecking || !isValid}
          sx={styles.checkButton}
        >
          {isChecking ? 'Testing...' : 'Test connection'}
        </Button>
        <Button
          onClick={handleClose}
          disabled={isSaving}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !canSave}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});

OAuthAppDialog.displayName = 'OAuthAppDialog';

/** @type {MuiSx} */
const oauthAppDialogStyles = () => ({
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    paddingTop: '0.5rem !important',
  },
  secretRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  availability: ({ palette }) => ({
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0.75rem 1rem',
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
  }),
  availabilityHint: ({ palette }) => ({
    color: palette.text.metrics,
    marginBottom: '0.5rem',
  }),
  checkResult: {
    margin: '0 1.5rem',
  },
  checkButton: {
    marginRight: 'auto',
  },
  hint: ({ palette }) => ({
    color: palette.text.metrics,
    marginTop: '-0.75rem',
  }),
  typeOff: ({ palette }) => ({
    color: palette.text.metrics,
  }),
  scopeGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  scopeOptions: {
    columnGap: '0.5rem',
  },
});

export default OAuthAppDialog;
