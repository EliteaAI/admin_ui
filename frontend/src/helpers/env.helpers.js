// The backend injects `window.admin_ui_config` into index.html. This file is the only place that reads it.
export const getAdminConfig = () => globalThis.admin_ui_config || {};

export const getEnvVar = name => {
  return getAdminConfig()[name] ?? import.meta.env[`VITE_${name.toUpperCase()}`];
};

const toBoolean = value => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return false;
};

export const VITE_SERVER_URL = getEnvVar('vite_server_url') ?? '';
export const V2_BASE = VITE_SERVER_URL.replace('/api/v1', '/api/v2');
export const VITE_DEV_TOKEN = import.meta.env.VITE_DEV_TOKEN ?? '';
export const ALWAYS_SHOW_PLUGIN_UPDATE = toBoolean(getEnvVar('always_show_plugin_update'));
