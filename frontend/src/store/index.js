import { adminApi } from '@/api/admin.api';
import { configureStore } from '@reduxjs/toolkit';

import { settingsSlice } from './settings.slice';
import { userSlice } from './user.slice';

const store = configureStore({
  reducer: {
    settings: settingsSlice.reducer,
    user: userSlice.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: [],
      },
    }).concat(adminApi.middleware),
});

export default store;
export { setMode, setSocketConnected, toggleMode, toggleSidebarCollapsed } from './settings.slice';
export { setPermissions, setRoles, setUser } from './user.slice';
