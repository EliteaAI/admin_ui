import { Navigate } from "react-router-dom";

import { useCheckPermission } from "@/hooks/useCheckPermission";
import {
  ROUTE_PERMISSIONS,
  SIDEBAR_PERMISSIONS,
} from "@/constants/permissions";
import { memo } from "react";
import { Box } from "@mui/material";

const ProtectedRoute = memo((props) => {
  const { children, path } = props;
  const { hasAnyPermission } = useCheckPermission();

  const requiredPerms = ROUTE_PERMISSIONS[path];

  if (!requiredPerms || hasAnyPermission(requiredPerms)) return children;

  const sidebarKeys = Object.keys(SIDEBAR_PERMISSIONS);
  const firstAllowed = sidebarKeys.find((key) =>
    hasAnyPermission(SIDEBAR_PERMISSIONS[key]),
  );

  if (firstAllowed) return <Navigate to={`/${firstAllowed}`} replace />;

  // No routes accessible at all — should not happen in practice
  return (
    <Box
      component="div"
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "3rem",
      }}
    >
      <Box component="span" sx={{ fontSize: "1.25rem", color: "#999" }}>
        Not Authorized
      </Box>
    </Box>
  );
});

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
