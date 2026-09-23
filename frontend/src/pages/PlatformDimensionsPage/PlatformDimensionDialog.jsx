import { memo, useCallback, useEffect, useMemo, useState } from 'react';

import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  DEFAULT_EVIDENCE_SCOPE,
  EVIDENCE_SCOPE_OPTIONS,
  IMPORTANCE_OPTIONS,
  IMPORTANCE_WEIGHT_MAP,
  POLARITIES,
  SCALE_TYPE_PRESETS,
  SCALE_TYPE_PRESET_CONFIG,
  SUCCESS_CRITERIA_OPTIONS,
} from './constants';

const PLATFORM_EVALUATORS = [
  { value: 'ai', label: 'AI' },
  { value: 'human', label: 'Human' },
];

const EMPTY_FORM = {
  name: '',
  evaluator: 'ai',
  evaluationInstructions: '',
  evaluationGuidance: '',
  evaluationTarget: { ...DEFAULT_EVIDENCE_SCOPE },
  scaleTypePreset: 'score',
  customMin: '',
  customMax: '',
  polarity: 'higher_better',
  successCriteria: '>=',
  targetValue: '',
  importance: 'medium',
};

const TOOLTIPS = {
  evaluator:
    "Determines how this dimension is evaluated. AI uses the evaluation suite's judge model, Human requires manual review.",
  evaluationInstructions:
    'Instructions used by the judge model to assess this dimension. Describe the expected qualities, behaviors, constraints, or examples the model should consider.',
  evaluationGuidance:
    'Guidance for human reviewers to help them assess responses consistently. Include evaluation criteria, examples, or decision rules.',
  evaluationTarget:
    'Select the parts of the evaluation case or agent configuration that this dimension should assess.',
  scaleType: 'Defines the format used to score this dimension.',
  polarity: 'Defines whether higher or lower values represent better evaluation results.',
  successCriteria: 'Defines how the evaluation score is compared with the target value to determine success.',
  targetValue:
    'The score or rating that must satisfy the selected success criterion for this dimension to pass.',
  importance: 'Indicates how significant this dimension is when interpreting the overall evaluation result.',
  customMin: 'The minimum value for the custom scale.',
  customMax: 'The maximum value for the custom scale.',
};

const PLATFORM_NOTICE =
  'This dimension will be available to all projects in the current platform environment.';

const resolveScalePreset = dimension => {
  const scaleType = dimension.scale_type;
  const min = dimension.scale_min;
  const max = dimension.scale_max;

  if (scaleType === 'binary') return 'pass_fail';
  if (scaleType === 'ordinal' && min === 1 && max === 5) return 'rating';
  if (scaleType === 'continuous' && min === 1 && max === 100) return 'score';
  if (min != null && max != null) return 'custom';
  return 'score';
};

const resolveImportance = weight => {
  if (weight == null) return 'medium';
  for (const [key, val] of Object.entries(IMPORTANCE_WEIGHT_MAP)) {
    if (val === weight) return key;
  }
  return 'medium';
};

const toForm = dimension => {
  const evaluator = dimension.allowed_engines?.[0] || 'ai';
  const scalePreset = resolveScalePreset(dimension);
  const isCustom = scalePreset === 'custom';

  return {
    name: dimension.name ?? '',
    evaluator,
    evaluationInstructions: evaluator === 'ai' ? (dimension.description ?? '') : '',
    evaluationGuidance: evaluator === 'human' ? (dimension.description ?? '') : '',
    evaluationTarget: dimension.evidence_scope ?? { ...DEFAULT_EVIDENCE_SCOPE },
    scaleTypePreset: scalePreset,
    customMin: isCustom ? String(dimension.scale_min ?? '') : '',
    customMax: isCustom ? String(dimension.scale_max ?? '') : '',
    polarity: dimension.polarity ?? 'higher_better',
    successCriteria: dimension.default_target_operator ?? '>=',
    targetValue: dimension.default_target != null ? String(dimension.default_target) : '',
    importance: resolveImportance(dimension.default_weight),
  };
};

const PlatformDimensionDialog = memo(props => {
  const { open, dimension, isSaving, onClose, onSave } = props;

  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  const isEdit = !!dimension;

  useEffect(() => {
    if (!open) return;
    setError('');
    setForm(dimension ? toForm(dimension) : EMPTY_FORM);
  }, [open, dimension]);

  const setField = useCallback(
    field => event => setForm(prev => ({ ...prev, [field]: event.target.value })),
    [],
  );

  const handleEvaluatorChange = useCallback(event => {
    setForm(prev => ({
      ...prev,
      evaluator: event.target.value,
    }));
  }, []);

  const toggleEvaluationTarget = useCallback(key => {
    setForm(prev => ({
      ...prev,
      evaluationTarget: {
        ...prev.evaluationTarget,
        [key]: !prev.evaluationTarget[key],
      },
    }));
  }, []);

  const handleScaleTypeChange = useCallback(event => {
    const value = event.target.value;
    setForm(prev => ({
      ...prev,
      scaleTypePreset: value,
      customMin: value === 'custom' ? '' : prev.customMin,
      customMax: value === 'custom' ? '' : prev.customMax,
    }));
  }, []);

  const isAI = form.evaluator === 'ai';
  const isHuman = form.evaluator === 'human';
  const isPassFail = form.scaleTypePreset === 'pass_fail';
  const isCustomScale = form.scaleTypePreset === 'custom';

  const numbers = useMemo(
    () => ({
      customMin: form.customMin.trim() === '' ? null : Number(form.customMin),
      customMax: form.customMax.trim() === '' ? null : Number(form.customMax),
      targetValue: form.targetValue.trim() === '' ? null : Number(form.targetValue),
    }),
    [form.customMin, form.customMax, form.targetValue],
  );

  const validationError = useMemo(() => {
    if (!form.name.trim()) return 'Name is required.';
    if (isAI && !form.evaluationInstructions.trim())
      return 'Evaluation instructions are required for AI evaluator.';
    if (!Object.values(form.evaluationTarget).some(Boolean))
      return 'At least one evaluation target must be selected.';
    if (isCustomScale) {
      if (numbers.customMin === null || Number.isNaN(numbers.customMin))
        return 'Custom scale minimum is required.';
      if (numbers.customMax === null || Number.isNaN(numbers.customMax))
        return 'Custom scale maximum is required.';
      if (numbers.customMin >= numbers.customMax) return 'Scale minimum must be less than maximum.';
    }
    if (!isPassFail) {
      if (numbers.targetValue === null || Number.isNaN(numbers.targetValue))
        return 'Target value is required.';
    }
    return '';
  }, [form, isAI, isPassFail, isCustomScale, numbers]);

  const handleSave = useCallback(async () => {
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    const presetConfig = SCALE_TYPE_PRESET_CONFIG[form.scaleTypePreset];
    const scaleMin = isCustomScale ? numbers.customMin : presetConfig.min;
    const scaleMax = isCustomScale ? numbers.customMax : presetConfig.max;
    const weight = IMPORTANCE_WEIGHT_MAP[form.importance];
    const hasTarget = !isPassFail && numbers.targetValue !== null;

    const payload = {
      name: form.name.trim(),
      description: isAI ? form.evaluationInstructions.trim() : form.evaluationGuidance.trim() || null,
      allowed_engines: [form.evaluator],
      scale_type: presetConfig.scaleType,
      scale_min: scaleMin,
      scale_max: scaleMax,
      polarity: isPassFail ? 'higher_better' : form.polarity,
      default_weight: weight,
      default_target: hasTarget ? numbers.targetValue : null,
      default_target_operator: hasTarget ? form.successCriteria : null,
    };

    try {
      await onSave(payload);
      onClose();
    } catch (err) {
      setError(err?.data?.error ?? err?.error ?? 'Failed to save the dimension.');
    }
  }, [validationError, form, isAI, isPassFail, isCustomScale, numbers, onSave, onClose]);

  const styles = platformDimensionDialogStyles;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={styles.dialogTitle}>
        {isEdit ? 'Edit Platform Dimension' : 'New Dimension'}
      </DialogTitle>

      <DialogContent>
        <Box sx={styles.content}>
          <TextField
            label="Name"
            value={form.name}
            onChange={setField('name')}
            size="small"
            fullWidth
            required
            variant="standard"
            InputLabelProps={{ sx: styles.inputLabel }}
            InputProps={{ sx: styles.inputBase }}
          />

          <Box sx={styles.platformNotice}>
            <InfoOutlinedIcon sx={styles.platformNoticeIcon} />
            <Typography
              variant="body2"
              sx={styles.platformNoticeText}
            >
              {PLATFORM_NOTICE}
            </Typography>
          </Box>

          <Box sx={styles.verticalSection}>
            <Box sx={styles.sectionLabelRow}>
              <Typography sx={styles.sectionLabel}>Evaluator</Typography>
              <Tooltip
                title={TOOLTIPS.evaluator}
                placement="top"
              >
                <InfoOutlinedIcon sx={styles.infoIcon} />
              </Tooltip>
            </Box>
            {isEdit ? (
              <Box sx={styles.evaluatorTagWrapper}>
                <Typography
                  component="span"
                  sx={styles.evaluatorTag}
                >
                  {PLATFORM_EVALUATORS.find(e => e.value === form.evaluator)?.label || form.evaluator}
                </Typography>
              </Box>
            ) : (
              <RadioGroup
                row
                value={form.evaluator}
                onChange={handleEvaluatorChange}
                sx={styles.radioGroup}
              >
                {PLATFORM_EVALUATORS.map(option => (
                  <FormControlLabel
                    key={option.value}
                    value={option.value}
                    control={<Radio size="small" />}
                    label={<Typography sx={styles.checkboxLabel}>{option.label}</Typography>}
                    sx={styles.radioFormControl}
                  />
                ))}
              </RadioGroup>
            )}
          </Box>

          {isAI && (
            <Box sx={styles.textareaSection}>
              <Box sx={styles.textareaLabelRow}>
                <Typography sx={styles.sectionLabel}>Evaluation Instructions</Typography>
                <Typography
                  component="span"
                  sx={styles.required}
                >
                  *
                </Typography>
                <Tooltip
                  title={TOOLTIPS.evaluationInstructions}
                  placement="top"
                >
                  <InfoOutlinedIcon sx={styles.infoIcon} />
                </Tooltip>
              </Box>
              <TextField
                value={form.evaluationInstructions}
                onChange={setField('evaluationInstructions')}
                size="small"
                fullWidth
                multiline
                minRows={5}
                variant="outlined"
                placeholder="Describe what should lead to higher or lower scores. Include specific qualities, behaviors, or examples that AI should consider when evaluating responses."
                InputProps={{ sx: styles.textareaInput }}
              />
            </Box>
          )}

          {isHuman && (
            <Box sx={styles.textareaSection}>
              <Box sx={styles.textareaLabelRow}>
                <Typography sx={styles.sectionLabel}>Evaluation Guidance (optional)</Typography>
                <Tooltip
                  title={TOOLTIPS.evaluationGuidance}
                  placement="top"
                >
                  <InfoOutlinedIcon sx={styles.infoIcon} />
                </Tooltip>
              </Box>
              <TextField
                value={form.evaluationGuidance}
                onChange={setField('evaluationGuidance')}
                size="small"
                fullWidth
                multiline
                minRows={5}
                variant="outlined"
                placeholder="Provide guidance to help reviewers evaluate responses consistently."
                InputProps={{ sx: styles.textareaInput }}
              />
            </Box>
          )}

          <Box sx={styles.verticalSection}>
            <Box sx={styles.sectionLabelRow}>
              <Typography sx={styles.sectionLabel}>Evaluation Target</Typography>
              <Tooltip
                title={TOOLTIPS.evaluationTarget}
                placement="top"
              >
                <InfoOutlinedIcon sx={styles.infoIcon} />
              </Tooltip>
            </Box>
            <Box sx={styles.checkboxGroup}>
              {EVIDENCE_SCOPE_OPTIONS.map(option => (
                <FormControlLabel
                  key={option.key}
                  control={
                    <Checkbox
                      checked={!!form.evaluationTarget[option.key]}
                      onChange={() => toggleEvaluationTarget(option.key)}
                      size="small"
                    />
                  }
                  label={<Typography sx={styles.checkboxLabel}>{option.label}</Typography>}
                  sx={styles.radioFormControl}
                />
              ))}
            </Box>
          </Box>

          <Box sx={styles.verticalField}>
            <Box sx={styles.fieldLabelRow}>
              <Typography sx={styles.fieldLabel}>Scale Type</Typography>
              <Tooltip
                title={TOOLTIPS.scaleType}
                placement="top"
              >
                <InfoOutlinedIcon sx={styles.infoIcon} />
              </Tooltip>
            </Box>
            <TextField
              select
              value={form.scaleTypePreset}
              onChange={handleScaleTypeChange}
              size="small"
              fullWidth
              variant="outlined"
              SelectProps={{ sx: styles.selectInput }}
            >
              {SCALE_TYPE_PRESETS.map(option => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {isCustomScale && (
            <Box sx={styles.twoColumnRow}>
              <Box sx={styles.verticalField}>
                <Box sx={styles.fieldLabelRow}>
                  <Typography sx={styles.fieldLabel}>Min</Typography>
                  <Typography
                    component="span"
                    sx={styles.required}
                  >
                    *
                  </Typography>
                  <Tooltip
                    title={TOOLTIPS.customMin}
                    placement="top"
                  >
                    <InfoOutlinedIcon sx={styles.infoIcon} />
                  </Tooltip>
                </Box>
                <TextField
                  value={form.customMin}
                  onChange={setField('customMin')}
                  type="number"
                  size="small"
                  fullWidth
                  variant="standard"
                  sx={styles.numberField}
                  InputProps={{ sx: styles.inputBase }}
                />
              </Box>
              <Box sx={styles.verticalField}>
                <Box sx={styles.fieldLabelRow}>
                  <Typography sx={styles.fieldLabel}>Max</Typography>
                  <Typography
                    component="span"
                    sx={styles.required}
                  >
                    *
                  </Typography>
                  <Tooltip
                    title={TOOLTIPS.customMax}
                    placement="top"
                  >
                    <InfoOutlinedIcon sx={styles.infoIcon} />
                  </Tooltip>
                </Box>
                <TextField
                  value={form.customMax}
                  onChange={setField('customMax')}
                  type="number"
                  size="small"
                  fullWidth
                  variant="standard"
                  sx={styles.numberField}
                  InputProps={{ sx: styles.inputBase }}
                />
              </Box>
            </Box>
          )}

          {!isPassFail && (
            <>
              <Box sx={styles.verticalField}>
                <Box sx={styles.fieldLabelRow}>
                  <Typography sx={styles.fieldLabel}>Polarity</Typography>
                  <Tooltip
                    title={TOOLTIPS.polarity}
                    placement="top"
                  >
                    <InfoOutlinedIcon sx={styles.infoIcon} />
                  </Tooltip>
                </Box>
                <TextField
                  select
                  value={form.polarity}
                  onChange={setField('polarity')}
                  size="small"
                  fullWidth
                  variant="outlined"
                  SelectProps={{ sx: styles.selectInput }}
                >
                  {POLARITIES.map(option => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Box>

              <Box sx={styles.twoColumnRow}>
                <Box sx={styles.verticalField}>
                  <Box sx={styles.fieldLabelRow}>
                    <Typography sx={styles.fieldLabel}>Success Criteria</Typography>
                    <Tooltip
                      title={TOOLTIPS.successCriteria}
                      placement="top"
                    >
                      <InfoOutlinedIcon sx={styles.infoIcon} />
                    </Tooltip>
                  </Box>
                  <TextField
                    select
                    value={form.successCriteria}
                    onChange={setField('successCriteria')}
                    size="small"
                    fullWidth
                    variant="outlined"
                    SelectProps={{ sx: styles.selectInput }}
                  >
                    {SUCCESS_CRITERIA_OPTIONS.map(option => (
                      <MenuItem
                        key={option.value}
                        value={option.value}
                      >
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>
                <Box sx={styles.verticalField}>
                  <Box sx={styles.fieldLabelRow}>
                    <Typography sx={styles.fieldLabel}>Target Value</Typography>
                    <Typography
                      component="span"
                      sx={styles.required}
                    >
                      *
                    </Typography>
                    <Tooltip
                      title={TOOLTIPS.targetValue}
                      placement="top"
                    >
                      <InfoOutlinedIcon sx={styles.infoIcon} />
                    </Tooltip>
                  </Box>
                  <TextField
                    value={form.targetValue}
                    onChange={setField('targetValue')}
                    type="number"
                    size="small"
                    fullWidth
                    variant="standard"
                    sx={styles.numberField}
                    slotProps={{ input: { sx: styles.inputBase } }}
                  />
                </Box>
              </Box>
            </>
          )}

          <Box sx={styles.verticalField}>
            <Box sx={styles.fieldLabelRow}>
              <Typography sx={styles.fieldLabel}>Importance</Typography>
              <Tooltip
                title={TOOLTIPS.importance}
                placement="top"
              >
                <InfoOutlinedIcon sx={styles.infoIcon} />
              </Tooltip>
            </Box>
            <TextField
              select
              value={form.importance}
              onChange={setField('importance')}
              size="small"
              fullWidth
              variant="outlined"
              SelectProps={{ sx: styles.selectInput }}
            >
              {IMPORTANCE_OPTIONS.map(option => (
                <MenuItem
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {error && (
            <Typography
              variant="body2"
              sx={styles.error}
            >
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={styles.dialogActions}>
        <Button
          onClick={onClose}
          disabled={isSaving}
          sx={styles.cancelButton}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !!validationError}
          sx={styles.saveButton}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
});

PlatformDimensionDialog.displayName = 'PlatformDimensionDialog';

const platformDimensionDialogStyles = {
  dialogTitle: {
    fontSize: '1.25rem',
    fontWeight: 500,
    lineHeight: '1.75rem',
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  inputLabel: {
    fontSize: '0.875rem',
    fontWeight: 400,
  },
  inputBase: {
    fontSize: '0.875rem',
    fontWeight: 400,
  },
  platformNotice: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.75rem',
    backgroundColor: palette.background.infoBanner.paper,
    borderRadius: '0.5rem',
    border: `0.0625rem solid ${palette.background.infoBanner.border}`,
  }),
  platformNoticeIcon: ({ palette }) => ({
    width: '0.875rem',
    height: '0.875rem',
    color: palette.info.main,
    flexShrink: 0,
  }),
  platformNoticeText: ({ palette }) => ({
    color: palette.background.infoBanner.text,
    fontSize: '0.75rem',
    lineHeight: '1.25rem',
    fontWeight: 400,
  }),
  verticalSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  sectionLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  sectionLabel: {
    color: 'text.primary',
    fontSize: '0.875rem',
    fontWeight: 500,
    lineHeight: '1.5rem',
  },
  textareaSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  textareaLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  textareaInput: {
    fontSize: '0.875rem',
    fontWeight: 400,
    '& .MuiOutlinedInput-input.MuiInputBase-inputMultiline': {
      maxHeight: '7.5rem',
      overflowY: 'auto',
    },
  },
  required: {
    color: 'text.primary',
    marginLeft: '0.125rem',
  },
  infoIcon: {
    width: '1rem',
    height: '1rem',
    color: 'text.secondary',
    cursor: 'pointer',
  },
  evaluatorTagWrapper: {
    display: 'flex',
    gap: '0.625rem',
  },
  evaluatorTag: ({ palette }) => ({
    padding: '0.25rem 0.5rem',
    borderRadius: '1.0625rem',
    backgroundColor: palette.action.selected,
    border: `0.0625rem solid ${palette.divider}`,
    color: palette.text.secondary,
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1rem',
  }),
  radioGroup: {
    marginLeft: '0.25rem',
    gap: '1.5rem',
  },
  radioFormControl: {
    marginLeft: 0,
    marginRight: 0,
  },
  checkboxLabel: {
    color: 'text.secondary',
    fontSize: '0.875rem',
    fontWeight: 400,
    lineHeight: '1.5rem',
  },
  checkboxGroup: {
    display: 'flex',
    gap: '1.5rem',
    marginLeft: '0.25rem',
  },
  verticalField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    flex: 1,
  },
  fieldLabelRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  fieldLabel: {
    color: 'text.primary',
    fontSize: '0.75rem',
    fontWeight: 500,
    lineHeight: '1rem',
  },
  selectInput: {
    fontSize: '0.875rem',
    fontWeight: 400,
  },
  twoColumnRow: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start',
  },
  numberField: {
    '& input[type=number]': {
      MozAppearance: 'textfield',
    },
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
  },
  error: {
    color: 'error.main',
    whiteSpace: 'pre-wrap',
  },
  dialogActions: {
    padding: '1rem 1.5rem',
  },
  cancelButton: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
  saveButton: {
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};

export default PlatformDimensionDialog;
