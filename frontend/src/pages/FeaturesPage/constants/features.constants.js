import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PublishIcon from '@mui/icons-material/PublishOutlined';
import ScheduleOutlinedIcon from '@mui/icons-material/ScheduleOutlined';
import WebhookOutlinedIcon from '@mui/icons-material/WebhookOutlined';

// Features sub-navigation, in display order. backendSectionIds lists every config section a page
// edits: the page-level Save sends one request per section with unsaved changes.
export const FEATURES_SECTIONS = [
  {
    id: 'chat_configuration',
    title: 'Chat',
    icon: ChatBubbleOutlineOutlinedIcon,
    backendSectionIds: ['voice_features', 'chat_mentions', 'guardrails'],
  },
  {
    id: 'skills',
    title: 'Skills',
    icon: AutoAwesomeOutlinedIcon,
    backendSectionIds: ['skills'],
  },
  {
    id: 'publishing',
    title: 'Publishing',
    icon: PublishIcon,
    backendSectionIds: ['guardrails'],
  },
  {
    id: 'mcp_configuration',
    title: 'MCPs',
    icon: ExtensionIcon,
    backendSectionIds: ['guardrails'],
  },
  {
    id: 'cost_budgets',
    title: 'Cost & Usage',
    icon: AccountBalanceWalletOutlinedIcon,
    backendSectionIds: ['cost_budgets', 'tool_spend', 'tool_pricing', 'Usage'],
  },
  {
    id: 'schedules',
    title: 'Schedules',
    icon: ScheduleOutlinedIcon,
    backendSectionIds: ['schedules'],
  },
  {
    id: 'webhooks',
    title: 'Webhooks',
    icon: WebhookOutlinedIcon,
    backendSectionIds: ['webhooks'],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    icon: NotificationsOutlinedIcon,
    backendSectionIds: ['notifications'],
  },
];

// Former standalone sections, now blocks inside a grouped page. Old #<id> links open the
// parent page with that block expanded.
export const LEGACY_SECTION_REDIRECTS = {
  auto_routing: { page: 'chat_configuration', block: 'auto_routing' },
  voice_features: { page: 'chat_configuration', block: 'voice_features' },
  chat_mentions: { page: 'chat_configuration', block: 'chat_mentions' },
  midturn_injection: { page: 'chat_configuration', block: 'midturn_injection' },
  next_input_suggestion: { page: 'chat_configuration', block: 'next_input_suggestion' },
  code_mode: { page: 'chat_configuration', block: 'code_mode' },
  agent_publishing: { page: 'publishing', block: 'agent_publishing' },
  skill_publishing: { page: 'publishing', block: 'skill_publishing' },
  model_prices_source: { page: 'cost_budgets', block: 'model_prices_source' },
  tool_spend: { page: 'cost_budgets', block: 'tool_spend' },
  tool_pricing: { page: 'cost_budgets', block: 'tool_spend' },
  // The Agent Evaluation card moved into Agent Schedules
  agent_evaluation: { page: 'schedules', block: 'agent_schedules' },
  // Blocks added to Cost & Usage
  usage_settings: { page: 'cost_budgets', block: 'usage_settings' },
  complexity_settings: { page: 'cost_budgets', block: 'complexity_settings' },
};

// Sections that moved to the Configuration page. Old #<id> links on /features open them there.
export const MOVED_TO_CONFIGURATION = {
  support_assistant: 'support_assistant',
  help_center: 'resources',
  surveys: 'surveys',
  custom_theme: 'custom_theme',
};
