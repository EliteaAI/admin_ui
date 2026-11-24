import { memo, useMemo } from 'react';

import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Box } from '@mui/material';

import { CollapsibleSection } from '@/components/CollapsibleSection';
import { GuardrailsSection } from '@/components/SchemaForm';
import { useExpandedBlocks } from '@/hooks/useExpandedBlocks.hooks';

const PROJECT_MEMBERSHIP_FIELD_KEYS = ['project_membership_on_added', 'project_membership_on_removed'];

const NotificationsSection = memo(props => {
  const { notificationsDraft, notificationsFields, initialBlock } = props;
  const { expanded, toggle } = useExpandedBlocks(initialBlock);
  const styles = notificationsSectionStyles();

  const fields = useMemo(
    () =>
      PROJECT_MEMBERSHIP_FIELD_KEYS.map(key => notificationsFields.find(field => field.key === key)).filter(
        Boolean,
      ),
    [notificationsFields],
  );

  return (
    <Box sx={styles.root}>
      <CollapsibleSection
        icon={NotificationsOutlinedIcon}
        title="Project Membership"
        count={fields.length}
        expanded={!!expanded.project_membership}
        sectionId="project_membership"
        onToggle={toggle}
        keepMounted
      >
        <GuardrailsSection
          fields={fields}
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
