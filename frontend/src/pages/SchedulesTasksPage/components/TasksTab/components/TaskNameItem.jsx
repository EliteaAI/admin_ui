import { memo, useCallback } from 'react';

import { Box, Tooltip, Typography } from '@mui/material';

import { isActivationKey } from '@/pages/SchedulesTasksPage/components/TasksTab/helpers/keyboard.helpers';

const TaskNameItem = memo(props => {
  const { name, description, isSelected, runningCount = 0, onSelect } = props;

  const styles = taskNameItemStyles();

  const handleSelect = useCallback(() => {
    onSelect(isSelected ? null : name);
  }, [onSelect, isSelected, name]);

  const handleKeyDown = useCallback(
    event => {
      if (!isActivationKey(event)) return;
      event.preventDefault();
      handleSelect();
    },
    [handleSelect],
  );

  return (
    <Tooltip
      title={
        <>
          <Box sx={styles.tooltipName}>{name}</Box>
          {description}
        </>
      }
      placement="right"
      arrow
    >
      <Box
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-pressed={isSelected}
        sx={[styles.item, isSelected && styles.itemSelected]}
      >
        <Typography
          variant="bodySmall"
          sx={styles.itemText}
          noWrap
        >
          {name}
        </Typography>
        {runningCount > 0 && <Box sx={styles.badge}>{runningCount}</Box>}
      </Box>
    </Tooltip>
  );
});

TaskNameItem.displayName = 'TaskNameItem';

/** @type {MuiSx} */
const taskNameItemStyles = () => ({
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.625rem 0.5rem 1.75rem',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '-0.125rem',
    },
  }),
  itemSelected: ({ palette }) => ({
    backgroundColor: palette.action.selected,
    '&:hover': {
      backgroundColor: palette.action.selected,
    },
  }),
  tooltipName: {
    fontWeight: 600,
    wordBreak: 'break-all',
  },
  itemText: {
    fontSize: '0.8125rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  badge: ({ palette }) => ({
    minWidth: '1.25rem',
    height: '1.25rem',
    borderRadius: '0.625rem',
    backgroundColor: palette.success.main,
    color: palette.success.contrastText,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    fontWeight: 600,
    flexShrink: 0,
    marginLeft: '0.5rem',
  }),
});

export default TaskNameItem;
