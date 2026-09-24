import { memo } from 'react';

import { Route, RouterProvider, createBrowserRouter, createRoutesFromElements } from 'react-router-dom';

import { DefaultRedirect } from '@/components/DefaultRedirect';
import { Layout } from '@/components/Layout';
import { NotFound } from '@/components/NotFound';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { RouteDefinitions } from '@/constants/routes.constants';
import { getEnvVar } from '@/helpers/env.helpers';
import { AppRequestsPage } from '@/pages/AppRequestsPage';
import { AuditTrailPage } from '@/pages/AuditTrailPage';
import { BudgetsPage } from '@/pages/BudgetsPage';
import { ConfigurationPage } from '@/pages/ConfigurationPage';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { LiteLLMPage } from '@/pages/LiteLLMPage';
import { ModelPricesPage } from '@/pages/ModelPricesPage';
import { PlatformDimensionsPage } from '@/pages/PlatformDimensionsPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ReportsPage } from '@/pages/ReportsPage';
import { RolesPage } from '@/pages/RolesPage';
import { SchedulesTasksPage } from '@/pages/SchedulesTasksPage';
import { SecretsPage } from '@/pages/SecretsPage';
import { UsersPage } from '@/pages/UsersPage';

const basename = getEnvVar('vite_base_uri') ?? '';

const guard = (path, element) => {
  return <ProtectedRoute path={path}>{element}</ProtectedRoute>;
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route
        index
        element={<DefaultRedirect />}
      />
      <Route
        path={RouteDefinitions.Users}
        element={guard(RouteDefinitions.Users, <UsersPage />)}
      />
      <Route
        path={RouteDefinitions.Roles}
        element={guard(RouteDefinitions.Roles, <RolesPage />)}
      />
      <Route
        path={RouteDefinitions.Projects}
        element={guard(RouteDefinitions.Projects, <ProjectsPage />)}
      />
      <Route
        path={RouteDefinitions.Budgets}
        element={guard(RouteDefinitions.Budgets, <BudgetsPage />)}
      />
      <Route
        path={RouteDefinitions.PlatformDimensions}
        element={guard(RouteDefinitions.PlatformDimensions, <PlatformDimensionsPage />)}
      />
      <Route
        path={RouteDefinitions.Secrets}
        element={guard(RouteDefinitions.Secrets, <SecretsPage />)}
      />
      <Route
        path={RouteDefinitions.LiteLLM}
        element={guard(RouteDefinitions.LiteLLM, <LiteLLMPage />)}
      />
      <Route
        path={RouteDefinitions.ModelPrices}
        element={guard(RouteDefinitions.ModelPrices, <ModelPricesPage />)}
      />
      <Route
        path={RouteDefinitions.AppRequests}
        element={guard(RouteDefinitions.AppRequests, <AppRequestsPage />)}
      />
      <Route
        path={RouteDefinitions.AuditTrail}
        element={guard(RouteDefinitions.AuditTrail, <AuditTrailPage />)}
      />
      <Route
        path={RouteDefinitions.SchedulesTasks}
        element={guard(RouteDefinitions.SchedulesTasks, <SchedulesTasksPage />)}
      />
      <Route
        path={RouteDefinitions.Configuration}
        element={guard(RouteDefinitions.Configuration, <ConfigurationPage />)}
      />
      <Route
        path={RouteDefinitions.Features}
        element={guard(RouteDefinitions.Features, <FeaturesPage />)}
      />
      <Route
        path={RouteDefinitions.Reports}
        element={guard(RouteDefinitions.Reports, <ReportsPage />)}
      />
      <Route
        path="*"
        element={<NotFound />}
      />
    </Route>,
  ),
  { basename },
);

const App = memo(() => <RouterProvider router={router} />);

App.displayName = 'App';

export default App;
