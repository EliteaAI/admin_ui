import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { PERMISSIONS } from '@/constants/permissions.constants';
import store, { setPermissions } from '@/store';
import { render, screen } from '@testing-library/react';

import { ProtectedRoute } from '..';

const PLUGINS = PERMISSIONS.runtime.plugins;
const SCIM = PERMISSIONS.scim.manage;

const renderRoute = (permissions, path = '/scim-provisioning') => {
  store.dispatch(setPermissions(permissions));

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path={path}
            element={
              <ProtectedRoute path={path}>
                <div>page content</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="*"
            element={<div>redirected</div>}
          />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
};

describe('ProtectedRoute', () => {
  it('opens SCIM Provisioning with both runtime.plugins and admin.scim.manage', () => {
    renderRoute([PLUGINS, SCIM]);

    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('keeps SCIM Provisioning closed with runtime.plugins alone', () => {
    renderRoute([PLUGINS]);

    expect(screen.queryByText('page content')).not.toBeInTheDocument();
    expect(screen.getByText('redirected')).toBeInTheDocument();
  });

  it('keeps SCIM Provisioning closed with admin.scim.manage alone', () => {
    renderRoute([SCIM]);

    expect(screen.queryByText('page content')).not.toBeInTheDocument();
  });

  it('opens Authentication and Guardrails with runtime.plugins', () => {
    renderRoute([PLUGINS], '/authentication');

    expect(screen.getByText('page content')).toBeInTheDocument();
  });

  it('keeps Authentication closed without runtime.plugins', () => {
    renderRoute([], '/authentication');

    expect(screen.queryByText('page content')).not.toBeInTheDocument();
  });

  it('sends a user whose only page is Membership Audit to /audit, not to a missing /lifecycle-audit', () => {
    store.dispatch(setPermissions([PERMISSIONS.lifecycleAudit.view]));

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/users']}>
          <Routes>
            <Route
              path="/users"
              element={
                <ProtectedRoute path="/users">
                  <div>users page</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit"
              element={<div>audit page</div>}
            />
            <Route
              path="*"
              element={<div>not found</div>}
            />
          </Routes>
        </MemoryRouter>
      </Provider>,
    );

    expect(screen.getByText('audit page')).toBeInTheDocument();
  });
});
