import { memo, useCallback, useContext, useEffect, useId, useState } from 'react';

import { MenuItem, Select, TextField } from '@mui/material';

import { useConfigSuggestionsQuery } from '@/api/configuration.api';
import { getNumberFieldError, isNumberText } from '@/helpers/schemaForm.helpers';

import { FieldErrorsContext } from '../fieldErrors.context';
import ArrayChipsInput from './ArrayChipsInput';
import JsonEditorField from './JsonEditorField';
import MapEditor from './MapEditor';
import PasswordField from './PasswordField';
import UsersTableEditor from './UsersTableEditor';

const SchemaField = memo(props => {
  const { field, value, onChange } = props;
  const { type, format, items, additionalProperties } = field;
  const enumValues = field.enum;

  // Fetch suggestions for enum_source (array fields)
  const enumSource = field.enum_source;
  const { data: suggestionsData } = useConfigSuggestionsQuery({ source: enumSource }, { skip: !enumSource });
  const suggestions = suggestionsData?.values || [];
  const suggestionLabels = suggestionsData?.labels || {};

  // Fetch suggestions for enum_source_keys (map editor keys)
  const enumSourceKeys = field.enum_source_keys;
  const { data: keySuggestionsData } = useConfigSuggestionsQuery(
    { source: enumSourceKeys },
    { skip: !enumSourceKeys },
  );
  const keySuggestions = keySuggestionsData?.values || [];

  const handleTextChange = useCallback(e => onChange(e.target.value), [onChange]);

  // A nullable number cleared by the user means "no value" (e.g. unlimited), not 0
  const nullable = Array.isArray(field.value_schema?.type) && field.value_schema.type.includes('null');
  const [numberCleared, setNumberCleared] = useState(false);
  const [typedValue, setTypedValue] = useState();
  const handleNumberChange = useCallback(
    e => {
      const text = e.target.value;
      // An empty field (cleared, or text that is not a number such as a space) is never 0: it is null when
      // the field allows no value, otherwise the last number stays in the form
      if (text === '') {
        if (nullable) onChange(null);
        else setNumberCleared(true);
        return;
      }
      setNumberCleared(false);
      const typed = isNumberText(type, text) ? Number(text) : text;
      setTypedValue(typed);
      onChange(typed);
    },
    [onChange, nullable, type],
  );
  const handleNumberBlur = useCallback(() => setNumberCleared(false), []);
  const numberShown = numberCleared ? '' : value;
  const isNumberField = type === 'integer' || type === 'number';
  const numberError = isNumberField ? getNumberFieldError(field, numberShown) : null;
  const numberBlocksSave = numberCleared || (value === typedValue && !!numberError);

  const reportFieldError = useContext(FieldErrorsContext);
  const fieldId = useId();
  useEffect(() => {
    if (!reportFieldError) return undefined;
    reportFieldError(fieldId, numberBlocksSave);
    return () => reportFieldError(fieldId, false);
  }, [reportFieldError, fieldId, numberBlocksSave]);

  const styles = schemaFieldStyles();

  switch (type) {
    case 'string':
      if (enumValues?.length) {
        return (
          <Select
            fullWidth
            size="small"
            value={value || ''}
            onChange={handleTextChange}
            displayEmpty
            sx={styles.select}
          >
            {enumValues.map(opt => (
              <MenuItem
                key={opt}
                value={opt}
              >
                {opt}
              </MenuItem>
            ))}
          </Select>
        );
      }
      if (format === 'password') {
        return (
          <PasswordField
            value={value}
            onChange={onChange}
          />
        );
      }
      if (format === 'textarea') {
        const builtinDefault = field.builtin_default;
        return (
          <TextField
            fullWidth
            size="small"
            multiline
            minRows={builtinDefault ? 10 : 4}
            maxRows={builtinDefault ? 24 : 12}
            value={value || ''}
            onChange={handleTextChange}
            placeholder={builtinDefault || 'Enter value...'}
            sx={styles.textField}
          />
        );
      }
      return (
        <TextField
          fullWidth
          size="small"
          value={value || ''}
          onChange={handleTextChange}
          placeholder="Enter value..."
          sx={styles.textField}
        />
      );

    case 'integer':
    case 'number':
      return (
        <TextField
          fullWidth
          size="small"
          type="number"
          value={numberShown ?? ''}
          onChange={handleNumberChange}
          onBlur={handleNumberBlur}
          error={!!numberError}
          helperText={numberError ?? undefined}
          inputProps={{ min: field.minimum, max: field.maximum }}
          placeholder="Enter number..."
          sx={styles.textField}
        />
      );

    case 'array':
      if (items?.type === 'string' || (items?.type === 'integer' && enumSource)) {
        return (
          <ArrayChipsInput
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
            suggestions={suggestions}
            labels={suggestionLabels}
            literal={format === 'regex_list'}
            placeholder={
              format === 'regex_list' ? 'Type a regular expression and press Enter to add' : undefined
            }
          />
        );
      }
      if (items?.type === 'object' && items?.properties?.login && items?.properties?.password) {
        return (
          <UsersTableEditor
            value={Array.isArray(value) ? value : []}
            onChange={onChange}
          />
        );
      }
      return (
        <JsonEditorField
          value={value}
          onChange={onChange}
        />
      );

    case 'object':
      if (additionalProperties?.type === 'array') {
        return (
          <MapEditor
            value={value || {}}
            onChange={onChange}
            keySuggestions={keySuggestions}
            valueSuggestionsSource={field.enum_source_values}
          />
        );
      }
      return (
        <JsonEditorField
          value={value}
          onChange={onChange}
        />
      );

    default:
      return (
        <TextField
          fullWidth
          size="small"
          value={typeof value === 'string' ? value : JSON.stringify(value ?? '')}
          onChange={handleTextChange}
          placeholder="Enter value..."
          sx={styles.textField}
        />
      );
  }
});

SchemaField.displayName = 'SchemaField';

/** @type {MuiSx} */
const schemaFieldStyles = () => ({
  textField: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  select: ({ palette }) => ({
    fontSize: '0.8125rem',
    backgroundColor: palette.background.default,
  }),
});

export default SchemaField;
