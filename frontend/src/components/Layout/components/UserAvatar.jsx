import { memo } from 'react';

import { Avatar } from '@mui/material';

const stringToColor = string => {
  let hash = 0;
  for (let i = 0; i < string.length; i += 1) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i += 1) {
    const value = (hash >> (i * 8)) & 0xff;
    color += `00${value.toString(16)}`.slice(-2);
  }
  return color;
};

const getInitials = name => {
  const names = name.split(' ');
  let firstName = names[0];
  let lastName = names[names.length - 1];
  if (names.length === 1) {
    firstName = name;
    lastName = '';
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const UserAvatar = memo(props => {
  const { name, size = 20 } = props;

  const styles = userAvatarStyles(name, size);

  return (
    <Avatar
      sx={styles.root}
      alt={name}
    >
      {name ? getInitials(name) : null}
    </Avatar>
  );
});

UserAvatar.displayName = 'UserAvatar';

/** @type {MuiSx} */
const userAvatarStyles = (name, size) => ({
  root: ({ palette }) => ({
    padding: 0,
    width: `${size / 16}rem`,
    height: `${size / 16}rem`,
    // Per-user color derived from the name, not a theme color
    backgroundColor: stringToColor(name || ''),
    color: palette.text.secondary,
    fontSize: `${Math.ceil(size / 2) / 16}rem`,
  }),
});

export default UserAvatar;
