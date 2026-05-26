import { memo, useCallback, useMemo, useState } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

import { groupTasks } from './groupTasks';

const TaskNamesList = memo(function TaskNamesList({
  taskNames,
  taskDescriptions = {},
  groupsMap = {},
  selectedTask,
  onSelect,
  isLoading,
  runningCounts,
}) {
  const [expanded, setExpanded] = useState({ General: true });

  const groups = useMemo(
    () => groupTasks(taskNames, groupsMap),
    [taskNames, groupsMap],
  );

  const toggleGroup = useCallback((group) => {
    setExpanded((prev) => ({ ...prev, [group]: !prev[group] }));
  }, []);

  return (
    <Box sx={styles.container}>
      <Typography variant="bodySmall" color="text.metrics" sx={styles.header}>
        Available Tasks
      </Typography>
      <Box sx={styles.list}>
        {isLoading
          ? Array.from({ length: 10 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                width="100%"
                height="2rem"
                sx={{ mb: '0.25rem', borderRadius: '0.25rem' }}
              />
            ))
          : groups.map(({ group, items }) => {
              const isOpen = !!expanded[group];
              return (
                <Box key={group} sx={styles.groupContainer}>
                  <Box
                    sx={styles.groupHeader}
                    onClick={() => toggleGroup(group)}
                  >
                    {isOpen ? (
                      <KeyboardArrowDown sx={styles.chevron} />
                    ) : (
                      <KeyboardArrowRight sx={styles.chevron} />
                    )}
                    <Typography variant="bodySmall" sx={styles.groupName} noWrap>
                      {group}
                    </Typography>
                    <Box sx={styles.countChip}>{items.length}</Box>
                  </Box>

                  {isOpen &&
                    items.map((name) => {
                      const isSelected = selectedTask === name;
                      const count = runningCounts[name] || 0;
                      const desc = taskDescriptions[name];
                      const item = (
                        <Box
                          key={name}
                          onClick={() => onSelect(isSelected ? null : name)}
                          sx={[styles.item, isSelected && styles.itemSelected]}
                        >
                          <Typography variant="bodySmall" sx={styles.itemText} noWrap>
                            {name}
                          </Typography>
                          {count > 0 && <Box sx={styles.badge}>{count}</Box>}
                        </Box>
                      );
                      return desc ? (
                        <Tooltip key={name} title={desc} placement="right" arrow>
                          {item}
                        </Tooltip>
                      ) : item;
                    })}
                </Box>
              );
            })}
      </Box>
    </Box>
  );
});

const styles = {
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
  groupContainer: ({ palette }) => ({
    marginBottom: '0.25rem',
    borderRadius: '0.375rem',
    border: `1px solid ${palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'}`,
    overflow: 'hidden',
  }),
  groupHeader: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: '0.4375rem 0.5rem',
    cursor: 'pointer',
    userSelect: 'none',
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
    '&:hover': {
      backgroundColor: palette.action.hover,
    },
  }),
  chevron: {
    fontSize: '1.125rem',
    color: 'text.secondary',
    marginRight: '0.25rem',
    flexShrink: 0,
  },
  groupName: {
    flex: 1,
    fontWeight: 600,
    fontSize: '0.75rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  countChip: ({ palette }) => ({
    minWidth: '1.375rem',
    height: '1.125rem',
    borderRadius: '0.5625rem',
    backgroundColor: palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
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
  }),
  itemSelected: ({ palette }) => ({
    backgroundColor: palette.action.selected,
    '&:hover': {
      backgroundColor: palette.action.selected,
    },
  }),
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
};

export default TaskNamesList;
