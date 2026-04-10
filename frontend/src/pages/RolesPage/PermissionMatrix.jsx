import { memo, useCallback, useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import PermissionGroupRow from "./PermissionGroupRow";
import PermissionRow from "./PermissionRow";

const PermissionMatrix = memo((props) => {
  const { rows, roles, search, onChange } = props;

  const [expandedGroups, setExpandedGroups] = useState(new Set());

  const filteredRows = useMemo(() => {
    if (!search) return rows;

    const lower = search.toLowerCase();
    return rows.filter((r) => r.name.toLowerCase().includes(lower));
  }, [rows, search]);

  const grouped = useMemo(() => {
    const groups = {};
    for (const row of filteredRows) {
      const parts = row.name.split(".");
      const groupKey = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : parts[0];

      if (!groups[groupKey]) groups[groupKey] = [];

      groups[groupKey].push(row);
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredRows]);

  useEffect(() => {
    if (search) {
      const groupsWithMatches = new Set(
        grouped.map(([groupName]) => groupName),
      );
      setExpandedGroups(groupsWithMatches);
    }
  }, [search, grouped]);

  const toggleExpand = useCallback((groupName) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupName)) next.delete(groupName);
      else next.add(groupName);
      return next;
    });
  }, []);

  const handlePermissionChange = useCallback(
    (permName, role, value) => {
      onChange((draft) =>
        draft.map((r) => (r.name === permName ? { ...r, [role]: value } : r)),
      );
    },
    [onChange],
  );

  const handleGroupToggle = useCallback(
    (groupName, role, value) => {
      const groupPerms = grouped.find(([name]) => name === groupName)?.[1];
      if (!groupPerms) return;
      const permNames = new Set(groupPerms.map((p) => p.name));
      onChange((draft) =>
        draft.map((r) => (permNames.has(r.name) ? { ...r, [role]: value } : r)),
      );
    },
    [grouped, onChange],
  );

  const expandAll = useCallback(() => {
    setExpandedGroups(new Set(grouped.map(([name]) => name)));
  }, [grouped]);

  const collapseAll = useCallback(() => {
    setExpandedGroups(new Set());
  }, []);

  const roleColumnWidth = `${Math.max(5, 100 / (roles.length + 3))}%`;
  const gridColumns = `1fr ${roles.map(() => roleColumnWidth).join(" ")}`;

  return (
    <Box
      sx={{
        "--matrix-columns": gridColumns,
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={styles.header}>
        <Box sx={styles.headerNameCell}>
          <Typography variant="labelMedium" color="text.secondary">
            Permission
          </Typography>
          <Box sx={styles.expandControls}>
            <Typography
              variant="bodySmall"
              onClick={expandAll}
              sx={styles.expandLink}
            >
              Expand all
            </Typography>
            <Typography variant="bodySmall" color="text.metrics">
              |
            </Typography>
            <Typography
              variant="bodySmall"
              onClick={collapseAll}
              sx={styles.expandLink}
            >
              Collapse all
            </Typography>
          </Box>
        </Box>
        {roles.map((role) => (
          <Box key={role} sx={styles.headerRoleCell}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
              sx={{ textTransform: "capitalize" }}
            >
              {role}
            </Typography>
          </Box>
        ))}
      </Box>

      <Box sx={styles.body}>
        {grouped.length === 0 && (
          <Box sx={styles.emptyMessage}>
            <Typography variant="bodyMedium" color="text.metrics">
              No permissions match the search.
            </Typography>
          </Box>
        )}
        {grouped.map(([groupName, perms]) => {
          const isExpanded = expandedGroups.has(groupName);
          return (
            <Box key={groupName}>
              <PermissionGroupRow
                groupName={groupName}
                permissions={perms}
                roles={roles}
                expanded={isExpanded}
                onToggleExpand={toggleExpand}
                onToggleGroupRole={handleGroupToggle}
              />
              {isExpanded &&
                perms.map((perm) => (
                  <PermissionRow
                    key={perm.name}
                    permission={perm.name}
                    roles={roles}
                    values={perm}
                    onChange={handlePermissionChange}
                  />
                ))}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});

const styles = {
  header: ({ palette }) => ({
    display: "grid",
    gridTemplateColumns: "var(--matrix-columns)",
    alignItems: "center",
    height: "2.25rem",
    padding: "0 0 0 0.75rem",
    backgroundColor: palette.background.userInputBackground,
    border: `0.0625rem solid ${palette.border.lines}`,
    borderRadius: "0.5rem",
    overflow: "hidden",
    position: "sticky",
    top: 0,
    zIndex: 1,
  }),
  headerNameCell: {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  expandControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
  },
  expandLink: ({ palette }) => ({
    cursor: "pointer",
    color: palette.text.button.showMore,

    "&:hover": { textDecoration: "underline" },
  }),
  headerRoleCell: {
    display: "flex",
    justifyContent: "center",
  },
  body: {
    flex: 1,
    overflowY: "auto",
    minHeight: 0,
  },
  emptyMessage: {
    display: "flex",
    justifyContent: "center",
    padding: "3rem",
  },
};

export default PermissionMatrix;
