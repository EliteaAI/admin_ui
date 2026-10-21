import { memo, useCallback, useState } from 'react';

import MoreVertOutlined from '@mui/icons-material/MoreVertOutlined';
import { Box, IconButton, Menu, MenuItem, Tooltip } from '@mui/material';

import { SELF_APPROVAL_HINT } from '@/pages/GovernancePage/components/IdentitiesTab/constants/identities.constants';

/**
 * The row menu. `actions` is `[{ action, label, disabled }]`, already limited to the actions that are valid for the
 * row's state and allowed for the operator. "Details" is always there, because reading needs only the view permission.
 */
const IdentityRowActions = memo(props => {
  const { row, actions, onDetails, onAction } = props;

  const [anchorEl, setAnchorEl] = useState(null);

  const handleOpen = useCallback(event => setAnchorEl(event.currentTarget), []);
  const handleClose = useCallback(() => setAnchorEl(null), []);

  const handleDetails = useCallback(() => {
    setAnchorEl(null);
    onDetails(row);
  }, [onDetails, row]);

  const handleAction = useCallback(
    action => () => {
      setAnchorEl(null);
      onAction(row, action);
    },
    [onAction, row],
  );

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        aria-label="Identity actions"
        data-testid={`identity-actions-${row.id}`}
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
          data-testid="identity-action-details"
        >
          Details
        </MenuItem>
        {actions.map(item => (
          <Tooltip
            key={item.action}
            title={item.disabled ? SELF_APPROVAL_HINT : ''}
            placement="left"
          >
            <Box component="span">
              <MenuItem
                disabled={item.disabled}
                onClick={handleAction(item.action)}
                data-testid={`identity-action-${item.action}`}
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

IdentityRowActions.displayName = 'IdentityRowActions';

export default IdentityRowActions;
