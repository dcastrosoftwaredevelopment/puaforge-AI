import { type ComponentProps } from 'react';
import { Button as FlowbiteButton } from 'flowbite-react';
import type { ButtonProps } from 'flowbite-react';

type Variant = 'primary' | 'secondary' | 'blue' | 'ghost' | 'danger' | 'terracotta'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface UiButtonProps extends Omit<ComponentProps<'button'>, 'color'> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  fullWidth?: boolean
  pill?: boolean
}

export default function Button({ variant = 'secondary', size = 'md', isLoading, fullWidth, pill, children, disabled, className, ...rest }: UiButtonProps) {
  return (
    <FlowbiteButton
      color={variant}
      size={size as ButtonProps['size']}
      disabled={disabled || isLoading}
      fullSized={fullWidth}
      pill={pill}
      className={className}
      {...(rest as object)}
    >
      {children}
    </FlowbiteButton>
  );
}
