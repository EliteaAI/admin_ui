import { describe, expect, it } from 'vitest';

import {
  defaultCredentialTypes,
  emptyForm,
  formScopes,
  parseScopes,
  providerOf,
  scopesFieldText,
  toForm,
  typesMissingScopes,
} from '@/pages/ConfigurationPage/components/OAuthAppsSection/helpers/oauthApps.helpers';

// A catalog as the backend builds it from the credential schemas
const PROVIDER = {
  id: 'provider_a',
  label: 'Provider A',
  default_discovery_endpoint: 'https://login.example.com/organizations',
  credential_types: [
    {
      type: 'chat',
      label: 'Chat',
      opt_in: false,
      default_scopes: ['Chat.Read'],
      options: [
        { value: 'Chat.Read', label: 'Chat.Read', description: 'read' },
        {
          value: 'Channel.Read.All',
          label: 'Channel.Read.All',
          description: 'channels',
        },
      ],
    },
    {
      type: 'files',
      label: 'Files',
      opt_in: false,
      default_scopes: ['Files.ReadWrite.All'],
      options: [{ value: 'Files.ReadWrite.All', label: 'Files.ReadWrite.All' }],
    },
    { type: 'raw', label: 'Raw API', opt_in: true, default_scopes: ['User.Read'], options: null },
  ],
};

describe('oauthApps helpers', () => {
  it('falls back to the first provider for apps saved without one', () => {
    expect(providerOf([PROVIDER], undefined)).toBe(PROVIDER);
    expect(providerOf([], 'provider_a')).toBeNull();
  });

  it('starts new apps with the non-opt-in types and the schema default scopes', () => {
    const form = emptyForm(PROVIDER);
    expect(form.credential_types).toEqual(['chat', 'files']);
    expect(form.scopes).toEqual({ chat: ['Chat.Read'], files: ['Files.ReadWrite.All'], raw: ['User.Read'] });
    expect(form.oauth_discovery_endpoint).toBe(PROVIDER.default_discovery_endpoint);
    expect(defaultCredentialTypes(PROVIDER)).toEqual(['chat', 'files']);
  });

  it('keeps saved scopes the schema still offers and drops the rest', () => {
    expect(formScopes(PROVIDER, { chat: ['Channel.Read.All', 'Legacy.Scope'], raw: ['Mail.Read'] })).toEqual({
      chat: ['Channel.Read.All'],
      files: ['Files.ReadWrite.All'],
      raw: ['Mail.Read'],
    });
  });

  it('loads a saved app without exposing its secret', () => {
    const form = toForm([PROVIDER], { id: 'a', name: 'A', client_secret_set: true, scopes: { files: [] } });
    expect(form.client_secret).toBe('');
    expect(form.provider).toBe('provider_a');
    expect(form.credential_types).toEqual(['chat', 'files']);
    expect(form.scopes.files).toEqual([]);
  });

  it('reports switched-on types with a scope list and no scope', () => {
    const form = { ...emptyForm(PROVIDER), scopes: { chat: [], files: [], raw: [] } };
    expect(typesMissingScopes(PROVIDER, form)).toEqual(['chat', 'files']);
    expect(typesMissingScopes(PROVIDER, { ...form, credential_types: ['files', 'raw'] })).toEqual(['files']);
  });
});

describe('free-text scope field', () => {
  it('splits on spaces and commas', () => {
    expect(parseScopes(' User.Read,  Mail.Read  Files.Read ')).toEqual([
      'User.Read',
      'Mail.Read',
      'Files.Read',
    ]);
  });

  it('keeps the space or comma typed before the next scope', () => {
    expect(scopesFieldText('User.Read ', ['User.Read'])).toBe('User.Read ');
    expect(scopesFieldText('User.Read,', ['User.Read'])).toBe('User.Read,');
  });

  it('shows the form scopes when nothing was typed or they changed elsewhere', () => {
    expect(scopesFieldText(undefined, ['User.Read'])).toBe('User.Read');
    expect(scopesFieldText('', ['User.Read', 'Mail.Read'])).toBe('User.Read Mail.Read');
  });
});
