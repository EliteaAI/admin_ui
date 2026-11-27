import { memo, useCallback } from 'react';

import ChevronRightIcon from '@mui/icons-material/ChevronRightOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMoreOutlined';
import { Box, ButtonBase, Divider, Typography } from '@mui/material';

const SidebarGroup = memo(props => {
  const { group, expanded, locked, collapsed, showDivider, onToggle, children } = props;

  const styles = sidebarGroupStyles();

  const handleToggle = useCallback(() => {
    // The group of the current page stays open, so a highlighted entry is never hidden
    if (locked) return;
    onToggle(group.id, !expanded);
  }, [locked, onToggle, group.id, expanded]);

  // The icon-only sidebar has no room for headings: every icon shows and a divider separates the groups
  if (collapsed) {
    return (
      <Box sx={styles.root}>
        {showDivider && (
          <Divider
            data-testid={`sidebar-${group.id}-divider`}
            sx={styles.divider}
          />
        )}
        <Box sx={styles.items}>{children}</Box>
      </Box>
    );
  }

  return (
    <Box sx={styles.root}>
      <ButtonBase
        data-testid={`sidebar-${group.id}-heading`}
        aria-expanded={expanded}
        aria-disabled={locked || undefined}
        onClick={handleToggle}
        sx={styles.heading}
      >
        <Typography
          variant="labelSmall"
          sx={styles.headingText}
        >
          {group.label}
        </Typography>
        <Box
          component={expanded ? ExpandMoreIcon : ChevronRightIcon}
          sx={styles.chevron}
        />
      </ButtonBase>
      {expanded && <Box sx={styles.items}>{children}</Box>}
    </Box>
  );
});

SidebarGroup.displayName = 'SidebarGroup';

/** @type {MuiSx} */
const sidebarGroupStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxWidth: '100%',
  },

  heading: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0.5rem 0.5rem 0.5rem 1rem',
    borderRadius: '0.375rem',
    boxSizing: 'border-box',
    '&:hover': {
      backgroundColor: palette.background.conversation.hover,
    },
  }),

  headingText: ({ palette }) => ({
    color: palette.text.metrics,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    textTransform: 'uppercase !important',
  }),

  chevron: ({ palette }) => ({
    fontSize: '1rem',
    color: palette.icon.fill.stateButtonHover,
  }),

  items: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  divider: ({ palette }) => ({
    borderColor: palette.border.table,
  }),
});

export default SidebarGroup;
