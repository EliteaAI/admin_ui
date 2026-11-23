import { memo, useCallback, useMemo, useState } from 'react';

import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import TravelExploreIcon from '@mui/icons-material/TravelExploreOutlined';
import {
  Box,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  Typography,
} from '@mui/material';

import { useToolSpendFeaturesQuery } from '@/api/budgets.api';
import { ArrowLeftIcon, ArrowRightIcon, EliteAIcon, LogoutIcon } from '@/components/Icons';
import { COLLAPSED_DRAWER_WIDTH, DRAWER_WIDTH } from '@/components/Layout/constants/layout.constants';
import { MENU_GROUPS } from '@/components/Layout/constants/menu.constants';
import { SIDEBAR_PERMISSIONS } from '@/constants/permissions.constants';
import { RouteDefinitions } from '@/constants/routes.constants';
import { useCheckPermission } from '@/hooks/useCheckPermission.hooks';
import { setSidebarGroupOpen, toggleSidebarCollapsed } from '@/store';

import SidebarGroup from './SidebarGroup';
import SidebarMenuItem from './SidebarMenuItem';
import ThemeModeToggle from './ThemeModeToggle';
import UserAvatar from './UserAvatar';

const TOOL_SPEND_SEGMENT = 'tool-spend';
const TOOL_SPEND_ID_PREFIX = `${TOOL_SPEND_SEGMENT}-`;

const Sidebar = memo(() => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const sideBarCollapsed = useSelector(state => state.settings.sideBarCollapsed);
  const sidebarGroupsOpen = useSelector(state => state.settings.sidebarGroupsOpen);
  const socketConnected = useSelector(state => state.settings.socketConnected);
  const user = useSelector(state => state.user.user);
  const { hasAnyPermission, hasSidebarAccess } = useCheckPermission();
  const styles = sidebarStyles(sideBarCollapsed, socketConnected);
  const [anchorEl, setAnchorEl] = useState(null);

  const canViewBudgets = hasAnyPermission(SIDEBAR_PERMISSIONS.budgets);
  const { data: toolSpendFeatures } = useToolSpendFeaturesQuery(undefined, { skip: !canViewBudgets });

  const isVisible = useCallback(item => hasSidebarAccess(item.id), [hasSidebarAccess]);

  // One entry per Tool Spend feature right after Budgets, wherever Budgets sits
  const withToolSpendItems = useCallback(
    items => {
      const featureItems = (canViewBudgets ? toolSpendFeatures || [] : []).map(item => ({
        // Prefixed so a feature name can never collide with a fixed entry's id or React key
        id: `${TOOL_SPEND_ID_PREFIX}${item.feature}`,
        label: item.label,
        icon: TravelExploreIcon,
        url: `${RouteDefinitions.ToolSpend}/${item.feature}`,
      }));
      return items.flatMap(item => (item.id === 'budgets' ? [item, ...featureItems] : [item]));
    },
    [canViewBudgets, toolSpendFeatures],
  );

  // A group with no visible entry is not rendered, heading included
  const visibleGroups = useMemo(
    () =>
      MENU_GROUPS.map(group => ({
        ...group,
        items: withToolSpendItems(group.items.filter(isVisible)),
      })).filter(group => group.items.length > 0),
    [isVisible, withToolSpendItems],
  );

  const isActiveTab = useCallback(
    tabId => {
      const pathSegments = location.pathname.split('/');
      const lastSegment = pathSegments[pathSegments.length - 1];
      const onToolSpend = pathSegments[pathSegments.length - 2] === TOOL_SPEND_SEGMENT;
      // A feature page is matched by its full id, so a feature named like a fixed entry never lights both
      if (onToolSpend) return tabId === `${TOOL_SPEND_ID_PREFIX}${lastSegment}`;
      return lastSegment === tabId;
    },
    [location.pathname],
  );

  const activeGroupId = useMemo(
    () => visibleGroups.find(group => group.items.some(item => isActiveTab(item.id)))?.id ?? null,
    [visibleGroups, isActiveTab],
  );

  const handleItemClick = useCallback(
    url => {
      navigate(url);
    },
    [navigate],
  );

  const handleGroupToggle = useCallback(
    (groupId, open) => {
      dispatch(setSidebarGroupOpen({ groupId, open }));
    },
    [dispatch],
  );

  const handleUserMenuOpen = useCallback(event => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleUserMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    handleUserMenuClose();
    window.location.href = window.location.origin.toString() + '/forward-auth/logout';
  }, [handleUserMenuClose]);

  const handleToggleCollapse = useCallback(() => {
    dispatch(toggleSidebarCollapsed());
  }, [dispatch]);

  const renderMenuItem = useCallback(
    item => (
      <SidebarMenuItem
        key={item.id}
        item={item}
        isActive={isActiveTab(item.id)}
        collapsed={sideBarCollapsed}
        onSelect={handleItemClick}
      />
    ),
    [isActiveTab, sideBarCollapsed, handleItemClick],
  );

  const renderedGroups = useMemo(
    () =>
      visibleGroups.map((group, index) => (
        <SidebarGroup
          key={group.id}
          group={group}
          expanded={group.id === activeGroupId || sidebarGroupsOpen[group.id] === true}
          locked={group.id === activeGroupId}
          collapsed={sideBarCollapsed}
          showDivider={index > 0}
          onToggle={handleGroupToggle}
        >
          {group.items.map(renderMenuItem)}
        </SidebarGroup>
      )),
    [visibleGroups, activeGroupId, sidebarGroupsOpen, sideBarCollapsed, handleGroupToggle, renderMenuItem],
  );

  const userName = user?.name || 'Admin';

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
                title={`Server is ${socketConnected ? 'connected' : 'disconnected'}`}
                placement="right"
              >
                <Box sx={styles.socketIndicator} />
              </Tooltip>
            </IconButton>
            {!sideBarCollapsed && (
              <Typography
                variant="headingSmall"
                sx={styles.headerText}
              >
                Elitea Admin
              </Typography>
            )}
          </Box>
          {!sideBarCollapsed && <ThemeModeToggle />}
        </Box>

        <Box sx={styles.topMenuContainer}>{renderedGroups}</Box>

        <Box sx={styles.bottomSection}>
          <Divider sx={styles.divider} />

          <Box sx={styles.userSection}>
            <IconButton
              onClick={handleUserMenuOpen}
              sx={styles.userButton}
              disableRipple
            >
              <Box sx={styles.userButtonContent}>
                <UserAvatar
                  name={userName}
                  size={16}
                />
                {!sideBarCollapsed && (
                  <>
                    <Typography
                      variant="labelSmall"
                      sx={styles.userNameText}
                      noWrap
                    >
                      {userName}
                    </Typography>
                    <Box
                      component={ArrowRightIcon}
                      sx={styles.arrowIcon}
                    />
                  </>
                )}
              </Box>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleUserMenuClose}
              anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
              sx={styles.menu}
            >
              <MenuItem onClick={handleLogout}>
                <ListItemIcon sx={styles.menuItemIcon}>
                  <LogoutIcon sx={{ fontSize: '1rem' }} />
                </ListItemIcon>
                <ListItemText
                  primary="Logout"
                  slotProps={{ primary: { variant: 'bodyMedium' } }}
                />
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      </Box>
      <Box
        onClick={handleToggleCollapse}
        sx={styles.collapseButton}
      >
        {sideBarCollapsed ? <ArrowRightIcon /> : <ArrowLeftIcon />}
      </Box>
    </Box>
  );
});

Sidebar.displayName = 'Sidebar';

/** @type {MuiSx} */
const sidebarStyles = (collapsed, socketConnected) => ({
  drawerWrapper: {
    position: 'relative',
    display: 'flex',
    height: '100%',
  },

  drawer: ({ palette }) => ({
    width: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    minWidth: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    maxWidth: collapsed ? COLLAPSED_DRAWER_WIDTH : DRAWER_WIDTH,
    transition: 'width 0.2s ease-in-out, min-width 0.2s ease-in-out, max-width 0.2s ease-in-out',
    borderRight: `0.0625rem solid ${palette.border.table}`,
    backgroundColor: palette.background.tabPanel,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    boxSizing: 'border-box',
  }),

  collapseButton: ({ palette }) => ({
    position: 'absolute',
    top: '3rem',
    right: '-0.75rem',
    width: '1.5rem',
    height: '1.5rem',
    borderRadius: '50%',
    border: `0.0625rem solid ${palette.border.lines || palette.border.table}`,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    background: palette.background.secondary || palette.background.tabPanel,
    zIndex: 1,
  }),

  header: ({ palette }) => ({
    height: '3.75rem',
    minHeight: '3.75rem',
    padding: '0 0.75rem',
    boxSizing: 'border-box',
    borderBottom: `0.0625rem solid ${palette.border.table}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: collapsed ? 'center' : 'space-between',
  }),

  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  homeButton: ({ palette }) => ({
    padding: 0,
    width: '2.25rem',
    height: '2.25rem',
    borderRadius: '50%',
    background: 'transparent',
    position: 'relative',
    '&:hover': {
      backgroundColor: palette.background.conversation?.hover || palette.background.tabButton?.hover,
    },
  }),

  socketIndicator: ({ palette }) => ({
    width: '0.5rem',
    height: '0.5rem',
    borderRadius: '50%',
    backgroundColor: socketConnected
      ? palette.background.socketIndicator.connected
      : palette.background.socketIndicator.disconnected,
    position: 'absolute',
    top: '0rem',
    right: '0rem',
    cursor: 'pointer',
  }),

  eliteaIcon: {
    fontSize: '1.75rem',
  },

  headerText: ({ palette }) => ({
    color: palette.text.secondary,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),

  topMenuContainer: {
    paddingTop: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    paddingLeft: '0.75rem',
    paddingRight: '0.75rem',
    boxSizing: 'border-box',
    gap: '0.75rem',
    maxWidth: '100%',
    flex: '1 1 auto',
    minHeight: 0,
    overflowY: 'auto',
  },

  bottomSection: {
    flex: '0 0 auto',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
  },

  divider: ({ palette }) => ({
    borderColor: palette.border.table,
    marginLeft: '1rem',
    marginRight: '1rem',
  }),

  userSection: {
    padding: '0.5rem 0.75rem 1rem 0.75rem',
  },

  userButton: ({ palette }) => ({
    width: '100%',
    padding: '0.5rem',
    borderRadius: '0.375rem',
    '&:hover': {
      backgroundColor: palette.background.conversation?.hover || palette.background.tabButton.hover,
    },
  }),

  userButtonContent: ({ palette }) => ({
    width: '100%',
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    cursor: 'pointer',
    color: palette.text.metrics || palette.text.default,
  }),

  userNameText: ({ palette }) => ({
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: palette.text.metrics || palette.text.default,
    textAlign: 'left',
  }),

  arrowIcon: {
    fontSize: '1rem',
  },

  menu: {
    '& .MuiPaper-root': {
      marginLeft: '1rem',
      marginTop: '-1rem',
    },
  },

  menuItemIcon: {
    minWidth: '1rem !important',
    marginRight: '0.75rem',
  },
});

export default Sidebar;
