import React, { memo, useEffect, useMemo } from "react";
import ReactDOM from "react-dom/client";
import { Provider, useDispatch, useSelector } from "react-redux";
import io from "socket.io-client";

import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFnsV3";

import App from "./App";
import getDesignTokens from "./MainTheme";
import store, { setSocketConnected } from "./store";
import { VITE_SERVER_URL, VITE_DEV_TOKEN } from "./utils/env";

const ThemeWrapper = memo(({ children }) => {
  const mode = useSelector((state) => state.settings.mode);
  const dispatch = useDispatch();

  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  useEffect(() => {
    const socketServer = VITE_SERVER_URL
      ? VITE_SERVER_URL.replace(/\/api\/v1\/?$/, "")
      : window.location.origin;

    const ioOptions = {
      path: "/socket.io/",
      reconnectionDelayMax: 2000,
      extraHeaders: {},
    };

    if (VITE_DEV_TOKEN)
      ioOptions.extraHeaders.Authorization = `Bearer ${VITE_DEV_TOKEN}`;

    const socketIo = io(socketServer, ioOptions);

    socketIo.on("connect", () => {
      dispatch(setSocketConnected(true));
    });

    socketIo.on("connect_error", () => {
      dispatch(setSocketConnected(false));
    });

    socketIo.on("disconnect", () => {
      dispatch(setSocketConnected(false));
    });

    return () => {
      socketIo.disconnect();
    };
  }, [dispatch]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {children}
      </LocalizationProvider>
    </ThemeProvider>
  );
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeWrapper>
        <App />
      </ThemeWrapper>
    </Provider>
  </React.StrictMode>,
);
