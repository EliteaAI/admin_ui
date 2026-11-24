import DnsOutlinedIcon from '@mui/icons-material/DnsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MemoryOutlinedIcon from '@mui/icons-material/MemoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';

// Card title and icon, keyed by pylon base name (the pylon id without its instance UUID)
export const PYLON_CARD_META = {
  pylon_auth: { title: 'Pylon Auth', icon: LockOutlinedIcon },
  pylon_indexer: { title: 'Pylon Indexer', icon: MemoryOutlinedIcon },
  pylon_main: { title: 'Pylon Main', icon: DnsOutlinedIcon },
};

// Pylons without a meta entry still get a card, titled with their base name
export const DEFAULT_PYLON_CARD_ICON = SettingsOutlinedIcon;

// fieldOrder lists setting titles. Listed settings come first in that order, and any other setting of the pylon
// follows in the order the backend returns it. Cards appear in the order declared here.
const RUNTIME_CARDS = [
  {
    pylon: 'pylon_indexer',
    fieldOrder: [
      'SDK Hot Reload',
      'Task Queue Debug',
      'Bound Oversized Tool Results',
      'Tool Result Limit (characters)',
      'Tool Result Limit Per Toolkit Type',
      'Bound MCP Response Bodies (wire cap)',
      'MCP Response Body Limit (bytes)',
      // #7716 does not place this setting; it goes last so the requested order of the others stays unchanged
      'Indexer Tasks',
    ],
  },
  { pylon: 'pylon_main', fieldOrder: [] },
];

const OBSERVABILITY_CARDS = [
  { pylon: 'pylon_auth', fieldOrder: ['Tracing', 'Audit Trail'] },
  { pylon: 'pylon_indexer', fieldOrder: ['Tracing', 'Audit Trail'] },
  { pylon: 'pylon_main', fieldOrder: ['Show Analytics', 'Tracing', 'Audit Trail'] },
];

export const PYLON_CARDS_BY_SECTION = {
  runtime: RUNTIME_CARDS,
  observability: OBSERVABILITY_CARDS,
};
