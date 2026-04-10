import { memo, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchemaField from './SchemaField';

const UUID_RE = /_([a-f0-9]{8})-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

function pylonBaseName(pylonId) {
  if (!pylonId) return '';
  return pylonId.replace(UUID_RE, '');
}

function buildPylonLabels(pylonIds) {
  const bases = {};
  for (const pid of pylonIds) {
    const base = pylonBaseName(pid);
    if (!bases[base]) bases[base] = [];
    bases[base].push(pid);
  }
  const labels = {};
  for (const [base, pids] of Object.entries(bases)) {
    if (pids.length === 1) {
      labels[pids[0]] = base;
    } else {
      for (const pid of pids) {
        const match = pid.match(UUID_RE);
        const short = match ? match[1] : '';
        labels[pid] = `${base} (${short})`;
      }
    }
  }
  return labels;
}

// Check if a field renders a JSON editor (should expand to fill space)
const isJsonEditor = (field) => {
  if (field.type === 'object' && !field.additionalProperties?.type) return true;
  if (field.type === 'array' && field.items?.type !== 'string' &&
      !(field.items?.type === 'object' && field.items?.properties?.login)) return true;
  return false;
};

function ActionFieldCard({ field, onAction }) {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState(null);

  const handleClick = async () => {
    setRunning(true);
    setResult(null);
    try {
      await onAction?.(field);
      setResult({ ok: true, message: 'Task started' });
    } catch (err) {
      setResult({ ok: false, message: err?.message || 'Failed to start task' });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Box sx={styles.fieldCard}>
      <Box sx={styles.fieldHeader}>
        <Box sx={styles.fieldTitleRow}>
          <Typography variant="body2" sx={styles.fieldTitle}>
            {field.title || field.key}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          size="small"
          startIcon={running ? <CircularProgress size={14} /> : <PlayArrowIcon sx={{ fontSize: '0.875rem' }} />}
          onClick={handleClick}
          disabled={running}
          sx={styles.actionButton}
        >
          {running ? 'Running...' : 'Run'}
        </Button>
      </Box>
      {field.description && (
        <Typography variant="caption" sx={styles.fieldDescription}>
          {field.description}
        </Typography>
      )}
      {result && (
        <Typography
          variant="caption"
          sx={{ color: result.ok ? 'success.main' : 'error.main', mt: 0.25 }}
        >
          {result.message}
        </Typography>
      )}
    </Box>
  );
}

function FieldCard({ field, values, onChange }) {
  const isBoolean = field.type === 'boolean';
  const expandable = isJsonEditor(field);

  return (
    <Box sx={[styles.fieldCard, expandable && styles.fieldCardExpand]}>
      <Box sx={styles.fieldHeader}>
        <Box sx={styles.fieldTitleRow}>
          <Typography variant="body2" sx={styles.fieldTitle}>
            {field.title || field.key}
          </Typography>
          {field.requires_restart && (
            <Chip
              label="Reload required"
              size="small"
              color="warning"
              variant="outlined"
              sx={styles.restartChip}
            />
          )}
        </Box>
        {isBoolean && (
          <Switch
            checked={!!values[field.key]}
            onChange={(e) => onChange(field.key, e.target.checked)}
            size="small"
          />
        )}
      </Box>
      {field.description && (
        <Typography variant="caption" sx={styles.fieldDescription}>
          {field.description}
        </Typography>
      )}
      {!isBoolean && (
        <Box sx={[styles.fieldControl, expandable && styles.fieldControlExpand]}>
          <SchemaField
            field={field}
            value={values[field.key]}
            onChange={(val) => onChange(field.key, val)}
          />
        </Box>
      )}
    </Box>
  );
}

const SchemaForm = memo(function SchemaForm({ fields, values, sectionDescription, onChange, onAction }) {
  const visibleFields = useMemo(() => {
    return fields.filter((field) => {
      if (!field.visible_when) return true;
      const conditions = Array.isArray(field.visible_when)
        ? field.visible_when
        : [field.visible_when];
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
    const pylonIds = new Set(visibleFields.map((f) => f.pylon_id).filter(Boolean));
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
      .map(([pid, fields_]) => ({ pylonId: pid, label: labels[pid] || pid, fields: fields_ }));
  }, [visibleFields]);

  if (visibleFields.length === 0) {
    return (
      <Box sx={styles.empty}>
        <Typography variant="body2" color="text.metrics">
          No configurable fields available for this section.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={styles.container}>
      {sectionDescription && (
        <Typography variant="body2" sx={styles.sectionDescription}>
          {sectionDescription}
        </Typography>
      )}
      {pylonGroups ? (
        pylonGroups.map((group) => (
          <Box key={group.pylonId} sx={styles.pylonGroup}>
            <Box sx={styles.pylonHeader}>
              <Typography variant="caption" sx={styles.pylonLabel}>
                {group.label}
              </Typography>
              <Box sx={styles.pylonLine} />
            </Box>
            {group.fields.map((field) => (
              field.type === 'action'
                ? <ActionFieldCard key={field.key} field={field} onAction={onAction} />
                : <FieldCard key={field.key} field={field} values={values} onChange={onChange} />
            ))}
          </Box>
        ))
      ) : (
        visibleFields.map((field) => (
          field.type === 'action'
            ? <ActionFieldCard key={field.key} field={field} onAction={onAction} />
            : <FieldCard key={field.key} field={field} values={values} onChange={onChange} />
        ))
      )}
    </Box>
  );
});

const styles = {
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
  fieldCard: ({ palette }) => ({
    padding: '0.875rem 1rem',
    borderRadius: '0.5rem',
    border: `1px solid ${palette.border.table}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  }),
  fieldHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.75rem',
    minHeight: '1.75rem',
  },
  fieldTitleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  fieldTitle: ({ palette }) => ({
    fontWeight: 600,
    fontSize: '0.8125rem',
    color: palette.text.secondary,
  }),
  fieldDescription: ({ palette }) => ({
    color: palette.text.metrics,
    fontSize: '0.75rem',
    lineHeight: 1.5,
  }),
  fieldControl: {
    marginTop: '0.375rem',
  },
  fieldCardExpand: {
    flex: 1,
    minHeight: 0,
  },
  fieldControlExpand: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
  },
  restartChip: {
    fontSize: '0.625rem',
    height: '1.125rem',
    '& .MuiChip-label': {
      padding: '0 0.375rem',
    },
  },
  actionButton: {
    textTransform: 'none',
    fontSize: '0.75rem',
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
    height: '1px',
    backgroundColor: palette.border.table,
  }),
};

export default SchemaForm;
