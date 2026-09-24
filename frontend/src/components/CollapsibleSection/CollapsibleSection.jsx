import { memo, useCallback, useId } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Collapse, IconButton, Typography } from '@mui/material';

const CollapsibleSection = memo(props => {
  const { icon: IconComponent, title, count, expanded, onToggle, keepMounted = false, children } = props;

  const contentId = useId();

  const handleChevronClick = useCallback(
    e => {
      e.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  const handleHeaderKeyDown = useCallback(
    e => {
      if (e.target !== e.currentTarget) return;
      if (e.key !== 'Enter' && e.key !== ' ') return;

      e.preventDefault();
      onToggle();
    },
    [onToggle],
  );

  // A string count is already a label, a number gets the default wording
  const countLabel =
    typeof count === 'string'
      ? count
      : count !== undefined
        ? `${count} ${count === 1 ? 'setting' : 'settings'}`
        : null;

  const styles = collapsibleSectionStyles();

  return (
    <Box sx={styles.sectionContainer}>
      <Box
        sx={styles.sectionHeader(expanded)}
        onClick={onToggle}
        onKeyDown={handleHeaderKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={!!expanded}
        aria-controls={contentId}
      >
        <Box sx={styles.sectionTitleRow}>
          {IconComponent && <IconComponent sx={styles.sectionIcon} />}
          <Typography
            variant="body1"
            sx={styles.sectionTitle}
          >
            {title}
          </Typography>
          {countLabel && (
            <Typography
              variant="caption"
              sx={styles.fieldCount}
            >
              {countLabel}
            </Typography>
          )}
        </Box>
        <IconButton
          size="small"
          sx={styles.expandIcon(expanded)}
          onClick={handleChevronClick}
          tabIndex={-1}
          aria-hidden
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>
      <Collapse
        in={expanded}
        id={contentId}
        timeout="auto"
        unmountOnExit={!keepMounted}
      >
        <Box sx={styles.sectionContent}>{children}</Box>
      </Collapse>
    </Box>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

/** @type {MuiSx} */
const collapsibleSectionStyles = () => ({
  sectionContainer: ({ palette }) => ({
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.border.table}`,
    overflow: 'visible',
  }),
  sectionHeader:
    expanded =>
    ({ palette }) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      minHeight: '3rem',
      cursor: 'pointer',
      backgroundColor: expanded ? palette.background.userInputBackgroundActive : 'transparent',
      borderRadius: expanded ? '0.5rem 0.5rem 0 0' : '0.5rem',
      transition: 'background-color 0.2s ease',
      '&:hover': {
        backgroundColor: palette.background.userInputBackgroundActive,
      },
    }),
  sectionTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    minWidth: 0,
  },
  sectionIcon: ({ palette }) => ({
    fontSize: '1.25rem',
    flexShrink: 0,
    color: palette.text.metrics,
  }),
  sectionTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: '0.875rem',
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  }),
  fieldCount: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
    backgroundColor: palette.background.hover,
    padding: '0.125rem 0.5rem',
    borderRadius: '0.25rem',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  }),
  expandIcon: expanded => ({
    transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
    transition: 'transform 0.2s ease',
    flexShrink: 0,
  }),
  sectionContent: ({ palette }) => ({
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    borderTop: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: 'transparent',
    borderRadius: '0 0 0.5rem 0.5rem',
  }),
});

export default CollapsibleSection;
