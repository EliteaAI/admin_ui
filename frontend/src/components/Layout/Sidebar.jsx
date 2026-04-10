import { memo, useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import PeopleIcon from "@mui/icons-material/PeopleOutline";
import SecurityIcon from "@mui/icons-material/SecurityOutlined";
import HistoryIcon from "@mui/icons-material/HistoryOutlined";
import FolderIcon from "@mui/icons-material/FolderOutlined";
import ScheduleIcon from "@mui/icons-material/ScheduleOutlined";
import SettingsIcon from "@mui/icons-material/SettingsOutlined";
import VpnKeyOutlinedIcon from "@mui/icons-material/VpnKeyOutlined";
import ModelTrainingIcon from "@mui/icons-material/ModelTrainingOutlined";

import ThemeModeToggle from "@/components/ThemeModeToggle";
import UserAvatar from "@/components/UserAvatar";
import EliteAIcon from "@/components/Icons/EliteAIcon";
import LogoutIcon from "@/components/Icons/LogoutIcon";
import ArrowLeftIcon from "@/components/Icons/ArrowLeftIcon";
import ArrowRightIcon from "@/components/Icons/ArrowRightIcon";
import { RouteDefinitions } from "@/routes";
import { toggleSidebarCollapsed } from "@/store";
import { USER_NAME } from "@/utils/env";

const DRAWER_WIDTH = "13.75rem";
const COLLAPSED_DRAWER_WIDTH = "3.75rem";

const topMenuItems = [
  {
    id: "users",
    label: "Users",
    icon: PeopleIcon,
    url: RouteDefinitions.Users,
  },
  {
    id: "roles",
    label: "Roles",
    icon: SecurityIcon,
    url: RouteDefinitions.Roles,
  },
  {
    id: "projects",
    label: "Projects",
    icon: FolderIcon,
    url: RouteDefinitions.Projects,
  },
  {
    id: "secrets",
    label: "Secrets",
    icon: VpnKeyOutlinedIcon,
    url: RouteDefinitions.Secrets,
  },
  {
    id: "litellm",
    label: "LiteLLM",
    icon: ModelTrainingIcon,
    url: RouteDefinitions.LiteLLM,
  },
];

const bottomMenuItems = [
  {
    id: "configuration",
    label: "Configuration",
    icon: SettingsIcon,
    url: RouteDefinitions.Configuration,
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    icon: HistoryIcon,
    url: RouteDefinitions.AuditTrail,
  },
  {
    id: "schedules-tasks",
    label: "System",
    icon: ScheduleIcon,
    url: RouteDefinitions.SchedulesTasks,
  },
];

const Sidebar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sideBarCollapsed = useSelector(
    (state) => state.settings.sideBarCollapsed,
  );
  const socketConnected = useSelector(
    (state) => state.settings.socketConnected,
  );
  const styles = getStyles(sideBarCollapsed, socketConnected);
  const [anchorEl, setAnchorEl] = useState(null);

  const isActiveTab = useCallback(
    (tabId) => {
      const pathSegments = location.pathname.split("/");
      const lastSegment = pathSegments[pathSegments.length - 1];
      return lastSegment === tabId;
    },
    [location.pathname],
  );

  const handleItemClick = useCallback(
    (url) => {
      navigate(url);
    },
    [navigate],
  );

  const handleUserMenuOpen = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    handleUserMenuClose();
    window.location.href =
      window.location.origin.toString() + "/forward-auth/logout";
  }, [handleUserMenuClose]);

  const handleToggleCollapse = useCallback(() => {
    dispatch(toggleSidebarCollapsed());
  }, [dispatch]);

  const renderMenuItem = useCallback(
    (tab) => {
      const IconComponent = tab.icon;
      const isActive = isActiveTab(tab.id);
      return (
        <Box
          key={tab.id}
          onClick={() => handleItemClick(tab.url)}
          sx={styles.menuItem(isActive)}
        >
          <Box sx={styles.iconWrapper(isActive)}>
            <IconComponent sx={{ fontSize: "0.875rem" }} />
          </Box>
          {!sideBarCollapsed && (
            <Typography variant="labelSmall" sx={styles.menuItemText(isActive)}>
              {tab.label}
            </Typography>
          )}
        </Box>
      );
    },
    [isActiveTab, styles, handleItemClick, sideBarCollapsed],
  );

  const renderedTopTabs = useMemo(
    () => topMenuItems.map(renderMenuItem),
    [renderMenuItem],
  );

  const renderedBottomTabs = useMemo(
    () => bottomMenuItems.map(renderMenuItem),
    [renderMenuItem],
  );

  const userName = USER_NAME || "Admin";

  return (
    <Box sx={styles.drawerWrapper}>
      <Box sx={styles.drawer}>
        <Box sx={styles.header}>
          <Box sx={styles.headerLeft}>
            <IconButton
              onClick={handleToggleCollapse}
              sx={styles.homeButton}
              disableRipple
            >
              <EliteAIcon sx={styles.eliteaIcon} />
              <Tooltip
                title={`Server is ${socketConnected ? "connected" : "disconnected"}`}
                placement="right"
              >
                <Box sx={styles.socketIndicator} />
              </Tooltip>
            </IconButton>
            {!sideBarCollapsed && (
              <Typography variant="headingSmall" sx={styles.headerText}>
                Elitea Admin
              </Typography>
            )}
          </Box>
          {!sideBarCollapsed && <ThemeModeToggle />}
        </Box>

        <Box sx={styles.topMenuContainer}>{renderedTopTabs}</Box>

        <Box sx={styles.bottomSection}>
          <Divider sx={styles.divider} />
          <Box sx={styles.bottomMenuContainer}>{renderedBottomTabs}</Box>
          <Divider sx={styles.divider} />

          <Box sx={styles.userSection}>
            <IconButton
              onClick={handleUserMenuOpen}
              sx={styles.userButton}
              disableRipple
            >
              <Box sx={styles.userButtonContent}>
                <UserAvatar name={userName} size={16} />
                {!sideBarCollapsed && (
                  <>
                    <Typography
                      variant="labelSmall"
                      sx={styles.userNameText}
                      noWrap
                    >
                      {userName}
                    </Typography>
                    <ArrowRightIcon style={styles.arrowIcon} />
                  </>
                )}
              </Box>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: "top", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "left" }}
              sx={styles.menu}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={styles.menuItemIcon}>
                  <LogoutIcon sx={{ fontSize: "1rem" }} />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  slotProps={{ primary: { variant: "bodyMedium" } }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
      <Box onClick={handleToggleCollapse} sx={styles.collapseButton}>
        {sideBarCollapsed ? <ArrowRightIcon /> : <ArrowLeftIcon />}
      </Box>
    </Box>
  );
});

const getStyles = (collapsed, socketConnected) => ({
  drawerWrapper: {
    position: "relative",
    display: "flex",
    height: "100%",
  },

  drawer: ({ palette }) => ({
    width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    minWidth: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    maxWidth: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    transition:
      "width 0.2s ease-in-out, min-width 0.2s ease-in-out, max-width 0.2s ease-in-out",
    borderRight: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.tabPanel,
    display: "flex",
    flexDirection: "column",
    height: "100%",
    boxSizing: "border-box",
  }),

  collapseButton: ({ palette }) => ({
    position: "absolute",
    top: "3rem",
    right: "-0.75rem",
    width: "1.5rem",
    height: "1.5rem",
    borderRadius: "50%",
    border: `0.0625rem solid ${palette.border.lines || palette.border.table}`,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    cursor: "pointer",
    background: palette.background.secondary || palette.background.tabPanel,
    zIndex: 1,
  }),

  header: ({ palette }) => ({
    height: "3.75rem",
    minHeight: "3.75rem",
    padding: "0 .75rem",
    boxSizing: "border-box",
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    display: "flex",
    alignItems: "center",
    justifyContent: collapsed ? "center" : "space-between",
  }),

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
  },

  homeButton: ({ palette }) => ({
    padding: 0,
    width: "2.25rem",
    height: "2.25rem",
    borderRadius: "50%",
    background: "transparent",
    position: "relative",
    "&:hover": {
      backgroundColor:
        palette.background.conversation?.hover ||
        palette.background.tabButton?.hover,
    },
  }),

  socketIndicator: ({ palette }) => ({
    width: "0.5rem",
    height: "0.5rem",
    borderRadius: "50%",
    backgroundColor: socketConnected
      ? palette.icon?.fill?.success || "#4caf50"
      : palette.icon?.fill?.error || "#f44336",
    position: "absolute",
    top: "0rem",
    right: "0rem",
    cursor: "pointer",
  }),

  eliteaIcon: {
    fontSize: "1.75rem",
  },

  headerText: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  }),

  topMenuContainer: {
    paddingTop: ".5rem",
    display: "flex",
    flexDirection: "column",
    paddingLeft: "0.75rem",
    paddingRight: "0.75rem",
    boxSizing: "border-box",
    gap: "0.5rem",
    maxWidth: "100%",
  },

  bottomSection: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
  },

  bottomMenuContainer: {
    display: "flex",
    flexDirection: "column",
    padding: "0.5rem 0.75rem",
    boxSizing: "border-box",
    gap: "0.5rem",
    maxWidth: "100%",
  },

  divider: ({ palette }) => ({
    borderColor: palette.border.table,
    marginLeft: "1rem",
    marginRight: "1rem",
  }),

  userSection: {
    padding: "0.5rem 0.75rem 1rem 0.75rem",
  },

  userButton: ({ palette }) => ({
    width: "100%",
    padding: "0.5rem",
    borderRadius: "0.375rem",
    "&:hover": {
      backgroundColor:
        palette.background.conversation?.hover ||
        palette.background.tabButton.hover,
    },
  }),

  userButtonContent: ({ palette }) => ({
    width: "100%",
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
    cursor: "pointer",
    color: palette.text.metrics || palette.text.default,
  }),

  userNameText: ({ palette }) => ({
    flex: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    color: palette.text.metrics || palette.text.default,
    textAlign: "left",
  }),

  arrowIcon: {
    fontSize: "1rem",
  },

  menu: {
    "& .MuiPaper-root": {
      marginLeft: "1rem",
      marginTop: "-1rem",
    },
  },

  menuItemIcon: {
    minWidth: "1rem !important",
    marginRight: "0.75rem",
  },

  menuItem:
    (isActive) =>
    ({ palette }) => ({
      padding: collapsed ? "0.5rem" : "0.5rem 1rem",
      justifyContent: collapsed ? "center" : "flex-start",
      gap: "0.5rem",
      display: "flex",
      alignItems: "center",
      width: "100%",
      maxWidth: "100%",
      height: "2rem",
      background: isActive
        ? palette.background.userInputBackgroundActive
        : palette.background.conversation.normal,
      borderRadius: "0.375rem",
      cursor: "pointer",
      transition: "all 0.2s ease-in-out",
      boxSizing: "border-box",
      "&:hover": {
        backgroundColor: palette.background.conversation.hover,
      },
    }),

  iconWrapper:
    (isActive) =>
    ({ palette }) => ({
      display: "flex",
      alignItems: "center",
      minWidth: "0.875rem",
      color: isActive
        ? palette.text.secondary
        : palette.icon.fill.stateButtonHover,
      "& svg": {
        fill: isActive
          ? palette.text.secondary
          : palette.icon.fill.stateButtonHover,
      },
    }),

  menuItemText:
    (isActive) =>
    ({ palette }) => ({
      color: isActive ? palette.text.secondary : palette.text.metrics,
    }),
});

export { DRAWER_WIDTH, COLLAPSED_DRAWER_WIDTH };

export default Sidebar;
