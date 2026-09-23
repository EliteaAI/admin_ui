import { configureStore, createSlice } from '@reduxjs/toolkit';

const storybookSettingsSlice = createSlice({
  name: 'settings',
  initialState: {
    mode: 'light',
    socketConnected: false,
  },
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
    },
    toggleMode: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
  },
});

const storybookUserSlice = createSlice({
  name: 'user',
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

const StorybookStore = configureStore({
  reducer: {
    settings: storybookSettingsSlice.reducer,
    user: storybookUserSlice.reducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

export default StorybookStore;
export const { setMode, toggleMode, setSocketConnected } = storybookSettingsSlice.actions;
export const { setUser, setPermissions } = storybookUserSlice.actions;
