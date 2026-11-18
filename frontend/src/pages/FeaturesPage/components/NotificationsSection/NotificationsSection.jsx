import { memo } from 'react';

import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/pages/FeaturesPage/hooks/useExpandedBlocks.hooks';

const NotificationsSection = memo(props => {
  const { notificationsDraft, notificationsFields, initialBlock } = props;
  const { expanded, toggle } = useExpandedBlocks(initialBlock);
  const styles = notificationsSectionStyles();

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={NotificationsOutlinedIcon}
        title="Project Membership"
        count={notificationsFields.length}
        expanded={!!expanded.project_membership}
        sectionId="project_membership"
        onToggle={toggle}
        keepMounted
      >
        <GuardrailsSection
          fields={notificationsFields}
          values={notificationsDraft.values}
          onChange={notificationsDraft.onChange}
        />
      </CollapsibleSection>
    </Box>
  );
});

NotificationsSection.displayName = 'NotificationsSection';

/** @type {MuiSx} */
const notificationsSectionStyles = () => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '1.5rem',
  },
});

export default NotificationsSection;
