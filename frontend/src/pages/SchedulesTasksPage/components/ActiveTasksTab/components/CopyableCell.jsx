import { memo, useCallback, useState } from 'react';

import CheckOutlined from '@mui/icons-material/CheckOutlined';
import ContentCopyOutlined from '@mui/icons-material/ContentCopyOutlined';
import { Box, IconButton, Tooltip, Typography } from '@mui/material';

// Cell that shows truncated text with a click-to-copy affordance for the full
// value (Task ID / Meta / Runner). Copy feedback swaps the icon for ~1.2s.
const CopyableCell = memo(props => {
  const { display, full, mono } = props;

  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(
    async e => {
      e.stopPropagation();
      if (!full) return;
      try {
        await navigator.clipboard.writeText(String(full));
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        // clipboard unavailable (e.g. insecure context) — no-op
      }
    },
    [full],
  );
  const styles = copyableCellStyles();

  return (
    <Box sx={styles.copyCell}>
      <Tooltip title={full || ''}>
        <Typography
          variant="bodyMedium"
          color="text.secondary"
          sx={mono ? styles.cellTextMono : styles.cellText}
        >
          {display}
        </Typography>
      </Tooltip>
      {full ? (
        <Tooltip title={copied ? 'Copied' : 'Copy'}>
          <IconButton
            size="small"
            onClick={handleCopy}
            className="copy-btn"
            sx={styles.copyButton}
          >
            {copied ? (
              <CheckOutlined
                sx={styles.copyIcon}
                color="success"
              />
            ) : (
              <ContentCopyOutlined sx={styles.copyIcon} />
            )}
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
});

CopyableCell.displayName = 'CopyableCell';

/** @type {MuiSx} */
const copyableCellStyles = () => ({
  cellText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  cellTextMono: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontFamily: 'monospace',
    fontSize: '0.75rem',
  },
  copyCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    minWidth: 0,
    '&:hover .copy-btn': { opacity: 1 },
  },
  copyButton: {
    padding: '0.125rem',
    opacity: 0.35,
    transition: 'opacity 0.15s',
    flexShrink: 0,
  },
  copyIcon: {
    fontSize: '0.875rem',
  },
});

export default CopyableCell;
