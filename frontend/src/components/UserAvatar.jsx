import Avatar from '@mui/material/Avatar';
import { useTheme } from '@mui/material/styles';

function stringToColor(string) {
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
}

function getInitials(name) {
  const names = name.split(' ');
  let firstName = names[0];
  let lastName = names[names.length - 1];
  if (names.length === 1) {
    firstName = name;
    lastName = '';
  }
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function UserAvatar({ name, size = 20 }) {
  const theme = useTheme();

  const style = {
    padding: 0,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: stringToColor(name || ''),
    color: theme.palette.text.secondary,
    fontSize: `${Math.ceil(size / 2)}px`,
  };

  return (
    <Avatar style={style} alt={name}>
      {name ? getInitials(name) : null}
    </Avatar>
  );
}
