import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import ChatBubbleOutlineOutlinedIcon from '@mui/icons-material/ChatBubbleOutlineOutlined';
import ExtensionIcon from '@mui/icons-material/ExtensionOutlined';
import MenuBookIcon from '@mui/icons-material/MenuBookOutlined';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import PollOutlinedIcon from '@mui/icons-material/PollOutlined';
import PublishIcon from '@mui/icons-material/PublishOutlined';
import SupportAgentIcon from '@mui/icons-material/SupportAgentOutlined';

// Features sub-navigation, in display order. backendSectionIds lists every config section a page
// edits: the page-level Save sends one request per section with unsaved changes. selfSaving pages
// own their save flow and hide the shared action bar.
export const FEATURES_SECTIONS = [
  {
    id: 'mcp_configuration',
    title: 'MCP Configuration',
    icon: ExtensionIcon,
    backendSectionIds: ['guardrails'],
  },
  {
    id: 'chat_configuration',
    title: 'Chat Configuration',
    icon: ChatBubbleOutlineOutlinedIcon,
    backendSectionIds: ['voice_features', 'chat_mentions', 'guardrails'],
  },
  {
    id: 'support_assistant',
    title: 'Support Assistant',
    icon: SupportAgentIcon,
    backendSectionIds: ['support_assistant'],
  },
  {
    id: 'publishing',
    title: 'Publishing',
    icon: PublishIcon,
    backendSectionIds: ['guardrails'],
  },
  {
    id: 'cost_budgets',
    title: 'Cost Budgets',
    icon: AccountBalanceWalletOutlinedIcon,
    backendSectionIds: ['cost_budgets'],
  },
  {
    id: 'help_center',
    title: 'Help Center',
    icon: MenuBookIcon,
    backendSectionIds: ['resources'],
  },
  {
    id: 'surveys',
    title: 'Surveys',
    icon: PollOutlinedIcon,
    backendSectionIds: [],
    selfSaving: true,
  },
  {
    id: 'custom_theme',
    title: 'Custom Theme',
    icon: PaletteOutlinedIcon,
    backendSectionIds: [],
    selfSaving: true,
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
  agent_publishing: { page: 'publishing', block: 'agent_publishing' },
  skill_publishing: { page: 'publishing', block: 'skill_publishing' },
  model_prices_source: { page: 'cost_budgets', block: 'model_prices_source' },
};
