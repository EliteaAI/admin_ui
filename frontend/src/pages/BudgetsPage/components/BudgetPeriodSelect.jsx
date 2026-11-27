import { memo, useCallback, useMemo } from 'react';

import { Box, ListItemIcon, MenuItem, Select, Typography } from '@mui/material';

import { ArrowDownIcon, CheckedIcon } from '@/components/Icons';

/**
 * Month picker of the Budgets header. It mirrors the select used across EliteaUI and the Usage
 * page: a borderless trigger with a chevron, a panel whose rows show the month and the days it
 * covers, a tint and a tick on the chosen month, and a note under the list.
 */
const BudgetPeriodSelect = memo(props => {
  const { value, options, onChange, disabled = false } = props;

  const styles = useMemo(() => budgetPeriodSelectStyles(), []);
  const menuProps = useMemo(
    () => ({
      sx: { '& .MuiPaper-root': { marginTop: '0.5rem' } },
      slotProps: { paper: { sx: styles.paper }, list: { sx: styles.list } },
    }),
    [styles],
  );

  const handleChange = useCallback(
    event => {
      onChange(event.target.value);
    },
    [onChange],
  );

  const renderValue = useCallback(
    selected => (
      <Typography
        variant="labelMedium"
        color="inherit"
        component="div"
      >
        {options.find(option => option.value === selected)?.label ?? selected}
      </Typography>
    ),
    [options],
  );

  return (
    <Select
      variant="standard"
      disableUnderline
      size="small"
      value={value}
      onChange={handleChange}
      renderValue={renderValue}
      disabled={disabled}
      IconComponent={ArrowDownIcon}
      MenuProps={menuProps}
      sx={styles.select}
      SelectDisplayProps={{ 'data-testid': 'budgets-period-select' }}
    >
      {options.map(option => (
        <MenuItem
          key={option.value}
          value={option.value}
          selected={option.value === value}
          sx={option.value === value ? [styles.item, styles.itemSelected] : styles.item}
          data-testid={`budgets-period-${option.value}`}
        >
          <Box sx={styles.itemText}>
            <Typography
              variant="labelMedium"
              color="text.secondary"
            >
              {option.isCurrent ? `${option.label} · current` : option.label}
            </Typography>
            <Typography
              variant="bodySmall"
              color="text.secondary"
            >
              {option.range}
            </Typography>
          </Box>
          {option.value === value && (
            <ListItemIcon sx={styles.check}>
              <CheckedIcon />
            </ListItemIcon>
          )}
        </MenuItem>
      ))}
      {/* Not an option: the list is fixed at four months and says so, like the Usage picker's footer */}
      <MenuItem
        disabled
        sx={styles.footer}
      >
        <Typography
          variant="bodySmall"
          sx={styles.footerText}
        >
          Current month and the three before it.
        </Typography>
      </MenuItem>
    </Select>
  );
});

BudgetPeriodSelect.displayName = 'BudgetPeriodSelect';

/** @type {MuiSx} */
const budgetPeriodSelectStyles = () => ({
  select: ({ palette }) => ({
    display: 'flex',
    height: '1.88rem',
    alignItems: 'center',
    '& .MuiSelect-select': {
      display: 'flex',
      alignItems: 'center',
      paddingRight: '1.5rem',
      color: palette.text.secondary,
      '&:focus': {
        backgroundColor: 'transparent',
      },
    },
    '& .MuiSelect-icon': {
      right: '0.25rem',
      color: palette.icon.fill.primary,
    },
  }),
  paper: {
    minWidth: '15rem',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  list: {
    padding: 0,
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '1rem',
    padding: '0.75rem 1.25rem',
  },
  itemSelected: ({ palette }) => ({
    backgroundColor: `${palette.background.interactiveItem.active} !important`,
  }),
  itemText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.125rem',
    minWidth: 0,
  },
  check: ({ palette }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1rem !important',
    color: palette.text.secondary,
  }),
  footer: ({ palette }) => ({
    opacity: '1 !important',
    padding: '0.75rem 1.25rem',
    borderTop: `0.0625rem solid ${palette.border.lines}`,
  }),
  footerText: ({ palette }) => ({
    fontStyle: 'italic',
    color: palette.text.metrics,
  }),
});

export default BudgetPeriodSelect;
