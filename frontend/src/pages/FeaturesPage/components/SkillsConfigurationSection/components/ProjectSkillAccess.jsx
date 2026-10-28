import { memo, useCallback } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, Switch, Tooltip, Typography } from '@mui/material';

import { PROJECT_SKILLS_FIELD_KEY } from '../constants/skillsConfiguration.constants';

const PROJECT_SKILLS_TOOLTIP =
  'When enabled, project skills can be resolved and used on demand without being added as chat participants. Existing access permissions and applicable skill limits still apply. This does not automatically load every project skill into a chat.';

const ProjectSkillAccess = memo(props => {
  const { values, onChange } = props;

  const styles = projectSkillAccessStyles();

  const enabled = values?.[PROJECT_SKILLS_FIELD_KEY] === true;

  const handleToggle = useCallback(e => onChange(PROJECT_SKILLS_FIELD_KEY, e.target.checked), [onChange]);

  return (
    <Box sx={styles.toggleCard}>
      <Box sx={styles.toggleRow}>
        <Box sx={styles.toggleLabel}>
          <Box sx={styles.titleRow}>
            <Typography
              variant="body2"
              sx={styles.toggleTitle}
            >
              Allow project skills without chat participation
            </Typography>
            <Tooltip
              title={PROJECT_SKILLS_TOOLTIP}
              arrow
              placement="top"
            >
              <InfoOutlinedIcon
                sx={styles.infoIcon}
                aria-label="About project skills without chat participation"
              />
            </Tooltip>
          </Box>
          <Typography
            variant="caption"
            sx={styles.toggleHint}
          >
            Allow chats to load and invoke accessible skills from their project without adding those skills as
            chat participants.
          </Typography>
        </Box>
        <Switch
          checked={enabled}
          onChange={handleToggle}
          slotProps={{ input: { 'aria-label': 'Allow project skills without chat participation' } }}
        />
      </Box>
    </Box>
  );
});

ProjectSkillAccess.displayName = 'ProjectSkillAccess';

/** @type {MuiSx} */
const projectSkillAccessStyles = () => ({
  toggleCard: ({ palette }) => ({
    border: `0.0625rem solid ${palette.border.table}`,
    borderRadius: '0.5rem',
    overflow: 'hidden',
  }),
  toggleRow: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '1rem 1.25rem',
    backgroundColor: palette.background.tabPanel,
  }),
  toggleLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  toggleTitle: {
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  toggleHint: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
  }),
  infoIcon: ({ palette }) => ({
    fontSize: '0.875rem',
    color: palette.text.secondary,
    cursor: 'help',
  }),
});

export default ProjectSkillAccess;
