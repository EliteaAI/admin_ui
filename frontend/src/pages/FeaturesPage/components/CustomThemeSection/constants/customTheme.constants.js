/**
 * Color category definitions for the Custom Theme editor.
 * All 505 palette token paths from EliteaUI darkPalette.js / lightPalette.js
 * organized into logical categories with human-readable labels.
 */
import AccountTreeOutlined from '@mui/icons-material/AccountTreeOutlined';
import ArrowDropDownCircleOutlined from '@mui/icons-material/ArrowDropDownCircleOutlined';
import AutoAwesomeOutlined from '@mui/icons-material/AutoAwesomeOutlined';
import BorderStyleOutlined from '@mui/icons-material/BorderStyleOutlined';
import CallSplitOutlined from '@mui/icons-material/CallSplitOutlined';
import CampaignOutlined from '@mui/icons-material/CampaignOutlined';
import ChatBubbleOutlineOutlined from '@mui/icons-material/ChatBubbleOutlineOutlined';
import CheckBoxOutlined from '@mui/icons-material/CheckBoxOutlined';
import CheckCircleOutlined from '@mui/icons-material/CheckCircleOutlined';
import CodeOutlined from '@mui/icons-material/CodeOutlined';
import CompareOutlined from '@mui/icons-material/CompareOutlined';
import CropSquareOutlined from '@mui/icons-material/CropSquareOutlined';
import DashboardOutlined from '@mui/icons-material/DashboardOutlined';
import ExtensionOutlined from '@mui/icons-material/ExtensionOutlined';
import FolderOutlined from '@mui/icons-material/FolderOutlined';
import HubOutlined from '@mui/icons-material/HubOutlined';
import InputOutlined from '@mui/icons-material/InputOutlined';
import InsertEmoticonOutlined from '@mui/icons-material/InsertEmoticonOutlined';
import LabelOutlined from '@mui/icons-material/LabelOutlined';
import LightbulbOutlined from '@mui/icons-material/LightbulbOutlined';
import MoreHorizOutlined from '@mui/icons-material/MoreHorizOutlined';
import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import PaletteOutlined from '@mui/icons-material/PaletteOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import PlaylistPlayOutlined from '@mui/icons-material/PlaylistPlayOutlined';
import PsychologyOutlined from '@mui/icons-material/PsychologyOutlined';
import PublishOutlined from '@mui/icons-material/PublishOutlined';
import SchoolOutlined from '@mui/icons-material/SchoolOutlined';
import SmartButtonOutlined from '@mui/icons-material/SmartButtonOutlined';
import SpeakerNotesOutlined from '@mui/icons-material/SpeakerNotesOutlined';
import StyleOutlined from '@mui/icons-material/StyleOutlined';
import TableChartOutlined from '@mui/icons-material/TableChartOutlined';
import TextFieldsOutlined from '@mui/icons-material/TextFieldsOutlined';
import ThumbUpAltOutlined from '@mui/icons-material/ThumbUpAltOutlined';
import TipsAndUpdatesOutlined from '@mui/icons-material/TipsAndUpdatesOutlined';
import ToggleOnOutlined from '@mui/icons-material/ToggleOnOutlined';
import TourOutlined from '@mui/icons-material/TourOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import ViewInArOutlined from '@mui/icons-material/ViewInArOutlined';
import ViewSidebarOutlined from '@mui/icons-material/ViewSidebarOutlined';
import WallpaperOutlined from '@mui/icons-material/WallpaperOutlined';
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined';
import WebOutlined from '@mui/icons-material/WebOutlined';

export const COLOR_CATEGORIES = [
  {
    id: 'primary',
    title: 'Primary Colors',
    icon: PaletteOutlined,
    description: 'Main accent colors used throughout the application',
    colors: [
      {
        key: 'primary.main',
        label: 'Primary Main',
        hint: 'Primary brand color used for buttons, links, and highlights',
      },
      {
        key: 'secondary.main',
        label: 'Secondary Main',
        hint: 'Secondary accent color for alternative highlights',
      },
    ],
  },
  {
    id: 'background',
    title: 'Background Colors',
    icon: WallpaperOutlined,
    description: 'Page backgrounds, cards, panels, and surface colors',
    colors: [
      {
        key: 'background.wrong',
        label: 'Wrong Background',
        hint: 'Background for incorrect/error states',
      },
      {
        key: 'background.error',
        label: 'Error Background',
        hint: 'Background for error states',
      },
      {
        key: 'background.warning',
        label: 'Warning Background',
        hint: 'Background for warning states',
      },
      {
        key: 'background.attention',
        label: 'Attention Background',
        hint: 'Background for attention-grabbing elements',
      },
      {
        key: 'background.avatar',
        label: 'Avatar Background',
        hint: 'Default avatar background color',
      },
      {
        key: 'background.default.primary',
        label: 'Primary Background',
        hint: 'Main page background color',
      },
      {
        key: 'background.default.secondary',
        label: 'Secondary Background',
        hint: 'Card and panel background color',
      },
      {
        key: 'background.default.tertiary',
        label: 'Tertiary Background',
        hint: 'Alternative panel background',
      },
      {
        key: 'background.surface.default',
        label: 'Default Surface Background',
        hint: 'Default background for content surfaces',
      },
      {
        key: 'background.surface.secondary',
        label: 'Secondary Surface Background',
        hint: 'Secondary background for content surfaces',
      },
      {
        key: 'background.panel',
        label: 'Panel Background',
        hint: 'Side panels and drawers',
      },
      {
        key: 'background.surface.interactive.default',
        label: 'Interactive Surface Default',
        hint: 'Default state for interactive surfaces',
      },
      {
        key: 'background.surface.interactive.active',
        label: 'Interactive Surface Active',
        hint: 'Active state for interactive surfaces',
      },
      {
        key: 'background.surface.interactive.selected',
        label: 'Interactive Surface Selected',
        hint: 'Selected state for interactive surfaces',
      },
      {
        key: 'background.surface.interactive.dragging',
        label: 'Interactive Surface Dragging',
        hint: 'Dragging state for interactive surfaces',
      },
      {
        key: 'background.interactiveItem.hover',
        label: 'Interactive Item Hover',
        hint: 'Hover state for interactive items',
      },
      {
        key: 'background.interactiveItem.rowHover',
        label: 'Row Hover',
        hint: 'Table and list row hover background',
      },
      {
        key: 'background.interactiveItem.active',
        label: 'Interactive Item Active',
        hint: 'Active state for interactive items',
      },
      {
        key: 'background.selectedItem.default',
        label: 'Selected Item Default',
        hint: 'Default selected item background',
      },
      {
        key: 'background.selectedItem.hover',
        label: 'Selected Item Hover',
        hint: 'Hover state for selected items',
      },
      {
        key: 'background.tooltip',
        label: 'Tooltip Background',
        hint: 'Tooltip popup background',
      },
      {
        key: 'background.aiAnswer',
        label: 'AI Answer Background',
        hint: 'Background for AI response messages',
      },
      {
        key: 'background.badge',
        label: 'Badge Background',
        hint: 'Badge and chip backgrounds',
      },
    ],
  },
  {
    id: 'border',
    title: 'Border Colors',
    icon: BorderStyleOutlined,
    description: 'Lines, dividers, and outlines',
    colors: [
      {
        key: 'border.default',
        label: 'Default Border',
        hint: 'Standard border color',
      },
      {
        key: 'border.lines',
        label: 'Lines',
        hint: 'Divider and separator lines',
      },
      {
        key: 'border.subtle',
        label: 'Subtle Border',
        hint: 'Very light border for subtle separation',
      },
      {
        key: 'border.cardGradient',
        label: 'Card Gradient Border',
        hint: 'Gradient border for cards',
      },
      {
        key: 'border.hover',
        label: 'Hover Border',
        hint: 'Border color on hover state',
      },
      {
        key: 'border.inputHover',
        label: 'Input Hover Border',
        hint: 'Input field border on hover',
      },
      {
        key: 'border.tips',
        label: 'Tips Border',
        hint: 'Border for tip/hint boxes',
      },
      {
        key: 'border.attention',
        label: 'Attention Border',
        hint: 'Border color for attention-grabbing elements',
      },
      {
        key: 'border.error',
        label: 'Error Border',
        hint: 'Border color for error states',
      },
    ],
  },
  {
    id: 'boxShadow',
    title: 'Box Shadows',
    icon: StyleOutlined,
    description: 'Shadow effects for depth and elevation',
    colors: [
      {
        key: 'boxShadow.default',
        label: 'Default Shadow',
        hint: 'Standard box shadow',
      },
      {
        key: 'boxShadow.onboarding',
        label: 'Onboarding Shadow',
        hint: 'Shadow for onboarding elements',
      },
      {
        key: 'boxShadow.listbox',
        label: 'Listbox Shadow',
        hint: 'Shadow for dropdown listboxes',
      },
      {
        key: 'boxShadow.aiAnswer',
        label: 'AI Answer Shadow',
        hint: 'Shadow for AI response cards',
      },
      {
        key: 'boxShadow.dialog',
        label: 'Dialog Shadow',
        hint: 'Shadow for dialog modals',
      },
    ],
  },
  {
    id: 'text',
    title: 'Text Colors',
    icon: TextFieldsOutlined,
    description: 'Typography and text content colors',
    colors: [
      {
        key: 'text.primary',
        label: 'Primary Text',
        hint: 'Main text color for headings and body text',
      },
      {
        key: 'text.secondary',
        label: 'Secondary Text',
        hint: 'Secondary text for descriptions and hints',
      },
      {
        key: 'text.error',
        label: 'Error Text',
        hint: 'Error message text color',
      },
      {
        key: 'text.info',
        label: 'Info Text',
        hint: 'Informational text color',
      },
      {
        key: 'text.tips',
        label: 'Tips Text',
        hint: 'Tips and hints text color',
      },
      {
        key: 'text.attention',
        label: 'Attention Text',
        hint: 'Attention-grabbing text color',
      },
      {
        key: 'text.metrics',
        label: 'Metrics Text',
        hint: 'Metrics and statistics text color',
      },
      {
        key: 'text.subtle',
        label: 'Subtle Text',
        hint: 'Very light text for minimal emphasis',
      },
      {
        key: 'text.muted',
        label: 'Muted Text',
        hint: 'Subdued text color for less important content',
      },
      {
        key: 'text.warning',
        label: 'Warning Text',
        hint: 'Warning message text color',
      },
      {
        key: 'text.accent',
        label: 'Accent Text',
        hint: 'Accent color for emphasized text',
      },
      { key: 'text.link', label: 'Link Text', hint: 'Hyperlink text color' },
      {
        key: 'text.visitedLink',
        label: 'Visited Link',
        hint: 'Visited hyperlink color',
      },
      {
        key: 'text.alwaysWhite',
        label: 'Always White',
        hint: 'Text that stays white regardless of theme',
      },
      {
        key: 'text.alwaysDark',
        label: 'Always Dark',
        hint: 'Text that stays dark regardless of theme',
      },
      {
        key: 'text.showMore',
        label: 'Show More Text',
        hint: 'Show more/less link color',
      },
      {
        key: 'text.tooltip',
        label: 'Tooltip Text',
        hint: 'Tooltip text color',
      },
    ],
  },
  {
    id: 'alert',
    title: 'Alert Colors',
    icon: NotificationsOutlined,
    description: 'Alert and notification styles',
    colors: [
      {
        key: 'alert.info.icon',
        label: 'Info Alert Icon',
        hint: 'Info alert icon color',
      },
      {
        key: 'alert.info.background',
        label: 'Info Alert Background',
        hint: 'Info alert background',
      },
      {
        key: 'alert.info.border',
        label: 'Info Alert Border',
        hint: 'Info alert border',
      },
      {
        key: 'alert.info.text',
        label: 'Info Alert Text',
        hint: 'Info alert text color',
      },
      {
        key: 'alert.success.icon',
        label: 'Success Alert Icon',
        hint: 'Success alert icon color',
      },
      {
        key: 'alert.success.background',
        label: 'Success Alert Background',
        hint: 'Success alert background',
      },
      {
        key: 'alert.success.border',
        label: 'Success Alert Border',
        hint: 'Success alert border',
      },
      {
        key: 'alert.success.text',
        label: 'Success Alert Text',
        hint: 'Success alert text color',
      },
      {
        key: 'alert.warning.icon',
        label: 'Warning Alert Icon',
        hint: 'Warning alert icon color',
      },
      {
        key: 'alert.warning.background',
        label: 'Warning Alert Background',
        hint: 'Warning alert background',
      },
      {
        key: 'alert.warning.border',
        label: 'Warning Alert Border',
        hint: 'Warning alert border',
      },
      {
        key: 'alert.warning.text',
        label: 'Warning Alert Text',
        hint: 'Warning alert text color',
      },
      {
        key: 'alert.error.icon',
        label: 'Error Alert Icon',
        hint: 'Error alert icon color',
      },
      {
        key: 'alert.error.background',
        label: 'Error Alert Background',
        hint: 'Error alert background',
      },
      {
        key: 'alert.error.border',
        label: 'Error Alert Border',
        hint: 'Error alert border',
      },
      {
        key: 'alert.error.text',
        label: 'Error Alert Text',
        hint: 'Error alert text color',
      },
      {
        key: 'alert.secondary.background',
        label: 'Secondary Alert Background',
        hint: 'Secondary alert background',
      },
    ],
  },
  {
    id: 'icon',
    title: 'Icon Colors',
    icon: InsertEmoticonOutlined,
    description: 'Icon fills and strokes',
    colors: [
      {
        key: 'icon.default',
        label: 'Default Icon',
        hint: 'Standard icon color',
      },
      {
        key: 'icon.primary',
        label: 'Primary Icon',
        hint: 'Primary accent icon color',
      },
      {
        key: 'icon.secondary',
        label: 'Secondary Icon',
        hint: 'Secondary icon color',
      },
      { key: 'icon.send', label: 'Send Icon', hint: 'Send button icon color' },
      {
        key: 'icon.trophy',
        label: 'Trophy Icon',
        hint: 'Trophy/achievement icon color',
      },
      { key: 'icon.subtle', label: 'Subtle Icon', hint: 'Subdued icon color' },
      { key: 'icon.tips', label: 'Tips Icon', hint: 'Tips icon color' },
      {
        key: 'icon.successModal',
        label: 'Success Modal Icon',
        hint: 'Success modal icon color',
      },
      {
        key: 'icon.disabled',
        label: 'Disabled Icon',
        hint: 'Disabled state icon color',
      },
      {
        key: 'icon.attention',
        label: 'Attention Icon',
        hint: 'Attention-grabbing icon color',
      },
      {
        key: 'icon.warning',
        label: 'Warning Icon',
        hint: 'Warning state icon color',
      },
      {
        key: 'icon.highTier',
        label: 'High Tier Icon',
        hint: 'High tier/premium icon color',
      },
      {
        key: 'icon.success',
        label: 'Success Icon',
        hint: 'Success state icon color',
      },
      {
        key: 'icon.active',
        label: 'Active Icon',
        hint: 'Active state icon color',
      },
      {
        key: 'icon.inactive',
        label: 'Inactive Icon',
        hint: 'Inactive state icon color',
      },
      {
        key: 'icon.magicAssistant',
        label: 'Magic Assistant Icon',
        hint: 'AI assistant icon color',
      },
      {
        key: 'icon.error',
        label: 'Error Icon',
        hint: 'Error state icon color',
      },
      {
        key: 'icon.delete',
        label: 'Delete Icon',
        hint: 'Delete action icon color',
      },
      { key: 'icon.info', label: 'Info Icon', hint: 'Information icon color' },
      {
        key: 'icon.warningHigh',
        label: 'High Warning Icon',
        hint: 'High-priority warning icon',
      },
      { key: 'icon.accent', label: 'Accent Icon', hint: 'Accent colored icon' },
      {
        key: 'icon.onPrimary',
        label: 'On Primary Icon',
        hint: 'Icon on primary colored background',
      },
      {
        key: 'icon.indexResult.success',
        label: 'Index Success Icon',
        hint: 'Index result success icon',
      },
      {
        key: 'icon.indexResult.error',
        label: 'Index Error Icon',
        hint: 'Index result error icon',
      },
      {
        key: 'icon.indexResult.warning',
        label: 'Index Warning Icon',
        hint: 'Index result warning icon',
      },
      {
        key: 'icon.indexResult.info',
        label: 'Index Info Icon',
        hint: 'Index result info icon',
      },
    ],
  },
  {
    id: 'status',
    title: 'Status Colors',
    icon: CheckCircleOutlined,
    description: 'Success, error, warning, and info states',
    colors: [
      {
        key: 'status.draft',
        label: 'Draft Status',
        hint: 'Draft state indicator',
      },
      {
        key: 'status.onModeration',
        label: 'On Moderation',
        hint: 'Pending moderation indicator',
      },
      {
        key: 'status.warningText',
        label: 'Warning Status Text',
        hint: 'Warning status text color',
      },
      {
        key: 'status.published',
        label: 'Published Status',
        hint: 'Published state indicator',
      },
      {
        key: 'status.publishedIcon',
        label: 'Published Icon',
        hint: 'Published state icon color',
      },
      {
        key: 'status.publishedBackground',
        label: 'Published Background',
        hint: 'Published state background',
      },
      {
        key: 'status.publishedText',
        label: 'Published Text',
        hint: 'Published state text color',
      },
      {
        key: 'status.publishedBorder',
        label: 'Published Border',
        hint: 'Published state border color',
      },
      {
        key: 'status.rejected',
        label: 'Rejected Status',
        hint: 'Rejected state indicator',
      },
      {
        key: 'status.rejectedText',
        label: 'Rejected Text',
        hint: 'Rejected state text color',
      },
      {
        key: 'status.userApproval',
        label: 'User Approval',
        hint: 'User approval status color',
      },
    ],
  },
  {
    id: 'warning',
    title: 'Warning Colors',
    icon: WarningAmberOutlined,
    description: 'Warning severity colors',
    colors: [
      {
        key: 'warning.main',
        label: 'Warning Main',
        hint: 'Main warning color',
      },
      {
        key: 'warning.high',
        label: 'Warning High',
        hint: 'High-priority warning color',
      },
    ],
  },
  {
    id: 'diff',
    title: 'Diff Colors',
    icon: CompareOutlined,
    description: 'Code diff highlighting',
    colors: [
      {
        key: 'diff.removed',
        label: 'Diff Removed',
        hint: 'Removed content in diffs',
      },
      {
        key: 'diff.added',
        label: 'Diff Added',
        hint: 'Added content in diffs',
      },
    ],
  },
  {
    id: 'scrollbar',
    title: 'Scrollbar Colors',
    icon: TuneOutlined,
    description: 'Custom scrollbar styling',
    colors: [
      {
        key: 'scrollbar.thumb',
        label: 'Scrollbar Thumb',
        hint: 'Scrollbar handle color',
      },
      {
        key: 'scrollbar.thumbHover',
        label: 'Scrollbar Thumb Hover',
        hint: 'Scrollbar handle hover color',
      },
    ],
  },
  {
    id: 'components-toast',
    title: 'Toast Components',
    icon: NotificationsOutlined,
    description: 'Toast notification colors',
    colors: [
      {
        key: 'components.toast.success.background',
        label: 'Toast Success Background',
        hint: 'Success toast background',
      },
      {
        key: 'components.toast.success.color',
        label: 'Toast Success Text',
        hint: 'Success toast text color',
      },
      {
        key: 'components.toast.error.background',
        label: 'Toast Error Background',
        hint: 'Error toast background',
      },
      {
        key: 'components.toast.error.color',
        label: 'Toast Error Text',
        hint: 'Error toast text color',
      },
      {
        key: 'components.toast.info.background',
        label: 'Toast Info Background',
        hint: 'Info toast background',
      },
      {
        key: 'components.toast.info.color',
        label: 'Toast Info Text',
        hint: 'Info toast text color',
      },
      {
        key: 'components.toast.warning.background',
        label: 'Toast Warning Background',
        hint: 'Warning toast background',
      },
      {
        key: 'components.toast.warning.color',
        label: 'Toast Warning Text',
        hint: 'Warning toast text color',
      },
    ],
  },
  {
    id: 'components-card',
    title: 'Card Components',
    icon: DashboardOutlined,
    description: 'Card styling colors',
    colors: [
      {
        key: 'components.card.background.default',
        label: 'Card Background Default',
        hint: 'Default card background',
      },
      {
        key: 'components.card.background.hover',
        label: 'Card Background Hover',
        hint: 'Card background on hover',
      },
      {
        key: 'components.card.background.highlighted',
        label: 'Card Background Highlighted',
        hint: 'Highlighted card background',
      },
      {
        key: 'components.card.background.gradient',
        label: 'Card Background Gradient',
        hint: 'Card gradient background',
      },
      {
        key: 'components.card.background.borderGradient',
        label: 'Card Border Gradient',
        hint: 'Card border gradient',
      },
      {
        key: 'components.card.background.hoverBorderGradient',
        label: 'Card Hover Border Gradient',
        hint: 'Card hover border gradient',
      },
      {
        key: 'components.card.shadow.hover',
        label: 'Card Shadow Hover',
        hint: 'Card hover shadow',
      },
    ],
  },
  {
    id: 'components-button',
    title: 'Button Components',
    icon: SmartButtonOutlined,
    description: 'Button styling colors',
    colors: [
      {
        key: 'components.button.background.default',
        label: 'Button Default Background',
        hint: 'Default button background',
      },
      {
        key: 'components.button.background.normal',
        label: 'Button Normal Background',
        hint: 'Normal button background',
      },
      {
        key: 'components.button.background.danger',
        label: 'Button Danger Background',
        hint: 'Danger/delete button background',
      },
      {
        key: 'components.button.background.primary.default',
        label: 'Primary Button Default',
        hint: 'Primary button default state',
      },
      {
        key: 'components.button.background.primary.hover',
        label: 'Primary Button Hover',
        hint: 'Primary button hover state',
      },
      {
        key: 'components.button.background.primary.pressed',
        label: 'Primary Button Pressed',
        hint: 'Primary button pressed state',
      },
      {
        key: 'components.button.background.primary.disabled',
        label: 'Primary Button Disabled',
        hint: 'Primary button disabled state',
      },
      {
        key: 'components.button.background.maxi.default',
        label: 'Maxi Button Default',
        hint: 'Maxi button default state',
      },
      {
        key: 'components.button.background.maxi.hover',
        label: 'Maxi Button Hover',
        hint: 'Maxi button hover state',
      },
      {
        key: 'components.button.background.maxi.pressed',
        label: 'Maxi Button Pressed',
        hint: 'Maxi button pressed state',
      },
      {
        key: 'components.button.background.secondary.default',
        label: 'Secondary Button Default',
        hint: 'Secondary button default state',
      },
      {
        key: 'components.button.background.secondary.hover',
        label: 'Secondary Button Hover',
        hint: 'Secondary button hover state',
      },
      {
        key: 'components.button.background.secondary.pressed',
        label: 'Secondary Button Pressed',
        hint: 'Secondary button pressed state',
      },
      {
        key: 'components.button.background.secondary.disabled',
        label: 'Secondary Button Disabled',
        hint: 'Secondary button disabled state',
      },
      {
        key: 'components.button.background.tertiary.hover',
        label: 'Tertiary Button Hover',
        hint: 'Tertiary button hover state',
      },
      {
        key: 'components.button.background.tertiary.pressed',
        label: 'Tertiary Button Pressed',
        hint: 'Tertiary button pressed state',
      },
      {
        key: 'components.button.background.alarm.default',
        label: 'Alarm Button Default',
        hint: 'Alarm button default state',
      },
      {
        key: 'components.button.background.alarm.hover',
        label: 'Alarm Button Hover',
        hint: 'Alarm button hover state',
      },
      {
        key: 'components.button.background.alarm.pressed',
        label: 'Alarm Button Pressed',
        hint: 'Alarm button pressed state',
      },
      {
        key: 'components.button.background.alarm.disabled',
        label: 'Alarm Button Disabled',
        hint: 'Alarm button disabled state',
      },
      {
        key: 'components.button.background.drawerMenu.default',
        label: 'Drawer Menu Default',
        hint: 'Drawer menu button default',
      },
      {
        key: 'components.button.background.drawerMenu.hover',
        label: 'Drawer Menu Hover',
        hint: 'Drawer menu button hover',
      },
      {
        key: 'components.button.background.drawerMenu.selected',
        label: 'Drawer Menu Selected',
        hint: 'Drawer menu button selected',
      },
      {
        key: 'components.button.background.iconLabelButton.default',
        label: 'Icon Label Button Default',
        hint: 'Icon label button default',
      },
      {
        key: 'components.button.background.iconLabelButton.hover',
        label: 'Icon Label Button Hover',
        hint: 'Icon label button hover',
      },
      {
        key: 'components.button.background.iconLabelButton.selected',
        label: 'Icon Label Button Selected',
        hint: 'Icon label button selected',
      },
      {
        key: 'components.button.background.iconLabelButton.disabled',
        label: 'Icon Label Button Disabled',
        hint: 'Icon label button disabled',
      },
      {
        key: 'components.button.background.neutral.default',
        label: 'Neutral Button Default',
        hint: 'Neutral button default state',
      },
      {
        key: 'components.button.background.neutral.hover',
        label: 'Neutral Button Hover',
        hint: 'Neutral button hover state',
      },
      {
        key: 'components.button.background.neutral.pressed',
        label: 'Neutral Button Pressed',
        hint: 'Neutral button pressed state',
      },
      {
        key: 'components.button.background.neutral.disabled',
        label: 'Neutral Button Disabled',
        hint: 'Neutral button disabled state',
      },
      {
        key: 'components.button.background.positive.default',
        label: 'Positive Button Default',
        hint: 'Positive button default state',
      },
      {
        key: 'components.button.background.positive.hover',
        label: 'Positive Button Hover',
        hint: 'Positive button hover state',
      },
      {
        key: 'components.button.background.positive.pressed',
        label: 'Positive Button Pressed',
        hint: 'Positive button pressed state',
      },
      {
        key: 'components.button.background.positive.disabled',
        label: 'Positive Button Disabled',
        hint: 'Positive button disabled state',
      },
      {
        key: 'components.button.background.magicAssistant',
        label: 'Magic Assistant Button',
        hint: 'AI assistant button background',
      },
      {
        key: 'components.button.background.split.default',
        label: 'Split Button Default',
        hint: 'Split button default state',
      },
      {
        key: 'components.button.background.split.hover',
        label: 'Split Button Hover',
        hint: 'Split button hover state',
      },
      {
        key: 'components.button.background.split.pressed',
        label: 'Split Button Pressed',
        hint: 'Split button pressed state',
      },
      {
        key: 'components.button.text.primary',
        label: 'Button Primary Text',
        hint: 'Primary button text color',
      },
      {
        key: 'components.button.text.secondary',
        label: 'Button Secondary Text',
        hint: 'Secondary button text color',
      },
      {
        key: 'components.button.text.disabled',
        label: 'Button Disabled Text',
        hint: 'Disabled button text color',
      },
      {
        key: 'components.button.text.showMore',
        label: 'Button Show More Text',
        hint: 'Show more button text color',
      },
      {
        key: 'components.button.text.auxiliary',
        label: 'Button Auxiliary Text',
        hint: 'Auxiliary button text color',
      },
      {
        key: 'components.button.text.create',
        label: 'Button Create Text',
        hint: 'Create button text color',
      },
      {
        key: 'components.button.icon.default',
        label: 'Button Icon Default',
        hint: 'Default button icon color',
      },
      {
        key: 'components.button.icon.stateButton.default',
        label: 'State Button Icon Default',
        hint: 'State button icon default',
      },
      {
        key: 'components.button.icon.stateButton.hover',
        label: 'State Button Icon Hover',
        hint: 'State button icon hover',
      },
    ],
  },
  {
    id: 'components-tab',
    title: 'Tab Components',
    icon: ViewInArOutlined,
    description: 'Tab and tab group styling',
    colors: [
      {
        key: 'components.tabGroupButton.background.default',
        label: 'Tab Group Default',
        hint: 'Tab group button default',
      },
      {
        key: 'components.tabGroupButton.background.hover',
        label: 'Tab Group Hover',
        hint: 'Tab group button hover',
      },
      {
        key: 'components.tabGroupButton.background.active',
        label: 'Tab Group Active',
        hint: 'Tab group button active',
      },
      {
        key: 'components.tabGroupButton.background.disabled',
        label: 'Tab Group Disabled',
        hint: 'Tab group button disabled',
      },
      {
        key: 'components.tabGroupButton.text.default',
        label: 'Tab Group Text Default',
        hint: 'Tab group text default',
      },
      {
        key: 'components.tabGroupButton.text.hover',
        label: 'Tab Group Text Hover',
        hint: 'Tab group text hover',
      },
      {
        key: 'components.tabGroupButton.text.active',
        label: 'Tab Group Text Active',
        hint: 'Tab group text active',
      },
      {
        key: 'components.tabGroupButton.text.disabled',
        label: 'Tab Group Text Disabled',
        hint: 'Tab group text disabled',
      },
      {
        key: 'components.tab.background.default',
        label: 'Tab Default',
        hint: 'Tab default background',
      },
      {
        key: 'components.tab.background.hover',
        label: 'Tab Hover',
        hint: 'Tab hover background',
      },
      {
        key: 'components.tab.background.active',
        label: 'Tab Active',
        hint: 'Tab active background',
      },
      {
        key: 'components.tab.background.disabled',
        label: 'Tab Disabled',
        hint: 'Tab disabled background',
      },
      {
        key: 'components.tabs.default',
        label: 'Tabs Default',
        hint: 'Default tab indicator color',
      },
    ],
  },
  {
    id: 'components-chip',
    title: 'Chip & Tag Components',
    icon: LabelOutlined,
    description: 'Chips, tags, and category styling',
    colors: [
      {
        key: 'components.categoryTag.background.default',
        label: 'Category Tag Default',
        hint: 'Category tag default background',
      },
      {
        key: 'components.categoryTag.background.selected',
        label: 'Category Tag Selected',
        hint: 'Category tag selected background',
      },
      {
        key: 'components.categoryTag.text.default',
        label: 'Category Tag Text Default',
        hint: 'Category tag text default',
      },
      {
        key: 'components.categoryTag.text.selected',
        label: 'Category Tag Text Selected',
        hint: 'Category tag text selected',
      },
      {
        key: 'components.categoryTag.shadow',
        label: 'Category Tag Shadow',
        hint: 'Category tag shadow',
      },
      {
        key: 'components.styledChip.background.default',
        label: 'Styled Chip Default',
        hint: 'Styled chip default background',
      },
      {
        key: 'components.styledChip.background.hover',
        label: 'Styled Chip Hover',
        hint: 'Styled chip hover background',
      },
      {
        key: 'components.styledChip.background.active.default',
        label: 'Styled Chip Active Default',
        hint: 'Styled chip active default',
      },
      {
        key: 'components.styledChip.background.active.hover',
        label: 'Styled Chip Active Hover',
        hint: 'Styled chip active hover',
      },
      {
        key: 'components.styledChip.background.disabled',
        label: 'Styled Chip Disabled',
        hint: 'Styled chip disabled background',
      },
      {
        key: 'components.styledChip.text.default',
        label: 'Styled Chip Text Default',
        hint: 'Styled chip text default',
      },
      {
        key: 'components.styledChip.text.active',
        label: 'Styled Chip Text Active',
        hint: 'Styled chip text active',
      },
      {
        key: 'components.styledChip.text.disabled',
        label: 'Styled Chip Text Disabled',
        hint: 'Styled chip text disabled',
      },
      {
        key: 'components.styledChip.icon.default',
        label: 'Styled Chip Icon Default',
        hint: 'Styled chip icon default',
      },
      {
        key: 'components.styledChip.icon.hover',
        label: 'Styled Chip Icon Hover',
        hint: 'Styled chip icon hover',
      },
      {
        key: 'components.styledChip.icon.active',
        label: 'Styled Chip Icon Active',
        hint: 'Styled chip icon active',
      },
      {
        key: 'components.styledChip.icon.disabled',
        label: 'Styled Chip Icon Disabled',
        hint: 'Styled chip icon disabled',
      },
      {
        key: 'components.chip.background.warning',
        label: 'Chip Warning Background',
        hint: 'Warning chip background',
      },
      {
        key: 'components.chip.background.selected',
        label: 'Chip Selected Background',
        hint: 'Selected chip background',
      },
      {
        key: 'components.chip.background.default',
        label: 'Chip Default Background',
        hint: 'Default chip background',
      },
      {
        key: 'components.chipWithCheckIcon.background.default',
        label: 'Check Chip Default',
        hint: 'Check chip default background',
      },
      {
        key: 'components.chipWithCheckIcon.background.selected',
        label: 'Check Chip Selected',
        hint: 'Check chip selected background',
      },
      {
        key: 'components.chipWithCheckIcon.background.warning',
        label: 'Check Chip Warning',
        hint: 'Check chip warning background',
      },
      {
        key: 'components.chipWithCheckIcon.border.warning',
        label: 'Check Chip Warning Border',
        hint: 'Check chip warning border',
      },
      {
        key: 'components.chipWithCheckIcon.text.default',
        label: 'Check Chip Text Default',
        hint: 'Check chip text default',
      },
      {
        key: 'components.chipWithCheckIcon.text.disabled',
        label: 'Check Chip Text Disabled',
        hint: 'Check chip text disabled',
      },
      {
        key: 'components.autocompleteChip.background.default',
        label: 'Autocomplete Chip Default',
        hint: 'Autocomplete chip default',
      },
      {
        key: 'components.autocompleteChip.background.hover',
        label: 'Autocomplete Chip Hover',
        hint: 'Autocomplete chip hover',
      },
      {
        key: 'components.autocompleteChip.background.disabled',
        label: 'Autocomplete Chip Disabled',
        hint: 'Autocomplete chip disabled',
      },
      {
        key: 'components.autocompleteChip.text.default',
        label: 'Autocomplete Chip Text',
        hint: 'Autocomplete chip text',
      },
      {
        key: 'components.autocompleteChip.text.disabled',
        label: 'Autocomplete Chip Text Disabled',
        hint: 'Autocomplete chip text disabled',
      },
      {
        key: 'components.autocompleteChip.icon.default',
        label: 'Autocomplete Chip Icon',
        hint: 'Autocomplete chip icon',
      },
      {
        key: 'components.autocompleteChip.icon.hover',
        label: 'Autocomplete Chip Icon Hover',
        hint: 'Autocomplete chip icon hover',
      },
      {
        key: 'components.autocompleteChip.icon.disabled',
        label: 'Autocomplete Chip Icon Disabled',
        hint: 'Autocomplete chip icon disabled',
      },
    ],
  },
  {
    id: 'components-participant',
    title: 'Participant Components',
    icon: PersonOutlined,
    description: 'Participant and avatar styling',
    colors: [
      {
        key: 'components.participant.background.default',
        label: 'Participant Default',
        hint: 'Participant default background',
      },
      {
        key: 'components.participant.background.hover',
        label: 'Participant Hover',
        hint: 'Participant hover background',
      },
      {
        key: 'components.participant.background.active',
        label: 'Participant Active',
        hint: 'Participant active background',
      },
      {
        key: 'components.participant.background.cover',
        label: 'Participant Cover',
        hint: 'Participant cover background',
      },
      {
        key: 'components.participant.text.default',
        label: 'Participant Text',
        hint: 'Participant text color',
      },
    ],
  },
  {
    id: 'components-conversation',
    title: 'Conversation Components',
    icon: ChatBubbleOutlineOutlined,
    description: 'Chat and conversation styling',
    colors: [
      {
        key: 'components.conversation.background.normal',
        label: 'Conversation Normal',
        hint: 'Normal conversation background',
      },
      {
        key: 'components.conversation.background.hover',
        label: 'Conversation Hover',
        hint: 'Conversation hover background',
      },
      {
        key: 'components.conversation.background.selected',
        label: 'Conversation Selected',
        hint: 'Conversation selected background',
      },
      {
        key: 'components.conversation.background.editor',
        label: 'Conversation Editor',
        hint: 'Conversation editor background',
      },
      {
        key: 'components.conversation.background.topCover',
        label: 'Conversation Top Cover',
        hint: 'Conversation top cover gradient',
      },
      {
        key: 'components.conversation.background.bottomCover',
        label: 'Conversation Bottom Cover',
        hint: 'Conversation bottom cover gradient',
      },
      {
        key: 'components.conversation.background.starter.strong',
        label: 'Starter Strong',
        hint: 'Chat starter strong background',
      },
      {
        key: 'components.conversation.background.starter.subtle',
        label: 'Starter Subtle',
        hint: 'Chat starter subtle background',
      },
      {
        key: 'components.conversation.background.highlightUserMessage',
        label: 'Highlight User Message',
        hint: 'User message highlight background',
      },
      {
        key: 'components.conversation.border.itemDivider',
        label: 'Item Divider',
        hint: 'Conversation item divider',
      },
      {
        key: 'components.conversation.border.highlightUserMessage',
        label: 'Highlight Border',
        hint: 'User message highlight border',
      },
    ],
  },
  {
    id: 'components-folder',
    title: 'Folder Components',
    icon: FolderOutlined,
    description: 'Folder and directory styling',
    colors: [
      {
        key: 'components.folder.background.default',
        label: 'Folder Default',
        hint: 'Folder default background',
      },
      {
        key: 'components.folder.background.secondary',
        label: 'Folder Secondary',
        hint: 'Folder secondary background',
      },
      {
        key: 'components.folder.background.active',
        label: 'Folder Active',
        hint: 'Folder active background',
      },
      {
        key: 'components.folder.background.borderGradient',
        label: 'Folder Border Gradient',
        hint: 'Folder border gradient',
      },
      {
        key: 'components.folder.border.card',
        label: 'Folder Card Border',
        hint: 'Folder card border',
      },
      {
        key: 'components.folder.border.gradient',
        label: 'Folder Gradient Border',
        hint: 'Folder gradient border',
      },
      {
        key: 'components.folder.border.hover',
        label: 'Folder Hover Border',
        hint: 'Folder hover border',
      },
      {
        key: 'components.folder.border.active',
        label: 'Folder Active Border',
        hint: 'Folder active border',
      },
      {
        key: 'components.folder.shadow',
        label: 'Folder Shadow',
        hint: 'Folder shadow',
      },
    ],
  },
  {
    id: 'components-switch',
    title: 'Switch Components',
    icon: ToggleOnOutlined,
    description: 'Toggle switch styling',
    colors: [
      {
        key: 'components.switch.background.default.on.thumb',
        label: 'Switch On Thumb',
        hint: 'Switch on state thumb',
      },
      {
        key: 'components.switch.background.default.on.track',
        label: 'Switch On Track',
        hint: 'Switch on state track',
      },
      {
        key: 'components.switch.background.default.off.thumb',
        label: 'Switch Off Thumb',
        hint: 'Switch off state thumb',
      },
      {
        key: 'components.switch.background.default.off.track',
        label: 'Switch Off Track',
        hint: 'Switch off state track',
      },
      {
        key: 'components.switch.background.disabled.on.thumb',
        label: 'Switch Disabled On Thumb',
        hint: 'Disabled switch on thumb',
      },
      {
        key: 'components.switch.background.disabled.on.track',
        label: 'Switch Disabled On Track',
        hint: 'Disabled switch on track',
      },
      {
        key: 'components.switch.background.disabled.off.thumb',
        label: 'Switch Disabled Off Thumb',
        hint: 'Disabled switch off thumb',
      },
      {
        key: 'components.switch.background.disabled.off.track',
        label: 'Switch Disabled Off Track',
        hint: 'Disabled switch off track',
      },
    ],
  },
  {
    id: 'components-datagrid',
    title: 'DataGrid Components',
    icon: TableChartOutlined,
    description: 'Data grid and table styling',
    colors: [
      {
        key: 'components.dataGrid.background.main',
        label: 'DataGrid Main',
        hint: 'DataGrid main background',
      },
      {
        key: 'components.dataGrid.background.secondary',
        label: 'DataGrid Secondary',
        hint: 'DataGrid secondary background',
      },
      {
        key: 'components.dataGrid.background.row.selected',
        label: 'DataGrid Row Selected',
        hint: 'Selected row background',
      },
      {
        key: 'components.tableRow.background.default',
        label: 'Table Row Default',
        hint: 'Table row default background',
      },
      {
        key: 'components.tableRow.background.hover',
        label: 'Table Row Hover',
        hint: 'Table row hover background',
      },
      {
        key: 'components.table.border',
        label: 'Table Border',
        hint: 'Table border color',
      },
    ],
  },
  {
    id: 'components-input',
    title: 'Input Components',
    icon: TextFieldsOutlined,
    description: 'Input field styling',
    colors: [
      {
        key: 'components.input.text.label',
        label: 'Input Label',
        hint: 'Input label text color',
      },
      {
        key: 'components.input.text.primary',
        label: 'Input Text Primary',
        hint: 'Input text primary color',
      },
      {
        key: 'components.input.text.placeholder',
        label: 'Input Placeholder',
        hint: 'Input placeholder text color',
      },
      {
        key: 'components.input.text.placeholderSecondary',
        label: 'Input Placeholder Secondary',
        hint: 'Secondary placeholder color',
      },
      {
        key: 'components.input.text.disabled',
        label: 'Input Disabled Text',
        hint: 'Disabled input text color',
      },
      {
        key: 'components.input.border',
        label: 'Input Border',
        hint: 'Input border color',
      },
    ],
  },
  {
    id: 'components-select',
    title: 'Select Components',
    icon: ArrowDropDownCircleOutlined,
    description: 'Select and dropdown styling',
    colors: [
      {
        key: 'components.select.hover',
        label: 'Select Hover',
        hint: 'Select option hover background',
      },
      {
        key: 'components.select.selected.default',
        label: 'Select Selected Default',
        hint: 'Selected option default background',
      },
      {
        key: 'components.select.selected.hover',
        label: 'Select Selected Hover',
        hint: 'Selected option hover background',
      },
      {
        key: 'components.select.text.selected.primary',
        label: 'Select Text Primary',
        hint: 'Selected text primary color',
      },
      {
        key: 'components.select.text.selected.secondary',
        label: 'Select Text Secondary',
        hint: 'Selected text secondary color',
      },
    ],
  },
  {
    id: 'components-publish',
    title: 'Publish Wizard Components',
    icon: PublishOutlined,
    description: 'Publish wizard step styling',
    colors: [
      {
        key: 'components.publishWizardStep.default.background',
        label: 'Wizard Step Default Background',
        hint: 'Default step background',
      },
      {
        key: 'components.publishWizardStep.default.border',
        label: 'Wizard Step Default Border',
        hint: 'Default step border',
      },
      {
        key: 'components.publishWizardStep.default.iconBackground',
        label: 'Wizard Step Default Icon',
        hint: 'Default step icon background',
      },
      {
        key: 'components.publishWizardStep.active.background',
        label: 'Wizard Step Active Background',
        hint: 'Active step background',
      },
      {
        key: 'components.publishWizardStep.active.border',
        label: 'Wizard Step Active Border',
        hint: 'Active step border',
      },
      {
        key: 'components.publishWizardStep.active.iconBackground',
        label: 'Wizard Step Active Icon',
        hint: 'Active step icon background',
      },
      {
        key: 'components.publishWizardStep.completed.background',
        label: 'Wizard Step Completed Background',
        hint: 'Completed step background',
      },
      {
        key: 'components.publishWizardStep.completed.border',
        label: 'Wizard Step Completed Border',
        hint: 'Completed step border',
      },
      {
        key: 'components.publishWizardStep.completed.iconBackground',
        label: 'Wizard Step Completed Icon',
        hint: 'Completed step icon background',
      },
    ],
  },
  {
    id: 'components-checkbox',
    title: 'Checkbox Components',
    icon: CheckBoxOutlined,
    description: 'Checkbox and radio styling',
    colors: [
      {
        key: 'components.checkbox.default',
        label: 'Checkbox Default',
        hint: 'Unchecked checkbox color',
      },
      {
        key: 'components.checkbox.hover.on',
        label: 'Checkbox Hover On',
        hint: 'Checked checkbox hover color',
      },
      {
        key: 'components.checkbox.hover.off',
        label: 'Checkbox Hover Off',
        hint: 'Unchecked checkbox hover color',
      },
      {
        key: 'components.checkbox.active',
        label: 'Checkbox Active',
        hint: 'Checked checkbox color',
      },
      {
        key: 'components.checkbox.mark',
        label: 'Checkbox Mark',
        hint: 'Checkbox checkmark color',
      },
      {
        key: 'components.checkbox.disabled',
        label: 'Checkbox Disabled',
        hint: 'Disabled checkbox color',
      },
      {
        key: 'components.checkbox.radio.default',
        label: 'Radio Default',
        hint: 'Radio button default color',
      },
      {
        key: 'components.checkbox.radio.hover.off',
        label: 'Radio Hover Off',
        hint: 'Unselected radio hover color',
      },
      {
        key: 'components.checkbox.radio.active',
        label: 'Radio Active',
        hint: 'Selected radio color',
      },
      {
        key: 'components.checkbox.radio.disabled',
        label: 'Radio Disabled',
        hint: 'Disabled radio color',
      },
    ],
  },
  {
    id: 'components-split',
    title: 'Split & Accent Buttons',
    icon: CallSplitOutlined,
    description: 'Split button and accent button styling',
    colors: [
      {
        key: 'components.split.background.default',
        label: 'Split Default',
        hint: 'Split button default background',
      },
      {
        key: 'components.split.background.hover',
        label: 'Split Hover',
        hint: 'Split button hover background',
      },
      {
        key: 'components.split.background.pressed',
        label: 'Split Pressed',
        hint: 'Split button pressed background',
      },
      {
        key: 'components.split.background.disabled',
        label: 'Split Disabled',
        hint: 'Split button disabled background',
      },
      {
        key: 'components.split.text.default',
        label: 'Split Text Default',
        hint: 'Split button text default',
      },
      {
        key: 'components.split.text.pressed',
        label: 'Split Text Pressed',
        hint: 'Split button text pressed',
      },
      {
        key: 'components.split.text.disabled',
        label: 'Split Text Disabled',
        hint: 'Split button text disabled',
      },
      {
        key: 'components.split.border.categorySelected',
        label: 'Split Category Selected',
        hint: 'Category selected border',
      },
      {
        key: 'components.split.border.hover',
        label: 'Split Hover Border',
        hint: 'Split button hover border',
      },
      {
        key: 'components.accentButton.background.default',
        label: 'Accent Button Default',
        hint: 'Accent button default background',
      },
      {
        key: 'components.accentButton.background.hover',
        label: 'Accent Button Hover',
        hint: 'Accent button hover background',
      },
      {
        key: 'components.accentButton.background.pressed',
        label: 'Accent Button Pressed',
        hint: 'Accent button pressed background',
      },
      {
        key: 'components.accentButton.background.disabled',
        label: 'Accent Button Disabled',
        hint: 'Accent button disabled background',
      },
      {
        key: 'components.accentButton.text.default',
        label: 'Accent Button Text Default',
        hint: 'Accent button text default',
      },
      {
        key: 'components.accentButton.text.pressed',
        label: 'Accent Button Text Pressed',
        hint: 'Accent button text pressed',
      },
      {
        key: 'components.accentButton.text.disabled',
        label: 'Accent Button Text Disabled',
        hint: 'Accent button text disabled',
      },
    ],
  },
  {
    id: 'components-capability',
    title: 'Capability Components',
    icon: PsychologyOutlined,
    description: 'AI capability indicator styling',
    colors: [
      {
        key: 'components.capability.vision.background',
        label: 'Vision Capability Background',
        hint: 'Vision capability background',
      },
      {
        key: 'components.capability.vision.icon',
        label: 'Vision Capability Icon',
        hint: 'Vision capability icon color',
      },
      {
        key: 'components.capability.reasoning.background',
        label: 'Reasoning Capability Background',
        hint: 'Reasoning capability background',
      },
      {
        key: 'components.capability.reasoning.icon',
        label: 'Reasoning Capability Icon',
        hint: 'Reasoning capability icon color',
      },
    ],
  },
  {
    id: 'components-suggestion',
    title: 'Suggestion Components',
    icon: LightbulbOutlined,
    description: 'Suggestion chip and prompt styling',
    colors: [
      {
        key: 'components.suggestionChip.border',
        label: 'Suggestion Chip Border',
        hint: 'Suggestion chip border',
      },
      {
        key: 'components.suggestionChip.background.default',
        label: 'Suggestion Chip Default',
        hint: 'Suggestion chip default background',
      },
      {
        key: 'components.suggestionChip.background.hover',
        label: 'Suggestion Chip Hover',
        hint: 'Suggestion chip hover background',
      },
      {
        key: 'components.suggestionChip.text.default',
        label: 'Suggestion Chip Text Default',
        hint: 'Suggestion chip text default',
      },
      {
        key: 'components.suggestionChip.text.hover',
        label: 'Suggestion Chip Text Hover',
        hint: 'Suggestion chip text hover',
      },
    ],
  },
  {
    id: 'components-ai',
    title: 'AI Assistant Components',
    icon: AutoAwesomeOutlined,
    description: 'AI assistant and magic styling',
    colors: [
      {
        key: 'components.aiAssistant.background.icon',
        label: 'AI Assistant Icon Background',
        hint: 'AI assistant icon background',
      },
      {
        key: 'components.aiAssistant.background.iconBorder',
        label: 'AI Assistant Icon Border',
        hint: 'AI assistant icon border',
      },
      {
        key: 'components.aiAssistant.iconGradientStart',
        label: 'AI Assistant Gradient Start',
        hint: 'AI assistant gradient start color',
      },
      {
        key: 'components.aiAssistant.iconGradientEnd',
        label: 'AI Assistant Gradient End',
        hint: 'AI assistant gradient end color',
      },
      {
        key: 'components.aiAnswer.background',
        label: 'AI Answer Background',
        hint: 'AI answer message background',
      },
      {
        key: 'components.aiAnswer.actionsGradient',
        label: 'AI Answer Actions Gradient',
        hint: 'AI answer actions gradient',
      },
      {
        key: 'components.aiAssistantModal.background.panel',
        label: 'AI Modal Panel',
        hint: 'AI assistant modal panel background',
      },
      {
        key: 'components.aiAssistantModal.background.editor',
        label: 'AI Modal Editor',
        hint: 'AI assistant modal editor background',
      },
      {
        key: 'components.aiParticipantIcon.background',
        label: 'AI Participant Icon',
        hint: 'AI participant icon background',
      },
    ],
  },
  {
    id: 'components-sidebar',
    title: 'Sidebar Components',
    icon: ViewSidebarOutlined,
    description: 'Sidebar and navigation styling',
    colors: [
      {
        key: 'components.sidebar.background',
        label: 'Sidebar Background',
        hint: 'Sidebar background',
      },
      {
        key: 'components.sidebar.divider',
        label: 'Sidebar Divider',
        hint: 'Sidebar section divider',
      },
      {
        key: 'components.sidebar.menuItem.default',
        label: 'Menu Item Default',
        hint: 'Menu item default background',
      },
      {
        key: 'components.sidebar.menuItem.hover',
        label: 'Menu Item Hover',
        hint: 'Menu item hover background',
      },
      {
        key: 'components.sidebar.menuItem.selected',
        label: 'Menu Item Selected',
        hint: 'Menu item selected background',
      },
    ],
  },
  {
    id: 'components-userInput',
    title: 'User Input Components',
    icon: InputOutlined,
    description: 'User input field styling',
    colors: [
      {
        key: 'components.userInput.border.base',
        label: 'User Input Border Base',
        hint: 'User input base border',
      },
      {
        key: 'components.userInput.border.glow',
        label: 'User Input Border Glow',
        hint: 'User input glow border',
      },
      {
        key: 'components.userInput.shadow.default',
        label: 'User Input Shadow Default',
        hint: 'User input default shadow',
      },
      {
        key: 'components.userInput.shadow.recording',
        label: 'User Input Shadow Recording',
        hint: 'User input recording shadow',
      },
    ],
  },
  {
    id: 'components-nps',
    title: 'NPS Survey Components',
    icon: ThumbUpAltOutlined,
    description: 'NPS survey styling',
    colors: [
      {
        key: 'components.npsSurvey.background',
        label: 'NPS Survey Background',
        hint: 'NPS survey background',
      },
      {
        key: 'components.npsSurvey.border',
        label: 'NPS Survey Border',
        hint: 'NPS survey border',
      },
      {
        key: 'components.npsSurvey.accent',
        label: 'NPS Survey Accent',
        hint: 'NPS survey accent color',
      },
      {
        key: 'components.npsSurvey.accentSubtle',
        label: 'NPS Survey Accent Subtle',
        hint: 'NPS survey subtle accent',
      },
      {
        key: 'components.npsSurvey.optionBackground',
        label: 'NPS Option Background',
        hint: 'NPS option background',
      },
      {
        key: 'components.npsSurvey.optionBackgroundHover',
        label: 'NPS Option Hover',
        hint: 'NPS option hover background',
      },
      {
        key: 'components.npsSurvey.text.label',
        label: 'NPS Label Text',
        hint: 'NPS label text color',
      },
      {
        key: 'components.npsSurvey.text.placeholder',
        label: 'NPS Placeholder Text',
        hint: 'NPS placeholder text color',
      },
      {
        key: 'components.npsSurvey.button.primary.default',
        label: 'NPS Primary Button Default',
        hint: 'NPS primary button default',
      },
      {
        key: 'components.npsSurvey.button.primary.hover',
        label: 'NPS Primary Button Hover',
        hint: 'NPS primary button hover',
      },
      {
        key: 'components.npsSurvey.button.primary.pressed',
        label: 'NPS Primary Button Pressed',
        hint: 'NPS primary button pressed',
      },
      {
        key: 'components.npsSurvey.button.primary.disabled',
        label: 'NPS Primary Button Disabled',
        hint: 'NPS primary button disabled',
      },
      {
        key: 'components.npsSurvey.button.secondary.default',
        label: 'NPS Secondary Button Default',
        hint: 'NPS secondary button default',
      },
      {
        key: 'components.npsSurvey.button.secondary.hover',
        label: 'NPS Secondary Button Hover',
        hint: 'NPS secondary button hover',
      },
      {
        key: 'components.npsSurvey.button.secondary.pressed',
        label: 'NPS Secondary Button Pressed',
        hint: 'NPS secondary button pressed',
      },
    ],
  },
  {
    id: 'components-agentHub',
    title: 'Agent Hub Components',
    icon: HubOutlined,
    description: 'Agent hub button styling',
    colors: [
      {
        key: 'components.agentHubButton.background.default',
        label: 'Agent Hub Default',
        hint: 'Agent hub button default background',
      },
      {
        key: 'components.agentHubButton.background.hover',
        label: 'Agent Hub Hover',
        hint: 'Agent hub button hover background',
      },
      {
        key: 'components.agentHubButton.background.active',
        label: 'Agent Hub Active',
        hint: 'Agent hub button active background',
      },
      {
        key: 'components.agentHubButton.shadow.default',
        label: 'Agent Hub Shadow Default',
        hint: 'Agent hub button default shadow',
      },
      {
        key: 'components.agentHubButton.shadow.hover',
        label: 'Agent Hub Shadow Hover',
        hint: 'Agent hub button hover shadow',
      },
      {
        key: 'components.agentHubButton.shadow.active',
        label: 'Agent Hub Shadow Active',
        hint: 'Agent hub button active shadow',
      },
      {
        key: 'components.agentHubButton.textGradient',
        label: 'Agent Hub Text Gradient',
        hint: 'Agent hub button text gradient',
      },
      {
        key: 'components.agentHubButton.iconGradient',
        label: 'Agent Hub Icon Gradient',
        hint: 'Agent hub button icon gradient',
      },
    ],
  },
  {
    id: 'components-modal',
    title: 'Modal Components',
    icon: WebOutlined,
    description: 'Modal and dialog styling',
    colors: [
      {
        key: 'components.agentModal.background.default',
        label: 'Agent Modal Default',
        hint: 'Agent modal default background',
      },
      {
        key: 'components.agentModal.background.borderGradient',
        label: 'Agent Modal Border Gradient',
        hint: 'Agent modal border gradient',
      },
      {
        key: 'components.agentModal.content.background.default',
        label: 'Agent Modal Content Default',
        hint: 'Agent modal content background',
      },
      {
        key: 'components.agentModal.content.background.borderGradient',
        label: 'Agent Modal Content Border',
        hint: 'Agent modal content border gradient',
      },
      {
        key: 'components.skillHubModal.background.default',
        label: 'Skill Hub Modal Default',
        hint: 'Skill hub modal background',
      },
      {
        key: 'components.skillHubModal.background.borderGradient',
        label: 'Skill Hub Modal Border',
        hint: 'Skill hub modal border gradient',
      },
    ],
  },
  {
    id: 'components-index',
    title: 'Index & Code Preview',
    icon: CodeOutlined,
    description: 'Index detail and code preview styling',
    colors: [
      {
        key: 'components.indexDetail.background.left',
        label: 'Index Detail Left',
        hint: 'Index detail left panel background',
      },
      {
        key: 'components.indexDetail.background.right',
        label: 'Index Detail Right',
        hint: 'Index detail right panel background',
      },
      {
        key: 'components.codePreview.background',
        label: 'Code Preview Background',
        hint: 'Code preview background',
      },
    ],
  },
  {
    id: 'components-flow',
    title: 'Flow Editor Components',
    icon: AccountTreeOutlined,
    description: 'Visual flow editor styling',
    colors: [
      {
        key: 'components.flowEditor.background',
        label: 'Flow Editor Background',
        hint: 'Flow editor canvas background',
      },
      {
        key: 'components.flowEditor.node.border',
        label: 'Flow Node Border',
        hint: 'Flow node border color',
      },
      {
        key: 'components.flowEditor.edge.stroke',
        label: 'Flow Edge Stroke',
        hint: 'Flow edge stroke color',
      },
      {
        key: 'components.flowEditor.nodeColors.toolkit',
        label: 'Toolkit Node',
        hint: 'Toolkit node background',
      },
      {
        key: 'components.flowEditor.nodeColors.mcp',
        label: 'MCP Node',
        hint: 'MCP node background',
      },
      {
        key: 'components.flowEditor.nodeColors.tool',
        label: 'Tool Node',
        hint: 'Tool node background',
      },
      {
        key: 'components.flowEditor.nodeColors.agent',
        label: 'Agent Node',
        hint: 'Agent node background',
      },
      {
        key: 'components.flowEditor.nodeColors.pipeline',
        label: 'Pipeline Node',
        hint: 'Pipeline node background',
      },
      {
        key: 'components.flowEditor.nodeColors.function',
        label: 'Function Node',
        hint: 'Function node background',
      },
      {
        key: 'components.flowEditor.nodeColors.llm',
        label: 'LLM Node',
        hint: 'LLM node background',
      },
      {
        key: 'components.flowEditor.nodeColors.decision',
        label: 'Decision Node',
        hint: 'Decision node background',
      },
      {
        key: 'components.flowEditor.nodeColors.condition',
        label: 'Condition Node',
        hint: 'Condition node background',
      },
      {
        key: 'components.flowEditor.nodeColors.loop',
        label: 'Loop Node',
        hint: 'Loop node background',
      },
      {
        key: 'components.flowEditor.nodeColors.loop_from_tool',
        label: 'Loop From Tool Node',
        hint: 'Loop from tool node background',
      },
      {
        key: 'components.flowEditor.nodeColors.router',
        label: 'Router Node',
        hint: 'Router node background',
      },
      {
        key: 'components.flowEditor.nodeColors.state_modifier',
        label: 'State Modifier Node',
        hint: 'State modifier node background',
      },
      {
        key: 'components.flowEditor.nodeColors.code',
        label: 'Code Node',
        hint: 'Code node background',
      },
      {
        key: 'components.flowEditor.nodeColors.printer',
        label: 'Printer Node',
        hint: 'Printer node background',
      },
      {
        key: 'components.flowEditor.nodeColors.hitl',
        label: 'HITL Node',
        hint: 'Human-in-the-loop node background',
      },
      {
        key: 'components.flowEditor.nodeColors.custom',
        label: 'Custom Node',
        hint: 'Custom node background',
      },
    ],
  },
  {
    id: 'components-mcp',
    title: 'MCP & OAuth Components',
    icon: ExtensionOutlined,
    description: 'MCP and OAuth status styling',
    colors: [
      {
        key: 'components.mcp.background.loginSuccess',
        label: 'MCP Login Success Background',
        hint: 'MCP login success background',
      },
      {
        key: 'components.mcp.background.logout',
        label: 'MCP Logout Background',
        hint: 'MCP logout background',
      },
      {
        key: 'components.mcp.border.loginSuccess',
        label: 'MCP Login Success Border',
        hint: 'MCP login success border',
      },
      {
        key: 'components.mcp.border.logout',
        label: 'MCP Logout Border',
        hint: 'MCP logout border',
      },
      {
        key: 'components.mcp.text.loginSuccess',
        label: 'MCP Login Success Text',
        hint: 'MCP login success text',
      },
      {
        key: 'components.mcp.text.logout',
        label: 'MCP Logout Text',
        hint: 'MCP logout text',
      },
      {
        key: 'components.oauthStatus.background.loginSuccess',
        label: 'OAuth Login Success Background',
        hint: 'OAuth login success background',
      },
      {
        key: 'components.oauthStatus.background.logout',
        label: 'OAuth Logout Background',
        hint: 'OAuth logout background',
      },
      {
        key: 'components.oauthStatus.border.loginSuccess',
        label: 'OAuth Login Success Border',
        hint: 'OAuth login success border',
      },
      {
        key: 'components.oauthStatus.border.logout',
        label: 'OAuth Logout Border',
        hint: 'OAuth logout border',
      },
      {
        key: 'components.oauthStatus.text.loginSuccess',
        label: 'OAuth Login Success Text',
        hint: 'OAuth login success text',
      },
      {
        key: 'components.oauthStatus.text.logout',
        label: 'OAuth Logout Text',
        hint: 'OAuth logout text',
      },
    ],
  },
  {
    id: 'components-onboarding',
    title: 'Onboarding & Welcome',
    icon: SchoolOutlined,
    description: 'Onboarding and welcome screen styling',
    colors: [
      {
        key: 'components.onboarding.background',
        label: 'Onboarding Background',
        hint: 'Onboarding background',
      },
      {
        key: 'components.onboarding.bodyBackground',
        label: 'Onboarding Body Background',
        hint: 'Onboarding body background',
      },
      {
        key: 'components.welcome.background.outside',
        label: 'Welcome Outside Background',
        hint: 'Welcome outside background',
      },
      {
        key: 'components.welcome.background.inner',
        label: 'Welcome Inner Background',
        hint: 'Welcome inner background',
      },
    ],
  },
  {
    id: 'components-banner',
    title: 'Banner Components',
    icon: CampaignOutlined,
    description: 'Banner and announcement styling',
    colors: [
      {
        key: 'components.banner.background.default',
        label: 'Banner Default Background',
        hint: 'Banner default background',
      },
      {
        key: 'components.banner.background.border',
        label: 'Banner Border Background',
        hint: 'Banner border gradient',
      },
    ],
  },
  {
    id: 'components-tour',
    title: 'Interactive Tour',
    icon: TourOutlined,
    description: 'Interactive tour styling',
    colors: [
      {
        key: 'components.interactiveTour.backdrop',
        label: 'Tour Backdrop',
        hint: 'Tour backdrop color',
      },
      {
        key: 'components.interactiveTour.background.card',
        label: 'Tour Card Background',
        hint: 'Tour card background',
      },
      {
        key: 'components.interactiveTour.background.borderGradient',
        label: 'Tour Border Gradient',
        hint: 'Tour border gradient',
      },
      {
        key: 'components.interactiveTour.dividerGradient',
        label: 'Tour Divider Gradient',
        hint: 'Tour divider gradient',
      },
      {
        key: 'components.interactiveTour.text',
        label: 'Tour Text',
        hint: 'Tour text color',
      },
    ],
  },
  {
    id: 'components-resourceCard',
    title: 'Resource Card Components',
    icon: StyleOutlined,
    description: 'Resource card color variants',
    colors: [
      {
        key: 'components.resourceCard.background.blue.card',
        label: 'Blue Card Background',
        hint: 'Blue resource card background',
      },
      {
        key: 'components.resourceCard.background.blue.icon',
        label: 'Blue Card Icon Background',
        hint: 'Blue card icon background',
      },
      {
        key: 'components.resourceCard.background.blue.iconColor',
        label: 'Blue Card Icon Color',
        hint: 'Blue card icon color',
      },
      {
        key: 'components.resourceCard.background.blue.iconBorderGradient',
        label: 'Blue Card Icon Border',
        hint: 'Blue card icon border gradient',
      },
      {
        key: 'components.resourceCard.background.blue.divider',
        label: 'Blue Card Divider',
        hint: 'Blue card divider color',
      },
      {
        key: 'components.resourceCard.background.blue.borderGradient',
        label: 'Blue Card Border Gradient',
        hint: 'Blue card border gradient',
      },
      {
        key: 'components.resourceCard.background.orange.card',
        label: 'Orange Card Background',
        hint: 'Orange resource card background',
      },
      {
        key: 'components.resourceCard.background.orange.icon',
        label: 'Orange Card Icon Background',
        hint: 'Orange card icon background',
      },
      {
        key: 'components.resourceCard.background.orange.iconColor',
        label: 'Orange Card Icon Color',
        hint: 'Orange card icon color',
      },
      {
        key: 'components.resourceCard.background.orange.iconBorderGradient',
        label: 'Orange Card Icon Border',
        hint: 'Orange card icon border gradient',
      },
      {
        key: 'components.resourceCard.background.orange.divider',
        label: 'Orange Card Divider',
        hint: 'Orange card divider color',
      },
      {
        key: 'components.resourceCard.background.orange.borderGradient',
        label: 'Orange Card Border Gradient',
        hint: 'Orange card border gradient',
      },
      {
        key: 'components.resourceCard.background.purple.card',
        label: 'Purple Card Background',
        hint: 'Purple resource card background',
      },
      {
        key: 'components.resourceCard.background.purple.icon',
        label: 'Purple Card Icon Background',
        hint: 'Purple card icon background',
      },
      {
        key: 'components.resourceCard.background.purple.iconColor',
        label: 'Purple Card Icon Color',
        hint: 'Purple card icon color',
      },
      {
        key: 'components.resourceCard.background.purple.iconBorderGradient',
        label: 'Purple Card Icon Border',
        hint: 'Purple card icon border gradient',
      },
      {
        key: 'components.resourceCard.background.purple.divider',
        label: 'Purple Card Divider',
        hint: 'Purple card divider color',
      },
      {
        key: 'components.resourceCard.background.purple.borderGradient',
        label: 'Purple Card Border Gradient',
        hint: 'Purple card border gradient',
      },
      {
        key: 'components.resourceCard.background.green.card',
        label: 'Green Card Background',
        hint: 'Green resource card background',
      },
      {
        key: 'components.resourceCard.background.green.icon',
        label: 'Green Card Icon Background',
        hint: 'Green card icon background',
      },
      {
        key: 'components.resourceCard.background.green.iconColor',
        label: 'Green Card Icon Color',
        hint: 'Green card icon color',
      },
      {
        key: 'components.resourceCard.background.green.iconBorderGradient',
        label: 'Green Card Icon Border',
        hint: 'Green card icon border gradient',
      },
      {
        key: 'components.resourceCard.background.green.divider',
        label: 'Green Card Divider',
        hint: 'Green card divider color',
      },
      {
        key: 'components.resourceCard.background.green.borderGradient',
        label: 'Green Card Border Gradient',
        hint: 'Green card border gradient',
      },
      {
        key: 'components.resourceCard.background.pink.card',
        label: 'Pink Card Background',
        hint: 'Pink resource card background',
      },
      {
        key: 'components.resourceCard.background.pink.icon',
        label: 'Pink Card Icon Background',
        hint: 'Pink card icon background',
      },
      {
        key: 'components.resourceCard.background.pink.iconColor',
        label: 'Pink Card Icon Color',
        hint: 'Pink card icon color',
      },
      {
        key: 'components.resourceCard.background.pink.iconBorderGradient',
        label: 'Pink Card Icon Border',
        hint: 'Pink card icon border gradient',
      },
      {
        key: 'components.resourceCard.background.pink.divider',
        label: 'Pink Card Divider',
        hint: 'Pink card divider color',
      },
      {
        key: 'components.resourceCard.background.pink.borderGradient',
        label: 'Pink Card Border Gradient',
        hint: 'Pink card border gradient',
      },
    ],
  },
  {
    id: 'components-entityIcon',
    title: 'Entity Icon Components',
    icon: CropSquareOutlined,
    description: 'Entity icon styling',
    colors: [
      {
        key: 'components.entityIcon.background.default',
        label: 'Entity Icon Default',
        hint: 'Entity icon default background',
      },
      {
        key: 'components.entityIcon.background.trophy',
        label: 'Entity Icon Trophy',
        hint: 'Trophy entity icon background',
      },
      {
        key: 'components.entityIcon.background.checkedBox',
        label: 'Entity Icon Checked',
        hint: 'Checked entity icon background',
      },
      {
        key: 'components.entityIcon.background.entityGradient',
        label: 'Entity Icon Gradient',
        hint: 'Entity icon gradient',
      },
      {
        key: 'components.entityIcon.background.entityBorderGradient',
        label: 'Entity Icon Border Gradient',
        hint: 'Entity icon border gradient',
      },
    ],
  },
  {
    id: 'components-runIndex',
    title: 'Run Index Banner',
    icon: PlaylistPlayOutlined,
    description: 'Run index banner variants',
    colors: [
      {
        key: 'components.runIndexBanner.background.success',
        label: 'Run Index Success Background',
        hint: 'Success banner background',
      },
      {
        key: 'components.runIndexBanner.background.error',
        label: 'Run Index Error Background',
        hint: 'Error banner background',
      },
      {
        key: 'components.runIndexBanner.background.warning',
        label: 'Run Index Warning Background',
        hint: 'Warning banner background',
      },
      {
        key: 'components.runIndexBanner.background.info',
        label: 'Run Index Info Background',
        hint: 'Info banner background',
      },
      {
        key: 'components.runIndexBanner.border.success',
        label: 'Run Index Success Border',
        hint: 'Success banner border',
      },
      {
        key: 'components.runIndexBanner.border.error',
        label: 'Run Index Error Border',
        hint: 'Error banner border',
      },
      {
        key: 'components.runIndexBanner.border.warning',
        label: 'Run Index Warning Border',
        hint: 'Warning banner border',
      },
      {
        key: 'components.runIndexBanner.border.info',
        label: 'Run Index Info Border',
        hint: 'Info banner border',
      },
      {
        key: 'components.runIndexBanner.text.success',
        label: 'Run Index Success Text',
        hint: 'Success banner text',
      },
      {
        key: 'components.runIndexBanner.text.error',
        label: 'Run Index Error Text',
        hint: 'Error banner text',
      },
      {
        key: 'components.runIndexBanner.text.warning',
        label: 'Run Index Warning Text',
        hint: 'Warning banner text',
      },
      {
        key: 'components.runIndexBanner.text.info',
        label: 'Run Index Info Text',
        hint: 'Info banner text',
      },
    ],
  },
  {
    id: 'components-tips',
    title: 'Tips Components',
    icon: TipsAndUpdatesOutlined,
    description: 'Tips and hints styling',
    colors: [
      {
        key: 'components.tips.background.main',
        label: 'Tips Main Background',
        hint: 'Tips main background',
      },
      {
        key: 'components.tips.background.secondary',
        label: 'Tips Secondary Background',
        hint: 'Tips secondary background',
      },
    ],
  },
  {
    id: 'components-tooltip',
    title: 'Tooltip Components',
    icon: SpeakerNotesOutlined,
    description: 'Tooltip styling',
    colors: [
      {
        key: 'components.tooltip.background.default',
        label: 'Tooltip Background Default',
        hint: 'Tooltip default background',
      },
      {
        key: 'components.tooltip.background.code',
        label: 'Tooltip Background Code',
        hint: 'Tooltip code background',
      },
      {
        key: 'components.tooltip.text.default',
        label: 'Tooltip Text Default',
        hint: 'Tooltip text color',
      },
    ],
  },
  {
    id: 'components-config',
    title: 'Configuration Components',
    icon: TuneOutlined,
    description: 'Configuration card styling',
    colors: [
      {
        key: 'components.configurationCard.background.highTier',
        label: 'Config Card High Tier',
        hint: 'High tier configuration card background',
      },
    ],
  },
  {
    id: 'components-misc',
    title: 'Miscellaneous Components',
    icon: MoreHorizOutlined,
    description: 'Various other component styling',
    colors: [
      {
        key: 'components.categoriesButton.background.selected.active',
        label: 'Categories Button Active',
        hint: 'Categories button active background',
      },
      {
        key: 'components.categoriesButton.background.selected.hover',
        label: 'Categories Button Hover',
        hint: 'Categories button hover background',
      },
      {
        key: 'components.tagEditor.background.tag',
        label: 'Tag Editor Background',
        hint: 'Tag editor tag background',
      },
      {
        key: 'components.tagEditor.shadow',
        label: 'Tag Editor Shadow',
        hint: 'Tag editor shadow',
      },
      {
        key: 'components.toolCard.background.hover',
        label: 'Tool Card Hover',
        hint: 'Tool card hover background',
      },
      {
        key: 'components.toolCard.background.gradient',
        label: 'Tool Card Gradient',
        hint: 'Tool card gradient background',
      },
      {
        key: 'components.chatContinue.background',
        label: 'Chat Continue Background',
        hint: 'Chat continue button background',
      },
      {
        key: 'components.chatContinue.border',
        label: 'Chat Continue Border',
        hint: 'Chat continue button border',
      },
      {
        key: 'components.aiProviderAccordion.background.default',
        label: 'AI Provider Accordion Default',
        hint: 'AI provider accordion default',
      },
      {
        key: 'components.aiProviderAccordion.background.hover',
        label: 'AI Provider Accordion Hover',
        hint: 'AI provider accordion hover',
      },
      {
        key: 'components.aiProviderAccordion.border',
        label: 'AI Provider Accordion Border',
        hint: 'AI provider accordion border',
      },
      {
        key: 'components.accordion.background.default',
        label: 'Accordion Default',
        hint: 'Accordion default background',
      },
      {
        key: 'components.accordion.background.hover',
        label: 'Accordion Hover',
        hint: 'Accordion hover background',
      },
      {
        key: 'components.accordion.border',
        label: 'Accordion Border',
        hint: 'Accordion border',
      },
      {
        key: 'components.listItem.background.default',
        label: 'List Item Default',
        hint: 'List item default background',
      },
      {
        key: 'components.chatStarter.background.strong',
        label: 'Chat Starter Strong',
        hint: 'Chat starter strong background',
      },
      {
        key: 'components.chatStarter.background.subtle',
        label: 'Chat Starter Subtle',
        hint: 'Chat starter subtle background',
      },
      {
        key: 'components.userMessageEditor.border',
        label: 'User Message Editor Border',
        hint: 'User message editor border',
      },
      {
        key: 'components.notificationItem.border',
        label: 'Notification Item Border',
        hint: 'Notification item border',
      },
      {
        key: 'components.editingPlaceholder.border',
        label: 'Editing Placeholder Border',
        hint: 'Editing placeholder border',
      },
      {
        key: 'components.editInline.border',
        label: 'Edit Inline Border',
        hint: 'Inline edit border',
      },
      {
        key: 'components.slider.track',
        label: 'Slider Track',
        hint: 'Slider track color',
      },
      {
        key: 'components.slider.markActive',
        label: 'Slider Mark Active',
        hint: 'Slider active mark color',
      },
      {
        key: 'components.userMessage.actionsGradient',
        label: 'User Message Actions Gradient',
        hint: 'User message actions gradient',
      },
      {
        key: 'components.userMessage.highlightBackground',
        label: 'User Message Highlight Background',
        hint: 'User message highlight background',
      },
      {
        key: 'components.userMessage.highlightBorder',
        label: 'User Message Highlight Border',
        hint: 'User message highlight border',
      },
      {
        key: 'components.contextBudget.trackBackground',
        label: 'Context Budget Track',
        hint: 'Context budget track background',
      },
      {
        key: 'components.usageMeter.trackBackground',
        label: 'Usage Meter Track',
        hint: 'Usage meter track background',
      },
      {
        key: 'components.notificationList.background',
        label: 'Notification List Background',
        hint: 'Notification list background',
      },
      {
        key: 'components.imageAttachment.background',
        label: 'Image Attachment Background',
        hint: 'Image attachment background',
      },
      {
        key: 'components.contextDialog.background',
        label: 'Context Dialog Background',
        hint: 'Context dialog background',
      },
      {
        key: 'components.deprecated.background',
        label: 'Deprecated Background',
        hint: 'Deprecated item background',
      },
      {
        key: 'components.deprecated.text',
        label: 'Deprecated Text',
        hint: 'Deprecated item text color',
      },
      {
        key: 'components.settingsPage.background',
        label: 'Settings Page Background',
        hint: 'Settings page background',
      },
      {
        key: 'components.contextHighlight.background',
        label: 'Context Highlight Background',
        hint: 'Context highlight background',
      },
      {
        key: 'components.chatSubmenu.dividerBackground',
        label: 'Chat Submenu Divider',
        hint: 'Chat submenu divider background',
      },
      {
        key: 'components.highlightQuery.background',
        label: 'Highlight Query Background',
        hint: 'Search highlight background',
      },
      {
        key: 'components.categorySection.text.title',
        label: 'Category Section Title',
        hint: 'Category section title color',
      },
      {
        key: 'components.deleteAlert.text.entityName',
        label: 'Delete Alert Entity Name',
        hint: 'Delete alert entity name color',
      },
      {
        key: 'components.deleteAlert.text.body',
        label: 'Delete Alert Body',
        hint: 'Delete alert body text color',
      },
    ],
  },
];

/**
 * Default palette mode options
 */
export const PALETTE_MODES = [
  { value: 'dark', label: 'Dark Mode' },
  { value: 'light', label: 'Light Mode' },
];

/**
 * Logo upload constraints, mirrored by the backend validation
 */
export const LOGO_ALLOWED_TYPES = ['image/png', 'image/svg+xml'];
export const LOGO_MAX_SIZE_BYTES = 5 * 1024 * 1024;
export const LOGO_MAX_SIZE_LABEL = '5MB';
