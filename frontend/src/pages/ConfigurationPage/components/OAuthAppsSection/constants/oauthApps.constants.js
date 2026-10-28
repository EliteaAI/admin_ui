export const MICROSOFT_ENTRA = 'microsoft_entra';

// Microsoft Graph delegated scopes the Teams and Outlook credentials offer (mirrors elitea-sdk).
// SharePoint takes free-form scopes. An empty list means the credential's recommended set.
const ENTRA_SCOPE_GROUPS = [
  {
    type: 'teams',
    label: 'Teams',
    options: [
      'User.ReadBasic.All',
      'Chat.Read',
      'ChatMessage.Send',
      'Chat.Create',
      'Team.ReadBasic.All',
      'Channel.ReadBasic.All',
      'ChannelMessage.Send',
    ],
    recommended: ['User.ReadBasic.All', 'Chat.Read', 'Team.ReadBasic.All', 'Channel.ReadBasic.All'],
  },
  {
    type: 'outlook',
    label: 'Outlook',
    options: [
      'Mail.Read',
      'Mail.ReadWrite',
      'Mail.Send',
      'Mail.Read.Shared',
      'Mail.ReadWrite.Shared',
      'Mail.Send.Shared',
    ],
    recommended: ['Mail.Read'],
  },
  { type: 'sharepoint', label: 'SharePoint', options: null, recommended: [] },
];

// Identity providers an app can belong to (mirrors the configurations plugin). A provider sets the
// credential types its apps serve, their scope groups and the discovery endpoint the backend accepts.
export const OAUTH_PROVIDERS = {
  [MICROSOFT_ENTRA]: {
    label: 'Microsoft Entra ID',
    credentialTypes: 'Teams, Outlook and SharePoint',
    defaultDiscoveryEndpoint: 'https://login.microsoftonline.com/organizations',
    discoveryEndpointHint:
      'https://login.microsoftonline.com/organizations for multi-tenant apps, or /<tenant_id> for one tenant',
    freeScopesHint: 'Space separated Microsoft Graph scopes',
    scopeGroups: ENTRA_SCOPE_GROUPS,
  },
};

export const providerOf = app => OAUTH_PROVIDERS[app?.provider] ?? OAUTH_PROVIDERS[MICROSOFT_ENTRA];
