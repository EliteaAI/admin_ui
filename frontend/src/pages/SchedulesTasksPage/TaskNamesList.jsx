import { memo } from 'react';

import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

const TaskNamesList = memo(function TaskNamesList({
  taskNames,
  taskDescriptions = {},
  selectedTask,
  onSelect,
  isLoading,
  runningCounts,
}) {
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
          : taskNames.map((name) => {
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
  item: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.5rem 0.625rem',
    borderRadius: '0.375rem',
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
