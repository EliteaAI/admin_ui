import { getAdminConfig } from '@/helpers/env.helpers';
import { createSlice } from '@reduxjs/toolkit';

// Initial user data comes from the server-injected config (available before React mounts)
const adminConfig = getAdminConfig();

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    user:
      adminConfig.user_id || adminConfig.user_name || adminConfig.user_email
        ? {
            id: adminConfig.user_id || null,
            name: adminConfig.user_name || '',
            email: adminConfig.user_email || '',
          }
        : null,
    permissions: Array.isArray(adminConfig.permissions) ? adminConfig.permissions : [],
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

export const { setUser, setPermissions, setRoles } = userSlice.actions;
