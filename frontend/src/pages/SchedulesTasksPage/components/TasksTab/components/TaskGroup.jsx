import { memo, useCallback } from 'react';

import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import { Box, Typography } from '@mui/material';

import { isActivationKey } from '@/pages/SchedulesTasksPage/components/TasksTab/helpers/keyboard.helpers';

import TaskNameItem from './TaskNameItem';

const TaskGroup = memo(props => {
  const {
    group,
    items,
    isOpen,
    isToggleable = true,
    onToggle,
    taskDescriptions,
    selectedTask,
    runningCounts,
    onSelect,
  } = props;

  const styles = taskGroupStyles();

  const handleToggle = useCallback(() => {
    if (isToggleable) onToggle(group);
  }, [isToggleable, onToggle, group]);

  const handleKeyDown = useCallback(
    event => {
      if (!isToggleable || !isActivationKey(event)) return;
      event.preventDefault();
      onToggle(group);
    },
    [isToggleable, onToggle, group],
  );

  return (
    <Box sx={styles.container}>
      <Box
        sx={styles.header}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role={isToggleable ? 'button' : undefined}
        tabIndex={isToggleable ? 0 : undefined}
        aria-expanded={isToggleable ? isOpen : undefined}
      >
        {isOpen ? <KeyboardArrowDown sx={styles.chevron} /> : <KeyboardArrowRight sx={styles.chevron} />}
        <Typography
          variant="bodySmall"
          sx={styles.name}
        >
          {group}
        </Typography>
        <Box sx={styles.countChip}>{items.length}</Box>
      </Box>

      {isOpen &&
        items.map(name => (
          <TaskNameItem
            key={name}
            name={name}
            description={taskDescriptions[name]}
            isSelected={selectedTask === name}
            runningCount={runningCounts[name]}
            onSelect={onSelect}
          />
        ))}
    </Box>
  );
});

TaskGroup.displayName = 'TaskGroup';

/** @type {MuiSx} */
const taskGroupStyles = () => ({
  container: ({ palette }) => ({
    marginBottom: '0.25rem',
    borderRadius: '0.375rem',
    border: `0.0625rem solid ${palette.border.subtle.strong}`,
    overflow: 'hidden',
  }),
  header: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.4375rem 0.5rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.background.subtle.raised,
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
    '&:focus-visible': {
      outline: `0.125rem solid ${palette.primary.main}`,
      outlineOffset: '-0.125rem',
    },
  }),
  chevron: {
    fontSize: '1.125rem',
    color: 'text.secondary',
    marginRight: '0.25rem',
    flexShrink: 0,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontWeight: 600,
    fontSize: '0.75rem',
    whiteSpace: 'normal',
    wordBreak: 'break-word',
  },
  countChip: ({ palette }) => ({
    minWidth: '1.375rem',
    height: '1.125rem',
    borderRadius: '0.5625rem',
    backgroundColor: palette.background.subtle.strong,
    color: palette.text.secondary,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.6875rem',
    fontWeight: 600,
    flexShrink: 0,
    marginLeft: '0.5rem',
    padding: '0 0.375rem',
  }),
});

export default TaskGroup;
