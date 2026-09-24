import { memo, useCallback, useMemo, useState } from 'react';

import { Box, Skeleton, Typography } from '@mui/material';

import { groupTasks } from '@/pages/SchedulesTasksPage/components/TasksTab/helpers/groupTasks.helpers';
import { DEFAULT_EXPANDED_GROUP } from '@/pages/SchedulesTasksPage/components/TasksTab/helpers/taskGroups.constants';

import TaskGroup from './TaskGroup';

const TaskNamesList = memo(props => {
  const {
    taskNames,
    taskDescriptions = {},
    groupsMap = {},
    selectedTask,
    onSelect,
    isLoading,
    runningCounts,
    search = '',
  } = props;

  const styles = taskNamesListStyles();

  const [expanded, setExpanded] = useState({ [DEFAULT_EXPANDED_GROUP]: true });

  const lowerSearch = search.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    const allGroups = groupTasks(taskNames, groupsMap);
    if (!lowerSearch) return allGroups;
    return allGroups
      .map(({ group, items }) => ({
        group,
        items: items.filter(name => {
          const nameMatch = name.toLowerCase().includes(lowerSearch);
          const descMatch = (taskDescriptions[name] || '').toLowerCase().includes(lowerSearch);
          return nameMatch || descMatch;
        }),
      }))
      .filter(({ items }) => items.length > 0);
  }, [taskNames, groupsMap, taskDescriptions, lowerSearch]);

  const groups = useMemo(
    () => (lowerSearch ? filteredGroups : groupTasks(taskNames, groupsMap)),
    [taskNames, groupsMap, lowerSearch, filteredGroups],
  );

  const toggleGroup = useCallback(group => {
    setExpanded(prev => ({ ...prev, [group]: !prev[group] }));
  }, []);

  return (
    <Box sx={styles.container}>
      <Typography
        variant="bodySmall"
        color="text.metrics"
        sx={styles.header}
      >
        Available Tasks
      </Typography>
      <Box sx={styles.list}>
        {isLoading ? (
          Array.from({ length: 10 }).map((_, i) => (
            <Skeleton
              key={i}
              variant="rectangular"
              width="100%"
              height="2rem"
              sx={styles.listItemButton}
            />
          ))
        ) : groups.length === 0 ? (
          <Typography
            variant="caption"
            sx={styles.emptyState}
          >
            {lowerSearch ? 'No matching tasks' : 'No tasks available'}
          </Typography>
        ) : (
          groups.map(({ group, items }) => (
            <TaskGroup
              key={group}
              group={group}
              items={items}
              isOpen={lowerSearch ? true : !!expanded[group]}
              isToggleable={!lowerSearch}
              onToggle={toggleGroup}
              taskDescriptions={taskDescriptions}
              selectedTask={selectedTask}
              runningCounts={runningCounts}
              onSelect={onSelect}
            />
          ))
        )}
      </Box>
    </Box>
  );
});

TaskNamesList.displayName = 'TaskNamesList';

/** @type {MuiSx} */
const taskNamesListStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    overflow: 'hidden',
  },
  header: {
    padding: '0.75rem 0.75rem 0.5rem',
    fontWeight: 600,
    fontSize: '0.6875rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  list: {
    flex: 1,
    overflow: 'auto',
    padding: '0 0.375rem 0.5rem',
  },
  emptyState: ({ palette }) => ({
    color: palette.text.disabled,
    fontSize: '0.75rem',
    padding: '0.75rem 0.25rem',
  }),
  listItemButton: {
    marginBottom: '0.25rem',
    borderRadius: '0.25rem',
  },
});

export default TaskNamesList;
