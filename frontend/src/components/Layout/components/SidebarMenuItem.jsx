import { memo, useCallback } from 'react';

import { Box, Typography } from '@mui/material';

const SidebarMenuItem = memo(props => {
  const { item, isActive, collapsed, onSelect } = props;

  const styles = sidebarMenuItemStyles(collapsed, isActive);
  const IconComponent = item.icon;

  const handleClick = useCallback(() => {
    onSelect(item.url);
  }, [onSelect, item.url]);

  return (
    <Box
      data-testid={`sidebar-${item.testId ?? item.id}-item`}
      aria-current={isActive ? 'page' : undefined}
      onClick={handleClick}
      sx={styles.root}
    >
      <Box sx={styles.iconWrapper}>
        <IconComponent sx={{ fontSize: '0.875rem' }} />
      </Box>
      {!collapsed && (
        <Typography
          variant="labelSmall"
          sx={styles.text}
        >
          {item.label}
        </Typography>
      )}
    </Box>
  );
});

SidebarMenuItem.displayName = 'SidebarMenuItem';

/** @type {MuiSx} */
const sidebarMenuItemStyles = (collapsed, isActive) => ({
  root: ({ palette }) => ({
    padding: collapsed ? '0.5rem' : '0.5rem 1rem',
    justifyContent: collapsed ? 'center' : 'flex-start',
    gap: '0.5rem',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    height: '2rem',
    minHeight: '2rem',
    background: isActive
      ? palette.background.userInputBackgroundActive
      : palette.background.conversation.normal,
    borderRadius: '0.375rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    boxSizing: 'border-box',
    '&:hover': {
      backgroundColor: palette.background.conversation.hover,
    },
  }),

  iconWrapper: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    minWidth: '0.875rem',
    color: isActive ? palette.text.secondary : palette.icon.fill.stateButtonHover,
    '& svg': {
      fill: isActive ? palette.text.secondary : palette.icon.fill.stateButtonHover,
    },
  }),

  text: ({ palette }) => ({
    color: isActive ? palette.text.secondary : palette.text.metrics,
  }),
});

export default SidebarMenuItem;
