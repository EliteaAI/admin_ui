import { memo, useMemo, useState } from 'react';
import PropTypes from 'prop-types';

import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import ExpandMoreOutlined from '@mui/icons-material/ExpandMoreOutlined';

import { useProjectUserListQuery, useProjectUserActivityQuery } from '@/api/projectsApi';

const UserActivityHeatmap = memo(function UserActivityHeatmap({
  projectId,
  dateFrom,
  dateTo,
}) {
  const [expanded, setExpanded] = useState(false);

  // Only fetch data when accordion is expanded (lazy loading)
  const skip = !projectId || !expanded;

  const { data: usersData, isFetching: usersFetching } = useProjectUserListQuery(
    { projectId },
    { skip },
  );

  const { data: activityData, isFetching: activityFetching } = useProjectUserActivityQuery(
    {
      project_id: projectId,
      date_from: dateFrom,
      date_to: dateTo,
    },
    { skip, refetchOnMountOrArgChange: true },
  );

  const isFetching = usersFetching || activityFetching;

  const members = useMemo(() => {
    if (!usersData?.rows) return [];
    const activityMap = new Map();
    if (activityData?.rows) {
      for (const row of activityData.rows) {
        activityMap.set(row.user_id, row.event_count);
      }
    }
    return usersData.rows.map((user) => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      eventCount: activityMap.get(user.id) || 0,
      isActive: activityMap.has(user.id),
    }));
  }, [usersData, activityData]);

  const activeCount = expanded ? members.filter((m) => m.isActive).length : 0;
  const totalCount = expanded ? members.length : 0;

  const handleToggle = (_, isExpanded) => {
    setExpanded(isExpanded);
  };

  return (
    <Accordion
      expanded={expanded}
      onChange={handleToggle}
      disableGutters
      elevation={0}
      sx={styles.accordion}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreOutlined sx={{ color: 'text.secondary', fontSize: '1.25rem' }} />}
        sx={styles.summary}
      >
        <Typography variant="caption" sx={styles.title}>
          User Activity
          {expanded && !isFetching && totalCount > 0
            ? ` \u00b7 ${activeCount} / ${totalCount} active`
            : ''}
        </Typography>
      </AccordionSummary>
      <AccordionDetails sx={styles.details}>
        {isFetching ? (
          <Box sx={styles.loadingContainer}>
            <CircularProgress size={20} />
          </Box>
        ) : members.length === 0 ? (
          <Typography variant="caption" color="text.default">
            No users found
          </Typography>
        ) : (
          <Box sx={styles.gridScroll}>
            <Box sx={styles.grid}>
              {members.map((member) => (
                <Tooltip
                  key={member.id}
                  title={
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                        {member.name}
                      </Typography>
                      <Typography variant="caption">
                        {member.email}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block' }}>
                        {member.eventCount > 0
                          ? `${member.eventCount} event${member.eventCount !== 1 ? 's' : ''}`
                          : 'No activity'}
                      </Typography>
                    </Box>
                  }
                  arrow
                >
                  <Box
                    sx={[
                      styles.square,
                      member.isActive ? styles.activeSquare : styles.inactiveSquare,
                    ]}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
});

const styles = {
  accordion: ({ palette }) => ({
    backgroundColor: 'transparent',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    '&::before': { display: 'none' },
    '&.Mui-expanded': { margin: 0 },
  }),
  summary: {
    minHeight: '2.25rem',
    padding: '0 1.5rem',
    '&.Mui-expanded': { minHeight: '2.25rem' },
    '& .MuiAccordionSummary-content': {
      margin: '0.375rem 0',
      '&.Mui-expanded': { margin: '0.375rem 0' },
    },
  },
  details: {
    padding: '0 1.5rem 0.75rem',
  },
  title: {
    color: 'text.secondary',
    fontSize: '0.6875rem',
  },
  loadingContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '1rem',
  },
  gridScroll: {
    maxHeight: '15rem',
    overflowY: 'auto',
    scrollbarWidth: 'thin',
  },
  grid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.25rem',
  },
  square: {
    width: '1.25rem',
    height: '1.25rem',
    borderRadius: '0.1875rem',
    cursor: 'pointer',
    transition: 'transform 0.1s ease',
    '&:hover': {
      transform: 'scale(1.2)',
    },
  },
  activeSquare: ({ palette }) => ({
    backgroundColor: palette.mode === 'dark' ? '#22c55e' : '#16a34a',
  }),
  inactiveSquare: ({ palette }) => ({
    backgroundColor: palette.mode === 'dark' ? '#374151' : '#e5e7eb',
    border: `1px solid ${palette.mode === 'dark' ? '#4b5563' : '#d1d5db'}`,
  }),
};

UserActivityHeatmap.propTypes = {
  projectId: PropTypes.number,
  dateFrom: PropTypes.string,
  dateTo: PropTypes.string,
};

export default UserActivityHeatmap;
