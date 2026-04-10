import PropTypes from 'prop-types';

import Button from '@mui/material/Button';

function ExampleButton({ label, variant = 'contained', color = 'primary', size = 'medium', onClick }) {
  return (
    <Button variant={variant} color={color} size={size} onClick={onClick}>
      {label}
    </Button>
  );
}

ExampleButton.propTypes = {
  label: PropTypes.string.isRequired,
  variant: PropTypes.oneOf(['contained', 'outlined', 'text']),
  color: PropTypes.oneOf(['primary', 'secondary', 'error', 'warning', 'info', 'success']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  onClick: PropTypes.func,
};

export default ExampleButton;
