import { memo, useCallback, useState } from 'react';

import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';

/**
 * The row menu. `actions` is `[{ action, label, disabled, hint }]`, already limited to the actions that are valid for
 * the row's state and allowed for the operator; `hint` explains why an item is disabled. "Details" is always there,
 * because reading needs only the view permission. `testIdPrefix` names the ids: `<prefix>-actions-<row id>`,
 * `<prefix>-action-details` and `<prefix>-action-<action>`.
 */
const RowActionsMenu = memo(props => {
  const { row, actions, onDetails, onAction, testIdPrefix, ariaLabel } = props;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleDetails = useCallback(() => {
    setAnchorEl(null);
    onDetails(row);
  }, [onDetails, row]);

  const handleAction = useCallback(
    item => () => {
      // A disabled item can still be reached by the keyboard or a script; it does nothing
      if (item.disabled) return;
      setAnchorEl(null);
      onAction(row, item.action);
    },
    [onAction, row],
  );

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label={ariaLabel}
        data-testid={`${testIdPrefix}-actions-${row.id}`}
      >
        <MoreVertOutlined fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem
          onClick={handleDetails}
          data-testid={`${testIdPrefix}-action-details`}
        >
          Details
        </MenuItem>
        {actions.map(item => (
          <Tooltip
            key={item.action}
            title={item.hint ?? ''}
            placement="left"
          >
            <Box component="span">
              <MenuItem
                disabled={item.disabled}
                onClick={handleAction(item)}
                data-testid={`${testIdPrefix}-action-${item.action}`}
              >
                {item.label}
              </MenuItem>
            </Box>
          </Tooltip>
        ))}
      </Menu>
    </>
  );
});

RowActionsMenu.displayName = 'RowActionsMenu';

export default RowActionsMenu;
