import { useCallback, useState } from 'react';

const STORAGE_KEY = 'admin_ui.governance.project';

// The project is remembered as { id, name } so the picker can show the name before any list is loaded.
// Storage can be blocked or full: the page works without it, it only forgets the choice.
const readStoredProject = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored?.id) ? { id: stored.id, name: String(stored.name ?? stored.id) } : null;
  } catch {
    return null;
  }
};

const storeProject = project => {
  try {
    if (project) localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: project.id, name: project.name }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // The choice is not remembered
  }
};

// The project the Governance tabs work on. Every project-scoped tab uses it, so a tab opens on the last choice.
export const useGovernanceProject = () => {
  const [project, setProject] = useState(readStoredProject);

  const selectProject = useCallback(next => {
    const value = next ? { id: next.id, name: next.name } : null;
    setProject(value);
    storeProject(value);
  }, []);

  return { project, selectProject };
};
