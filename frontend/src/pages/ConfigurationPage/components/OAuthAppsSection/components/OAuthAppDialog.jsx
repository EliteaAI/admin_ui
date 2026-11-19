import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import {
  Alert,
  Autocomplete,
  Box,
  Button,
  CircularProgress,
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
  useOAuthAppProviderListQuery,
  useOAuthAppUpdateMutation,
} from '@/api/oauthApps.api';
import {
  credentialTypeLabels,
  emptyForm,
  formScopes,
  parseScopes,
  providerOf,
  scopesFieldText,
  toForm,
  typesMissingScopes,
} from '@/pages/ConfigurationPage/components/OAuthAppsSection/helpers/oauthApps.helpers';

import ScopeOption from './ScopeOption';

const toggle = (list, value, checked) =>
  checked ? [...new Set([...list, value])] : list.filter(item => item !== value);

const OAuthAppDialog = memo(props => {
  const { open, app, onClose, onSaved } = props;

  const styles = useMemo(() => oauthAppDialogStyles(), []);
  const isEdit = Boolean(app);
  const { data: providers = [], isLoading: isLoadingProviders } = useOAuthAppProviderListQuery(undefined, {
    skip: !open,
  });
  const [form, setForm] = useState(() => emptyForm(null));
  // The form as loaded: on edit, Save is enabled only once something differs from it
  const [initialForm, setInitialForm] = useState(() => emptyForm(null));
  const provider = providerOf(providers, form.provider);
  const [replaceSecret, setReplaceSecret] = useState(false);
  const [error, setError] = useState('');
  const [checkResult, setCheckResult] = useState(null);
  // Free-text scope fields as typed, per credential type
  const [scopeTexts, setScopeTexts] = useState({});

  const [createApp, { isLoading: isCreating }] = useOAuthAppCreateMutation();
  const [updateApp, { isLoading: isUpdating }] = useOAuthAppUpdateMutation();
  const [checkApp, { isLoading: isChecking }] = useOAuthAppCheckMutation();
  const isSaving = isCreating || isUpdating;

  const { data: projectSuggestions } = useConfigSuggestionsQuery({ source: 'projects' }, { skip: !open });
  const projectOptions = useMemo(() => projectSuggestions?.values ?? [], [projectSuggestions]);
  const projectLabels = useMemo(() => projectSuggestions?.labels ?? {}, [projectSuggestions]);

  useEffect(() => {
    if (open && providers.length) {
      const loaded = toForm(providers, app);
      setForm(loaded);
      setInitialForm(loaded);
      setScopeTexts({});
      setReplaceSecret(!app);
      setError('');
      setCheckResult(null);
    }
  }, [open, app, providers]);

  const setField = useCallback((field, value) => setForm(prev => ({ ...prev, [field]: value })), []);

  // Only on create: the provider of a saved app is fixed
  const handleProviderChange = useCallback(
    providerId =>
      setForm(prev => ({
        ...emptyForm(providerOf(providers, providerId)),
        name: prev.name,
        client_id: prev.client_id,
        client_secret: prev.client_secret,
        is_default: prev.is_default,
        enabled: prev.enabled,
        allowed_project_ids: prev.allowed_project_ids,
      })),
    [providers],
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
      setForm(prev => ({
        ...prev,
        credential_types: toggle(prev.credential_types, type, checked),
        // Switching a type on with no scopes left starts it from the schema default
        ...(checked &&
          !(prev.scopes[type] ?? []).length && {
            scopes: { ...prev.scopes, [type]: formScopes(provider)[type] ?? [] },
          }),
      })),
    [provider],
  );

  const handleScopesText = useCallback((type, text) => {
    setScopeTexts(prev => ({ ...prev, [type]: text }));
    setForm(prev => ({ ...prev, scopes: { ...prev.scopes, [type]: parseScopes(text) } }));
  }, []);

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

  // The stored secret only ever goes to the authority it was saved with: a changed endpoint needs it again
  const endpointChanged =
    isEdit &&
    form.oauth_discovery_endpoint.trim().replace(/\/+$/, '').toLowerCase() !==
      initialForm.oauth_discovery_endpoint.trim().replace(/\/+$/, '').toLowerCase();
  const needsSecret = endpointChanged && !replaceSecret;

  const missingScopes = typesMissingScopes(provider, form);
  const isValid =
    Boolean(provider) &&
    missingScopes.length === 0 &&
    form.name.trim() &&
    form.client_id.trim() &&
    form.oauth_discovery_endpoint.trim() &&
    form.credential_types.length > 0 &&
    form.allowed_project_ids.length > 0 &&
    (!replaceSecret || form.client_secret.trim()) &&
    !needsSecret;
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
      <DialogTitle>{isEdit && provider ? `Edit ${provider.label} app` : 'New OAuth app'}</DialogTitle>
      <DialogContent sx={styles.content}>
        {error && <Alert severity="error">{error}</Alert>}
        {!provider && (
          <Box sx={styles.loading}>
            {isLoadingProviders ? (
              <CircularProgress size="1.5rem" />
            ) : (
              <Typography
                variant="bodyMedium"
                color="error"
              >
                Failed to load OAuth app providers.
              </Typography>
            )}
          </Box>
        )}
        {provider && (
          <>
            <Box sx={styles.availability}>
              <Typography variant="labelMedium">General</Typography>
              <Typography
                variant="bodySmall"
                sx={styles.availabilityHint}
              >
                What users see and how they get this app in their{' '}
                {credentialTypeLabels(
                  provider,
                  provider.credential_types.map(type => type.type),
                ).join(', ')}{' '}
                credentials.
              </Typography>
              <TextField
                select
                label="Provider"
                helperText={
                  providers.length > 1
                    ? 'Identity provider of this app. It cannot be changed later.'
                    : `Identity provider of this app. Only ${provider.label} is available.`
                }
                value={form.provider}
                onChange={event => handleProviderChange(event.target.value)}
                disabled={isEdit || providers.length < 2}
                required
                fullWidth
                size="small"
              >
                {providers.map(option => (
                  <MenuItem
                    key={option.id}
                    value={option.id}
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
              error={needsSecret}
              helperText={
                needsSecret
                  ? 'Replace the client secret to use a new endpoint: the stored secret stays with the saved one.'
                  : provider.discovery_endpoint_hint
              }
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
              Switch off a type to stop offering this app for those credentials. Scopes are requested when
              users sign in; the app registration must grant them.
            </Typography>
            {provider.credential_types.map(type => {
              const isOn = form.credential_types.includes(type.type);
              const scopes = form.scopes[type.type] ?? [];
              return (
                <Box
                  key={type.type}
                  sx={styles.scopeGroup}
                >
                  <FormControlLabel
                    control={
                      <Switch
                        size="small"
                        checked={isOn}
                        onChange={(_, checked) => handleTypeToggle(type.type, checked)}
                        data-testid={`oauth-app-type-${type.type}`}
                      />
                    }
                    label={<Typography variant="labelMedium">{type.label}</Typography>}
                  />
                  {!isOn ? (
                    <Typography
                      variant="bodySmall"
                      sx={styles.typeOff}
                    >
                      Off: {type.label} credentials cannot use this app.
                    </Typography>
                  ) : type.options ? (
                    <>
                      <FormGroup
                        row
                        sx={styles.scopeOptions}
                      >
                        {type.options.map(option => (
                          <ScopeOption
                            key={option.value}
                            option={option}
                            checked={scopes.includes(option.value)}
                            onToggle={(scope, checked) => handleScopeToggle(type.type, scope, checked)}
                          />
                        ))}
                      </FormGroup>
                      {missingScopes.includes(type.type) && (
                        <Typography
                          variant="bodySmall"
                          color="error"
                          data-testid={`oauth-app-scopes-error-${type.type}`}
                        >
                          Select at least one scope, or switch {type.label} off.
                        </Typography>
                      )}
                    </>
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      placeholder={type.default_scopes?.length ? `e.g. ${type.default_scopes.join(' ')}` : ''}
                      helperText={
                        type.default_scopes?.length
                          ? `Space-separated scopes. Empty uses ${type.default_scopes.join(' ')}`
                          : 'Space-separated scopes'
                      }
                      inputProps={{ 'data-testid': `oauth-app-scopes-${type.type}` }}
                      value={scopesFieldText(scopeTexts[type.type], scopes)}
                      onChange={event => handleScopesText(type.type, event.target.value)}
                    />
                  )}
                </Box>
              );
            })}
            <FormControlLabel
              control={
                <Switch
                  checked={form.auto_refresh_token}
                  onChange={(_, checked) => setField('auto_refresh_token', checked)}
                />
              }
              label="Auto refresh token (offline_access): keep users signed in"
            />
            <Typography
              variant="bodySmall"
              sx={styles.hint}
            >
              {form.auto_refresh_token
                ? 'Sign-in asks for offline_access, so users stay signed in and scheduled runs can use a saved login.'
                : 'Sign-in does not ask for offline_access: users sign in again about every hour, and scheduled runs cannot use a saved login.'}
            </Typography>
          </>
        )}
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
  loading: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
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
