import { memo, useCallback } from 'react';

import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Input from '@mui/material/Input';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';

import PlusIcon from '@/components/Icons/PlusIcon';
import SearchIcon from '@/components/Icons/SearchIcon';

const DrawerPageHeader = memo(function DrawerPageHeader(props) {
  const {
    showBorder,
    sx,
    title,
    tabs,
    showSearchInput,
    showAddButton,
    extraContent,
    search,
    onSearchChange,
    searchPlaceholder = 'Search',
    searchInputSx,
    onAdd,
    addButtonTooltip,
    addButtonDisabled,
  } = props;

  const styles = getStyles();

  const handleInputChange = useCallback(
    (event) => {
      onSearchChange(event.target.value);
    },
    [onSearchChange],
  );

  return (
    <Box sx={[styles.container(showBorder), sx]}>
      <Box sx={styles.titleContainer}>
        <Typography variant="headingSmall" color="text.secondary" component="div">
          {title}
        </Typography>
      </Box>
      {tabs && <Box sx={styles.tabsContainer}>{tabs}</Box>}
      <Box sx={tabs ? styles.bodyCompact : styles.body}>
        {showSearchInput && (
          <Box sx={styles.searchInput}>
            <Input
              disableUnderline
              variant="standard"
              placeholder={searchPlaceholder}
              value={search}
              onChange={handleInputChange}
              sx={[styles.searchInputField, searchInputSx]}
              startAdornment={
                <InputAdornment position="start" sx={styles.inputAdornment}>
                  <SearchIcon />
                </InputAdornment>
              }
            />
          </Box>
        )}
        {extraContent}
        {showAddButton && (
          <Tooltip title={addButtonTooltip} placement="top">
            <Box component="span">
              <IconButton
                disabled={!!addButtonDisabled}
                disableRipple
                onClick={onAdd}
                sx={styles.addButton}
              >
                <PlusIcon style={styles.plusIcon} />
              </IconButton>
            </Box>
          </Tooltip>
        )}
      </Box>
    </Box>
  );
});

const getStyles = () => ({
  container: (showBorder) => ({
    height: '3.75rem',
    minHeight: '3.75rem',
    width: '100%',
    borderBottom: ({ palette }) =>
      showBorder ? `0.0625rem solid ${palette.border.table}` : undefined,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 1.5rem',
  }),
  titleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  tabsContainer: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-end',
    height: '100%',
  },
  body: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  bodyCompact: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '1rem',
  },
  searchInput: ({ palette }) => ({
    flexShrink: 0,
    width: '15rem',
    height: '2.25rem',
    backgroundColor: palette.background.userInputBackgroundActive,
    borderRadius: '1.6875rem',
    gap: '.5rem',
    borderBottom: '0rem',
    padding: '0.375rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
  }),
  searchInputField: {
    width: '100%',
    fontSize: '14px',
  },
  inputAdornment: {
    width: '1rem',
    height: '1rem',
    minWidth: '1rem',
  },
  addButton: ({ palette }) => ({
    minWidth: '1.75rem',
    width: '1.75rem',
    height: '1.75rem',
    padding: '.5rem',
    backgroundColor: palette.background.button.primary.default,
    borderRadius: '50%',
    '&:hover': {
      backgroundColor: palette.background.button.primary.hover,
    },
    '& svg': {
      fill: palette.icon.fill.send,
    },
  }),
  plusIcon: {
    width: '1rem',
    height: '1rem',
    flexShrink: 0,
  },
});

export default DrawerPageHeader;
