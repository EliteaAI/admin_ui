import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined';

// The backend section holds the fields in schema order, so this list decides what the card
// shows and in which order.
export const WEBHOOKS_CARD = {
  id: 'webhooks',
  title: 'Webhooks',
  icon: WebhookOutlinedIcon,
  fieldKeys: [
    'schedules_webhook_max_concurrent_runs',
    'schedules_webhook_max_concurrent_runs_limit',
    'schedules_webhook_project_max_concurrent_runs',
    'schedules_webhook_max_waiting_runs',
  ],
};
