import { memo, useMemo } from 'react';

import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

import ProjectSkillAccess from './components/ProjectSkillAccess';
import { SKILL_LIMIT_FIELD_KEYS } from './constants/skillsConfiguration.constants';

const PROJECT_SKILL_ACCESS_SETTINGS_COUNT = 1;

const SkillsConfigurationSection = memo(props => {
  const { skillsDraft, skillsFields, initialBlock } = props;

  const styles = skillsConfigurationSectionStyles();

  const { expanded, toggle } = useExpandedBlocks(initialBlock);

  const limitFields = useMemo(
    () => SKILL_LIMIT_FIELD_KEYS.map(key => skillsFields.find(f => f.key === key)).filter(Boolean),
    [skillsFields],
  );

  const blocks = useMemo(
    () => [
      {
        id: 'skill_limits',
        title: 'Skill Limits',
        icon: TuneOutlinedIcon,
        count: limitFields.length,
        content: (
          <GuardrailsSection
            fields={limitFields}
            values={skillsDraft.values}
            onChange={skillsDraft.onChange}
          />
        ),
      },
      {
        id: 'project_skill_access',
        title: 'Project Skill Access',
        icon: FolderSharedOutlinedIcon,
        count: PROJECT_SKILL_ACCESS_SETTINGS_COUNT,
        content: (
          <ProjectSkillAccess
            values={skillsDraft.values}
            onChange={skillsDraft.onChange}
          />
        ),
      },
    ],
    [skillsDraft, limitFields],
  );

  return (
    <Box sx={styles.root}>
      {blocks.map(block => (
        <CollapsibleSection
          key={block.id}
          icon={block.icon}
          title={block.title}
          count={block.count}
          expanded={!!expanded[block.id]}
          sectionId={block.id}
          onToggle={toggle}
          keepMounted
        >
          {block.content}
        </CollapsibleSection>
      ))}
    </Box>
  );
});

SkillsConfigurationSection.displayName = 'SkillsConfigurationSection';

/** @type {MuiSx} */
const skillsConfigurationSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default SkillsConfigurationSection;
