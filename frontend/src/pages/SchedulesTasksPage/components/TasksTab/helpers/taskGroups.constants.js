/**
 * Functional sub-groups for tasks the backend reports as "General".
 * Order here is the display order. Tasks are matched by exact name.
 */
export const GENERAL_TASK_GROUPS = [
  {
    group: 'General - Models & AI Runtime',
    tasks: [
      'cleanup_llm_orphans',
      'delete_llm_entities',
      'delete_llm_venv',
      'import_llm_models',
      'migrate_embedding_model',
      'migrate_llm_model',
      'migrate_service_prompt_generate_eval_dimensions',
      'sync_llm_entities',
    ],
  },
  {
    group: 'General - Integrations & Toolkits',
    tasks: [
      'mesh_get_plugin_frozen_requirements',
      'migrate_confluence_api_version',
      'migrate_toolkit_selected_tools',
      'migrate_toolkit_settings_fields',
    ],
  },
  {
    group: 'General - Categories',
    tasks: [
      'reassign_agent_category',
      'reassign_skill_category',
      'rename_agent_category',
      'rename_skill_category',
    ],
  },
  {
    group: 'General - Users & Projects',
    tasks: [
      'delete_failed_projects',
      'delete_ghost_users',
      'delete_users_with_private_projects_cascade',
      'fix_personal_projects',
      'list_failed_projects',
      'suspend_projects_and_users',
    ],
  },
  {
    group: 'General - Secrets & Credentials',
    tasks: [
      'danger_sanitize_secrets_with_value',
      'migrate_mcp_client_secrets',
      'migrate_provider_hub_secrets',
      'recreate_project_tokens',
      'seed_llm_keys',
      'sync_pgvector_credentials',
    ],
  },
  {
    group: 'General - Database & Schema',
    tasks: [
      'create_database',
      'create_tables',
      'create_tables_for_failed',
      'propose_migrations',
      'usage_ensure_partitions_now_task',
    ],
  },
  {
    group: 'General - Platform Maintenance',
    tasks: ['cleanup_orphaned_schedules', 'cleanup_oversized_message_meta', 'resync_platform_dimensions'],
  },
];

/** Catch-all for "General" tasks not listed above (e.g. newly registered ones). */
export const GENERAL_UNGROUPED_GROUP = 'General - Ungrouped';

export const DEFAULT_EXPANDED_GROUP = GENERAL_TASK_GROUPS[0].group;
