import { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';

import ActionFieldCard from './components/ActionFieldCard';
import FieldCard from './components/FieldCard';
import { buildPylonLabels } from './helpers/schemaForm.helpers';

const SchemaForm = memo(props => {
  const { fields, values, sectionDescription, onChange, onAction } = props;

  const styles = schemaFormStyles();

  const visibleFields = useMemo(() => {
    return fields.filter(field => {
      if (!field.visible_when) return true;
      const conditions = Array.isArray(field.visible_when) ? field.visible_when : [field.visible_when];
      return conditions.every(({ field: condField, value: condValue }) => {
        const currentValue = values[condField];
        if (typeof currentValue === 'string' && typeof condValue === 'string') {
          return currentValue.toLowerCase() === condValue.toLowerCase();
        }
        return currentValue === condValue;
      });
    });
  }, [fields, values]);

  const pylonGroups = useMemo(() => {
    const pylonIds = new Set(visibleFields.map(f => f.pylon_id).filter(Boolean));
    if (pylonIds.size <= 1) return null;
    const groups = {};
    for (const field of visibleFields) {
      const pid = field.pylon_id || '_unknown';
      if (!groups[pid]) groups[pid] = [];
      groups[pid].push(field);
    }
    const labels = buildPylonLabels([...pylonIds]);
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([pid, fields_]) => ({
        pylonId: pid,
        label: labels[pid] || pid,
        fields: fields_,
      }));
  }, [visibleFields]);

  if (visibleFields.length === 0) {
    return (
      <Box sx={styles.empty}>
        <Typography
          variant="body2"
          color="text.metrics"
        >
          No configurable fields available for this section.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {sectionDescription && (
        <Typography
          variant="body2"
          sx={styles.sectionDescription}
        >
          {sectionDescription}
        </Typography>
      )}
      {pylonGroups
        ? pylonGroups.map(group => (
            <Box
              key={group.pylonId}
              sx={styles.pylonGroup}
            >
              <Box sx={styles.pylonHeader}>
                <Typography
                  variant="caption"
                  sx={styles.pylonLabel}
                >
                  {group.label}
                </Typography>
                <Box sx={styles.pylonLine} />
              </Box>
              {group.fields.map(field =>
                field.type === 'action' ? (
                  <ActionFieldCard
                    key={field.key}
                    field={field}
                    onAction={onAction}
                  />
                ) : (
                  <FieldCard
                    key={field.key}
                    field={field}
                    values={values}
                    onChange={onChange}
                  />
                ),
              )}
            </Box>
          ))
        : visibleFields.map(field =>
            field.type === 'action' ? (
              <ActionFieldCard
                key={field.key}
                field={field}
                onAction={onAction}
              />
            ) : (
              <FieldCard
                key={field.key}
                field={field}
                values={values}
                onChange={onChange}
              />
            ),
          )}
    </Box>
  );
});

SchemaForm.displayName = 'SchemaForm';

/** @type {MuiSx} */
const schemaFormStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    height: '100%',
  },
  sectionDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.8125rem',
    lineHeight: 1.6,
    marginBottom: '0.25rem',
  }),
  empty: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem',
  },
  pylonGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  pylonHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginTop: '0.25rem',
  },
  pylonLabel: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.6875rem',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    whiteSpace: 'nowrap',
  }),
  pylonLine: ({ palette }) => ({
    flex: 1,
    height: 0,
    borderTop: `0.0625rem solid ${palette.border.table}`,
  }),
});

export default SchemaForm;
