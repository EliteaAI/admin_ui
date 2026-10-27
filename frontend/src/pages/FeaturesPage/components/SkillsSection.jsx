import { memo, useCallback } from 'react';

import { Box, Switch, Typography } from '@mui/material';

const SkillsSection = memo(props => {
  const { values, onChange } = props;

  const styles = skillsSectionStyles();

  const projectSkillsAvailable = values?.project_skills_in_chat_available === true;
  const projectSkillsOnByDefault = values?.project_skills_in_chat_project_default === true;

  const handleAvailableToggle = useCallback(
    () => onChange('project_skills_in_chat_available', !projectSkillsAvailable),
    [onChange, projectSkillsAvailable],
  );

  const handleProjectDefaultToggle = useCallback(
    () => onChange('project_skills_in_chat_project_default', !projectSkillsOnByDefault),
    [onChange, projectSkillsOnByDefault],
  );

  return (
    <Box sx={styles.root}>
      <Typography
        variant="body2"
        sx={styles.description}
      >
        Project skills in chat offer every skill of a project to its model and agent chats, without adding
        each skill as a chat participant. The model finds a skill by searching the project and loads it only
        when it applies.
      </Typography>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography
              variant="body2"
              sx={styles.cardTitle}
            >
              Allow project skills in chat
            </Typography>
            <Typography
              variant="caption"
              sx={styles.cardHint}
            >
              Master switch for the whole environment. While it is off, no project can turn the feature on.
            </Typography>
          </Box>
          <Switch
            checked={projectSkillsAvailable}
            onChange={handleAvailableToggle}
            inputProps={{ 'aria-label': 'Allow project skills in chat' }}
          />
        </Box>
      </Box>

      <Box sx={styles.card}>
        <Box sx={styles.cardRow}>
          <Box sx={styles.cardLabel}>
            <Typography
              variant="body2"
              sx={styles.cardTitle}
            >
              On by default for projects
            </Typography>
            <Typography
              variant="caption"
              sx={styles.cardHint}
            >
              Applies to every project whose admins have not chosen On or Off for their own project.
            </Typography>
          </Box>
          <Switch
            checked={projectSkillsOnByDefault}
            onChange={handleProjectDefaultToggle}
            disabled={!projectSkillsAvailable}
            inputProps={{ 'aria-label': 'On by default for projects' }}
          />
        </Box>
      </Box>
    </Box>
  );
});

SkillsSection.displayName = 'SkillsSection';

const skillsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    padding: '1.5rem',
  },
  description: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
  }),
  card: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  cardRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  cardLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  cardTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  cardHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
});

export default SkillsSection;
