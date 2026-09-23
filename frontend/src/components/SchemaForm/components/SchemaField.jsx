import { memo, useCallback } from 'react';

import { MenuItem, Select, TextField } from '@mui/material';

import { useConfigSuggestionsQuery } from '@/api/configuration.api';

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

  const handleNumberChange = useCallback(e => onChange(Number(e.target.value)), [onChange]);

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
          value={value ?? ''}
          onChange={handleNumberChange}
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
