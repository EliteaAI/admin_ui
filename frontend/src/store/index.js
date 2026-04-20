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

// Get initial user data from server-injected config (available before React mounts)
const adminConfig = globalThis?.admin_ui_config || {};

const userSlice = createSlice({
  name: "user",
  initialState: {
    user:
      adminConfig.user_id || adminConfig.user_name || adminConfig.user_email
        ? {
            id: adminConfig.user_id || null,
            name: adminConfig.user_name || "",
            email: adminConfig.user_email || "",
          }
        : null,
    permissions: Array.isArray(adminConfig.permissions)
      ? adminConfig.permissions
      : [],
    roles: Array.isArray(adminConfig.roles) ? adminConfig.roles : [],
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
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
export const { setUser, setPermissions, setRoles } = userActions;
