// The OAuth app dialog is driven by the provider catalog from the backend: credential types, their labels,
// offered scopes, defaults and flags come from the credential schemas, never from this code.

// Apps saved before the provider field existed belong to the provider the backend lists first
export const providerOf = (providers, providerId) =>
  providers.find(provider => provider.id === providerId) ?? providers[0] ?? null;

// Types an app serves when it has no saved list, and the ones a new app starts with: opt-in types are off
export const defaultCredentialTypes = provider =>
  (provider?.credential_types ?? []).filter(type => !type.opt_in).map(type => type.type);

export const credentialTypeLabels = (provider, types) =>
  (provider?.credential_types ?? []).filter(type => types.includes(type.type)).map(type => type.label);

const offeredScopes = (type, scopes) =>
  type.options ? scopes.filter(scope => type.options.some(option => option.value === scope)) : scopes;

// Scopes per credential type: the saved ones (only values the schema still offers), else the schema default
export const formScopes = (provider, savedScopes = {}) =>
  Object.fromEntries(
    (provider?.credential_types ?? []).map(type => [
      type.type,
      offeredScopes(type, savedScopes[type.type] ?? type.default_scopes ?? []),
    ]),
  );

// Switched-on types with a scope list need at least one scope (free-text types fall back to the default)
export const typesMissingScopes = (provider, form) =>
  (provider?.credential_types ?? [])
    .filter(type => type.options && form.credential_types.includes(type.type))
    .filter(type => !(form.scopes[type.type] ?? []).length)
    .map(type => type.type);

export const emptyForm = provider => ({
  provider: provider?.id ?? '',
  name: '',
  client_id: '',
  client_secret: '',
  oauth_discovery_endpoint: provider?.default_discovery_endpoint ?? '',
  scopes: formScopes(provider),
  credential_types: defaultCredentialTypes(provider),
  auto_refresh_token: true,
  is_default: false,
  enabled: true,
  allowed_project_ids: [],
});

export const toForm = (providers, app) => {
  const provider = providerOf(providers, app?.provider);
  if (!app) return emptyForm(provider);
  return {
    ...emptyForm(provider),
    ...app,
    provider: provider?.id ?? app.provider,
    // Write-only: the stored secret is never sent to the browser
    client_secret: '',
    scopes: formScopes(provider, app.scopes),
    // Unset on saved apps means the provider's default types (opt-in types off)
    credential_types: app.credential_types ?? defaultCredentialTypes(provider),
  };
};
