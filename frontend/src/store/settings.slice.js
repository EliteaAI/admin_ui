import { createSlice } from '@reduxjs/toolkit';

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    mode: localStorage.getItem('mode') || 'dark',
    socketConnected: false,
    sideBarCollapsed: localStorage.getItem('sideBarCollapsed') === 'true',
  },
  reducers: {
    setMode: (state, action) => {
      state.mode = action.payload;
      localStorage.setItem('mode', state.mode);
    },
    toggleMode: state => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('mode', state.mode);
    },
    setSocketConnected: (state, action) => {
      state.socketConnected = action.payload;
    },
    toggleSidebarCollapsed: state => {
      state.sideBarCollapsed = !state.sideBarCollapsed;
      localStorage.setItem('sideBarCollapsed', state.sideBarCollapsed ? 'true' : 'false');
    },
  },
});

export const { setMode, toggleMode, setSocketConnected, toggleSidebarCollapsed } = settingsSlice.actions;
