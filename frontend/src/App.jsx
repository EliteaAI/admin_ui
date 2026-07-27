import {
  Navigate,
  Route,
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
} from "react-router-dom";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import Layout from "@/components/Layout/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";
import UsersPage from "@/pages/UsersPage/UsersPage";
import RolesPage from "@/pages/RolesPage/RolesPage";
import ProjectsPage from "@/pages/ProjectsPage/ProjectsPage";
import BudgetsPage from "@/pages/BudgetsPage/BudgetsPage";
import AuditTrailPage from "@/pages/AuditTrailPage/AuditTrailPage";
import SchedulesTasksPage from "@/pages/SchedulesTasksPage/SchedulesTasksPage";
import ConfigurationPage from "@/pages/ConfigurationPage/ConfigurationPage";
import SecretsPage from "@/pages/SecretsPage/SecretsPage";
import LiteLLMPage from "@/pages/LiteLLMPage/LiteLLMPage";
import AppRequestsPage from "@/pages/AppRequestsPage/AppRequestsPage";
import FeaturesPage from "@/pages/FeaturesPage/FeaturesPage";
import { RouteDefinitions } from "@/routes";
import { useCheckPermission } from "@/hooks/useCheckPermission";
import { SIDEBAR_PERMISSIONS } from "@/constants/permissions";

const basename = globalThis.admin_ui_config?.vite_base_uri ?? "";

function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      <Typography
        variant="headingLarge"
        color="text.secondary"
      >
        404 — Page not found
      </Typography>
    </Box>
  );
}

const DefaultRedirect = () => {
  const { hasAnyPermission } = useCheckPermission();

  const sidebarKeys = Object.keys(SIDEBAR_PERMISSIONS);
  const firstAllowed = sidebarKeys.find(key => hasAnyPermission(SIDEBAR_PERMISSIONS[key]));

  return (
    <Navigate
      to={firstAllowed ? `/${firstAllowed}` : RouteDefinitions.Users}
      replace
    />
  );
};

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
        path={RouteDefinitions.Secrets}
        element={guard(RouteDefinitions.Secrets, <SecretsPage />)}
      />
      <Route
        path={RouteDefinitions.LiteLLM}
        element={guard(RouteDefinitions.LiteLLM, <LiteLLMPage />)}
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
        path="*"
        element={<NotFound />}
      />
    </Route>,
  ),
  { basename },
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
