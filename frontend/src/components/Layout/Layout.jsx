import { memo } from "react";

import { useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

import Box from "@mui/material/Box";

import Sidebar, { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH } from "./Sidebar";

const Layout = memo(() => {
  const sideBarCollapsed = useSelector(
    (state) => state.settings.sideBarCollapsed,
  );
  const currentWidth = sideBarCollapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH;

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: `calc(100% - ${currentWidth})`,
          transition: "width 0.2s ease-in-out",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
});

export default Layout;
