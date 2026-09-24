import AssignmentOutlined from '@mui/icons-material/AssignmentOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BuildOutlined from '@mui/icons-material/BuildOutlined';
import CableOutlined from '@mui/icons-material/CableOutlined';
import HelpOutlineOutlined from '@mui/icons-material/HelpOutlineOutlined';
import HttpOutlined from '@mui/icons-material/HttpOutlined';
import PowerSettingsNewOutlined from '@mui/icons-material/PowerSettingsNewOutlined';
import ScheduleOutlined from '@mui/icons-material/ScheduleOutlined';
import SmartToyOutlined from '@mui/icons-material/SmartToyOutlined';
import SyncAltOutlined from '@mui/icons-material/SyncAltOutlined';

export const AUDIT_PAGE_SIZE_OPTIONS = [20, 50, 100];

// `colorKey` points into `palette.auditEvent`
export const EVENT_TYPE_CONFIG = {
  api: { icon: HttpOutlined, colorKey: 'api', label: 'API' },
  socketio: { icon: CableOutlined, colorKey: 'socketio', label: 'Socket.IO' },
  rpc: { icon: SyncAltOutlined, colorKey: 'rpc', label: 'RPC' },
  agent: { icon: SmartToyOutlined, colorKey: 'agent', label: 'Agent' },
  tool: { icon: BuildOutlined, colorKey: 'tool', label: 'Tool' },
  llm: { icon: AutoAwesomeOutlined, colorKey: 'llm', label: 'LLM' },
  schedule: { icon: ScheduleOutlined, colorKey: 'schedule', label: 'Schedule' },
  admin_task: { icon: AssignmentOutlined, colorKey: 'admin_task', label: 'Admin Task' },
  lifecycle: { icon: PowerSettingsNewOutlined, colorKey: 'lifecycle', label: 'Lifecycle' },
};

export const DEFAULT_EVENT_CONFIG = {
  icon: HelpOutlineOutlined,
  colorKey: 'unknown',
  label: 'Unknown',
};

export const HEATMAP_MAX_TICK_LABELS = 15;

// Map band label → [durationMin, durationMax) in ms
// durationMax null means unbounded (>=10000)
export const BAND_DURATION_MAP = {
  '<10ms': [0, 10],
  '10-100ms': [10, 100],
  '100ms-1s': [100, 1000],
  '1-10s': [1000, 10000],
  '>10s': [10000, null],
};
