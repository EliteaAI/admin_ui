import { memo, useCallback, useState } from 'react';

import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { IconButton, InputAdornment, TextField } from '@mui/material';

const PasswordField = memo(props => {
  const { value, onChange } = props;

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = useCallback(e => onChange(e.target.value), [onChange]);

  const handleToggleShow = useCallback(() => setShowPassword(s => !s), []);

  const styles = passwordFieldStyles();

  return (
    <TextField
      fullWidth
      size="small"
      type={showPassword ? 'text' : 'password'}
      value={value || ''}
      onChange={handleChange}
      placeholder="Enter value..."
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={handleToggleShow}
                edge="end"
              >
                {showPassword ? (
                  <VisibilityOff sx={styles.visibilityIcon} />
                ) : (
                  <Visibility sx={styles.visibilityIcon} />
                )}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      sx={styles.textField}
    />
  );
});

PasswordField.displayName = 'PasswordField';

/** @type {MuiSx} */
const passwordFieldStyles = () => ({
  textField: ({ palette }) => ({
    '& .MuiOutlinedInput-root': {
      fontSize: '0.8125rem',
      backgroundColor: palette.background.default,
    },
  }),
  visibilityIcon: {
    fontSize: '1rem',
  },
});

export default PasswordField;
