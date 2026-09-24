import { memo, useEffect, useMemo } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import io from 'socket.io-client';

import { CssBaseline } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

import { VITE_DEV_TOKEN, VITE_SERVER_URL } from '@/helpers/env.helpers';
import { setSocketConnected } from '@/store';
import getDesignTokens from '@/theme/main.theme';

const ThemeWrapper = memo(props => {
  const { children } = props;

  const mode = useSelector(state => state.settings.mode);
  const dispatch = useDispatch();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  useEffect(() => {
    const socketServer = VITE_SERVER_URL
      ? VITE_SERVER_URL.replace(/\/api\/v\d+\/?$/, '')
      : window.location.origin;

    const ioOptions = {
      path: '/socket.io/',
      reconnectionDelayMax: 2000,
      extraHeaders: {},
    };

    if (VITE_DEV_TOKEN) ioOptions.extraHeaders.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

    const socketIo = io(socketServer, ioOptions);

    socketIo.on('connect', () => {
      dispatch(setSocketConnected(true));
    });

    socketIo.on('connect_error', () => {
      dispatch(setSocketConnected(false));
    });

    socketIo.on('disconnect', () => {
      dispatch(setSocketConnected(false));
    });

    return () => {
      socketIo.disconnect();
    };
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>{children}</LocalizationProvider>
    </ThemeProvider>
  );
});

ThemeWrapper.displayName = 'ThemeWrapper';

export default ThemeWrapper;
