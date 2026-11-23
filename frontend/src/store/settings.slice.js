import { createSlice } from '@reduxjs/toolkit';

const SIDEBAR_GROUPS_OPEN_KEY = 'sidebarGroupsOpen';

// Storage can be missing or blocked (private window, cleared site data), so the sidebar must work without it
const readSidebarGroupsOpen = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_GROUPS_OPEN_KEY));
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([, open]) => typeof open === 'boolean'));
  } catch (error) {
    console.error('Failed to read the saved sidebar groups', error);
    return {};
  }
};

const writeSidebarGroupsOpen = groupsOpen => {
  try {
    localStorage.setItem(SIDEBAR_GROUPS_OPEN_KEY, JSON.stringify(groupsOpen));
  } catch (error) {
    console.error('Failed to save the sidebar groups', error);
  }
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    mode: localStorage.getItem('mode') || 'dark',
    socketConnected: false,
    sideBarCollapsed: localStorage.getItem('sideBarCollapsed') === 'true',
    // Group id -> open flag. A group missing here is closed unless it holds the current page
    sidebarGroupsOpen: readSidebarGroupsOpen(),
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
    setSidebarGroupOpen: (state, action) => {
      const { groupId, open } = action.payload;
      state.sidebarGroupsOpen[groupId] = open;
      writeSidebarGroupsOpen(state.sidebarGroupsOpen);
    },
  },
});

export const { setMode, toggleMode, setSocketConnected, toggleSidebarCollapsed, setSidebarGroupOpen } =
  settingsSlice.actions;
