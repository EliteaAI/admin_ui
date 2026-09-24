// Secret names auto-bootstrapped at startup or managed by the platform.
// These are shown in the "Internal" tab and are read-only.
export const INTERNAL_SECRET_NAMES = new Set([
  // added via RPC (auth_init)
  'auth_token',
  // per-project LLM key managed by runtime_interface_litellm
  'project_llm_key',
]);

export const SECRET_NAME_REGEX = /^[A-Za-z0-9_]+$/;
