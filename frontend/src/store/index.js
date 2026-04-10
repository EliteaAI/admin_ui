import { configureStore, createSlice } from "@reduxjs/toolkit";

import { adminApi } from "@/api/adminApi";

const settingsSlice = createSlice({
  name: "settings",
  initialState: {
    mode: localStorage.getItem("mode") || "dark",
    socketConnected: false,
    sideBarCollapsed: localStorage.getItem("sideBarCollapsed") === "true",
  },
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem("mode", state.mode);
    },
    toggleMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
      localStorage.setItem("mode", state.mode);
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    toggleSidebarCollapsed: (state) => {
      state.sideBarCollapsed = !state.sideBarCollapsed;
      localStorage.setItem(
        "sideBarCollapsed",
        state.sideBarCollapsed ? "true" : "false",
      );
    },
  },
});

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    permissions: [],
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
  },
});

const settingsActions = settingsSlice.actions;
const userActions = userSlice.actions;

const store = configureStore({
  reducer: {
    settings: settingsSlice.reducer,
    user: userSlice.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: [],
      },
    }).concat(adminApi.middleware),
});

export default store;
export const {
  setMode,
  toggleMode,
  setSocketConnected,
  toggleSidebarCollapsed,
} = settingsActions;
export const { setUser, setPermissions } = userActions;
