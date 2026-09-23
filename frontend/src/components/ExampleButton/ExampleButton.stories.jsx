import ExampleButton from './ExampleButton';

export default {
  title: 'Components/ExampleButton',
  component: ExampleButton,
  tags: ['autodocs'],
  argTypes: {
    onClick: { action: 'clicked' },
  },
};

export const Primary = {
  args: {
    label: 'Primary Button',
    variant: 'contained',
    color: 'primary',
  },
};

export const Secondary = {
  args: {
    label: 'Secondary Button',
    variant: 'contained',
    color: 'secondary',
  },
};

export const Outlined = {
  args: {
    label: 'Outlined Button',
    variant: 'outlined',
    color: 'primary',
  },
};

export const Text = {
  args: {
    label: 'Text Button',
    variant: 'text',
    color: 'primary',
  },
};

export const Small = {
  args: {
    label: 'Small Button',
    variant: 'contained',
    size: 'small',
  },
};

export const Large = {
  args: {
    label: 'Large Button',
    variant: 'contained',
    size: 'large',
  },
};
