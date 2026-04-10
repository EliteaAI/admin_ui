import { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

import MoonIcon from '@/components/Icons/MoonIcon';
import SunIcon from '@/components/Icons/SunIcon';
import { toggleMode } from '@/store';

const ThemeModeToggle = memo(function ThemeModeToggle() {
  const theme = useTheme();
  const mode = useSelector((state) => state.settings.mode);
  const dispatch = useDispatch();

  const onChange = useCallback(() => {
    dispatch(toggleMode());
  }, [dispatch]);

  const isDark = mode === 'dark';

  return (
    <Box sx={styles.container(theme)}>
      <Box
        onClick={isDark ? undefined : onChange}
        sx={styles.button(isDark, theme)}
      >
        <MoonIcon
          fill={isDark ? theme.palette.icon.fill.secondary : theme.palette.icon.fill.primary}
        />
      </Box>
      <Box
        onClick={isDark ? onChange : undefined}
        sx={styles.button(!isDark, theme)}
      >
        <SunIcon
          fill={!isDark ? theme.palette.icon.fill.secondary : theme.palette.icon.fill.primary}
        />
      </Box>
    </Box>
  );
});

const styles = {
  container: (theme) => ({
    display: 'flex',
    alignItems: 'center',
    gap: '0.125rem',
    backgroundColor: theme.palette.background.tabButton.default,
    borderRadius: '0.375rem',
    padding: '0.125rem',
    height: '1.75rem',
  }),
  button: (isActive, theme) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '0.25rem',
    cursor: isActive ? 'default' : 'pointer',
    backgroundColor: isActive ? theme.palette.background.tabButton.active : 'transparent',
    transition: 'background-color 0.2s ease',
    '&:hover': {
      backgroundColor: isActive
        ? theme.palette.background.tabButton.active
        : theme.palette.background.tabButton.hover,
    },
    '& svg': {
      width: '0.75rem',
      height: '0.75rem',
    },
  }),
};

export default ThemeModeToggle;
