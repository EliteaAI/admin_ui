import { memo, useMemo } from 'react';

import DetailSection from '@/pages/GovernancePage/components/DetailSection';
import DrawerShell from '@/pages/GovernancePage/components/DrawerShell';

/**
 * One record in full, as titled sections of label / value pairs (`sections` is `[{ key, title, fields }]`, see
 * `DetailSection`). The sections get the test ids `<testIdPrefix>-section-<key>`.
 */
const DetailDrawer = memo(props => {
  const { open, onClose, title, subtitle, testId, testIdPrefix, sections, errorText, notice } = props;

  const rows = useMemo(
    () =>
      sections.map(section => ({
        key: section.key,
        testId: `${testIdPrefix}-section-${section.key}`,
        content: (
          <DetailSection
            title={section.title}
            fields={section.fields}
            testIdPrefix={testIdPrefix}
          />
        ),
      })),
    [sections, testIdPrefix],
  );

  return (
    <DrawerShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      testId={testId}
      isLoading={false}
      errorText={errorText}
      notice={notice}
      rows={rows}
    />
  );
});

DetailDrawer.displayName = 'DetailDrawer';

export default DetailDrawer;
