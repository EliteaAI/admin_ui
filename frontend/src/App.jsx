import { Navigate, Route, createBrowserRouter, createRoutesFromElements, RouterProvider } from 'react-router-dom';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import Layout from '@/components/Layout/Layout';
import UsersPage from '@/pages/UsersPage/UsersPage';
import RolesPage from '@/pages/RolesPage/RolesPage';
import ProjectsPage from '@/pages/ProjectsPage/ProjectsPage';
import AuditTrailPage from '@/pages/AuditTrailPage/AuditTrailPage';
import SchedulesTasksPage from '@/pages/SchedulesTasksPage/SchedulesTasksPage';
import ConfigurationPage from '@/pages/ConfigurationPage/ConfigurationPage';
import SecretsPage from '@/pages/SecretsPage/SecretsPage';
import LiteLLMPage from '@/pages/LiteLLMPage/LiteLLMPage';
import { RouteDefinitions } from '@/routes';

const basename = globalThis.admin_ui_config?.vite_base_uri ?? '';

function NotFound() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <Typography variant="headingLarge" color="text.secondary">
        404 — Page not found
      </Typography>
    </Box>
  );
}

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<Layout />}>
      <Route index element={<Navigate to={RouteDefinitions.Users} replace />} />
      <Route path={RouteDefinitions.Users} element={<UsersPage />} />
      <Route path={RouteDefinitions.Roles} element={<RolesPage />} />
      <Route path={RouteDefinitions.Projects} element={<ProjectsPage />} />
      <Route path={RouteDefinitions.Secrets} element={<SecretsPage />} />
      <Route path={RouteDefinitions.LiteLLM} element={<LiteLLMPage />} />
      <Route path={RouteDefinitions.AuditTrail} element={<AuditTrailPage />} />
      <Route path={RouteDefinitions.SchedulesTasks} element={<SchedulesTasksPage />} />
      <Route path={RouteDefinitions.Configuration} element={<ConfigurationPage />} />
      <Route path="*" element={<NotFound />} />
    </Route>,
  ),
  { basename },
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
