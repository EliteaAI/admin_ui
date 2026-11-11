import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import ManageSearchOutlinedIcon from '@mui/icons-material/ManageSearchOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined';

// Cards in display order, each with its field keys in display order. The backend section
// holds the fields in schema order, so the lists here decide what a card shows.
export const SCHEDULES_CARDS = [
  {
    id: 'schedule_settings',
    title: 'Schedule Settings',
    icon: TuneOutlinedIcon,
    fieldKeys: [
      'schedules_min_interval_minutes',
      'schedules_max_enabled_per_project',
      'schedules_dispatch_cap',
      'schedules_stale_run_minutes',
      'schedules_max_parallel_runs',
      'schedules_approval_wait_hours',
    ],
  },
  {
    id: 'agent_schedules',
    title: 'Agent Schedules',
    icon: SmartToyOutlinedIcon,
    fieldKeys: ['agent_scheduling_enabled'],
  },
  {
    id: 'pipeline_schedules',
    title: 'Pipeline Schedules',
    icon: AccountTreeOutlinedIcon,
    fieldKeys: ['pipeline_scheduling_enabled', 'pipeline_scheduling_cron', 'schedules_legacy_step_enabled'],
  },
  {
    id: 'index_schedules',
    title: 'Index Schedules',
    icon: ManageSearchOutlinedIcon,
    fieldKeys: ['index_scheduling_enabled', 'index_scheduling_cron'],
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: WebhookOutlinedIcon,
    fieldKeys: [
      'schedules_webhook_max_concurrent_runs',
      'schedules_webhook_max_concurrent_runs_limit',
      'schedules_webhook_project_max_concurrent_runs',
      'schedules_webhook_max_waiting_runs',
    ],
  },
];
