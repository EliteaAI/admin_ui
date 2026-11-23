import BudgetsIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import AssignmentIcon from '@mui/icons-material/AssignmentOutlined';
import FactCheckIcon from '@mui/icons-material/FactCheckOutlined';
import FolderIcon from '@mui/icons-material/FolderOutlined';
import GovernanceIcon from '@mui/icons-material/GppGoodOutlined';
import GroupsIcon from '@mui/icons-material/GroupsOutlined';
import HistoryIcon from '@mui/icons-material/HistoryOutlined';
import LockIcon from '@mui/icons-material/LockOutlined';
import ManageAccountsIcon from '@mui/icons-material/ManageAccountsOutlined';
import ModelTrainingIcon from '@mui/icons-material/ModelTrainingOutlined';
import PeopleIcon from '@mui/icons-material/PeopleOutline';
import PersonSearchIcon from '@mui/icons-material/PersonSearchOutlined';
import PriceChangeIcon from '@mui/icons-material/PriceChangeOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import ScheduleIcon from '@mui/icons-material/ScheduleOutlined';
import SecurityIcon from '@mui/icons-material/SecurityOutlined';
import SettingsIcon from '@mui/icons-material/SettingsOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import TuneIcon from '@mui/icons-material/TuneOutlined';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';

import { RouteDefinitions } from '@/constants/routes.constants';

// An item id equals its SIDEBAR_PERMISSIONS key and its route segment: the highlight compares the id with the
// last URL segment. `testId` overrides the id in `sidebar-<testId>-item` when the two differ.
export const MENU_GROUPS = [
  {
    id: 'people-access',
    label: 'People & Access',
    items: [
      { id: 'users', label: 'Users', icon: PeopleIcon, url: RouteDefinitions.Users },
      { id: 'projects', label: 'Projects', icon: FolderIcon, url: RouteDefinitions.Projects },
      { id: 'roles', label: 'Roles', icon: ManageAccountsIcon, url: RouteDefinitions.Roles },
      { id: 'app-requests', label: 'App Requests', icon: AssignmentIcon, url: RouteDefinitions.AppRequests },
    ],
  },
  {
    id: 'security',
    label: 'Security',
    items: [
      { id: 'secrets', label: 'Secrets', icon: VpnKeyOutlinedIcon, url: RouteDefinitions.Secrets },
      { id: 'authentication', label: 'Authentication', icon: LockIcon, url: RouteDefinitions.Authentication },
      {
        id: 'scim-provisioning',
        label: 'SCIM Provisioning',
        icon: GroupsIcon,
        url: RouteDefinitions.ScimProvisioning,
      },
      { id: 'guardrails', label: 'Guardrails', icon: SecurityIcon, url: RouteDefinitions.Guardrails },
      { id: 'governance', label: 'Governance', icon: GovernanceIcon, url: RouteDefinitions.Governance },
    ],
  },
  {
    id: 'agent-evaluation',
    label: 'Agent Evaluation',
    items: [
      {
        id: 'agent-evaluation',
        testId: 'evaluation',
        label: 'Evaluation',
        icon: FactCheckIcon,
        url: RouteDefinitions.AgentEvaluation,
      },
      {
        id: 'platform-dimensions',
        testId: 'dimensions',
        label: 'Dimensions',
        icon: RuleOutlinedIcon,
        url: RouteDefinitions.PlatformDimensions,
      },
    ],
  },
  {
    id: 'cost-usage',
    label: 'Cost & Usage',
    items: [
      { id: 'budgets', label: 'Budgets', icon: BudgetsIcon, url: RouteDefinitions.Budgets },
      { id: 'litellm', label: 'LiteLLM', icon: ModelTrainingIcon, url: RouteDefinitions.LiteLLM },
      { id: 'model-prices', label: 'Model Prices', icon: PriceChangeIcon, url: RouteDefinitions.ModelPrices },
    ],
  },
  {
    id: 'monitoring-audit',
    label: 'Monitoring & Audit',
    items: [
      {
        id: 'audit',
        testId: 'membership-audit',
        label: 'Membership Audit',
        icon: PersonSearchIcon,
        url: RouteDefinitions.LifecycleAudit,
      },
      { id: 'audit-trail', label: 'Audit Trail', icon: HistoryIcon, url: RouteDefinitions.AuditTrail },
      {
        id: 'reports',
        testId: 'survey-reports',
        label: 'Survey Reports',
        icon: SummarizeOutlinedIcon,
        url: RouteDefinitions.Reports,
      },
    ],
  },
  {
    id: 'features',
    label: 'Features',
    items: [{ id: 'features', label: 'Features', icon: TuneIcon, url: RouteDefinitions.Features }],
  },
  {
    id: 'administration',
    label: 'Administration',
    items: [
      {
        id: 'configuration',
        label: 'Configuration',
        icon: SettingsIcon,
        url: RouteDefinitions.Configuration,
      },
      {
        id: 'schedules-tasks',
        testId: 'system-tasks',
        label: 'System Tasks',
        icon: ScheduleIcon,
        url: RouteDefinitions.SchedulesTasks,
      },
    ],
  },
];
