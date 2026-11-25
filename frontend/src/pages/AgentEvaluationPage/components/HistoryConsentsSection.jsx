import { memo } from 'react';

import { Box, Chip, List, ListItem, Skeleton, Typography } from '@mui/material';

import { useEvalAutoHistoryConsentsQuery } from '@/api/evalAuto.api';

const HistoryConsentsSection = memo(() => {
  const styles = historyConsentsSectionStyles();

  const { data, isLoading, isError } = useEvalAutoHistoryConsentsQuery();
  const projects = data?.projects ?? [];

  return (
    <Box
      sx={styles.root}
      data-testid="eval-auto-history-consents"
    >
      <Typography variant="headingSmall">Projects that allow evaluation from chat history</Typography>
      <Typography
        variant="bodySmall"
        color="text.secondary"
      >
        Project admins turn this on in their project settings. History and hybrid modes score only these
        projects from their chats.
      </Typography>
      {isLoading && (
        <Skeleton
          variant="rectangular"
          height="3rem"
        />
      )}
      {isError && (
        <Typography
          variant="bodySmall"
          color="error"
        >
          Could not load the projects.
        </Typography>
      )}
      {!isLoading && !isError && !projects.length && (
        <Typography
          variant="bodySmall"
          color="text.secondary"
          data-testid="eval-auto-history-consents-empty"
        >
          No project allows it yet.
        </Typography>
      )}
      {projects.length > 0 && (
        <List
          dense
          disablePadding
        >
          {projects.map(project => (
            <ListItem
              key={project.project_id}
              disableGutters
              sx={styles.item}
              data-testid={`eval-auto-history-consent-${project.project_id}`}
            >
              <Typography variant="bodyMedium">{project.name || `Project ${project.project_id}`}</Typography>
              <Typography
                variant="bodySmall"
                color="text.secondary"
              >
                id {project.project_id}
              </Typography>
              <Chip
                size="small"
                variant="outlined"
                label={project.in_scope ? 'In scope' : 'Out of scope'}
                color={project.in_scope ? 'primary' : 'default'}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
});

HistoryConsentsSection.displayName = 'HistoryConsentsSection';

/** @type {MuiSx} */
const historyConsentsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
});

export default HistoryConsentsSection;
