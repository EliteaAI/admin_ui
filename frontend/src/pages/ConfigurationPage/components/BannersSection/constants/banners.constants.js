export const PLACEMENT_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'center', label: 'Center' },
  { value: 'bottom_right', label: 'Bottom-right corner' },
];

export const STYLE_OPTIONS = ['info', 'warning'];

// 'none' hides the icon in EliteaUI
export const ICON_OPTIONS = [
  { value: 'info', label: 'info' },
  { value: 'warning', label: 'warning' },
  { value: 'none', label: 'No icon' },
];

export const NEW_BANNER = {
  name: '',
  message: '',
  enabled: false,
  dismissible: true,
  persist_dismissal: true,
  placement: 'top',
  style: 'info',
  icon: 'info',
};
