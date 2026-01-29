// Premium Button Component - Professional UI Design System
// Supports multiple variants, sizes, and states with glassmorphism effects

import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'ghost'
  | 'outline'
  | 'glass'
  | 'gradient'
  | 'neon';

export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  rounded?: boolean;
  glow?: boolean;
}

export const PremiumButton = forwardRef<HTMLButtonElement, PremiumButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      rounded = false,
      glow = false,
      disabled,
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClass = 'premium-btn';
    const classes = [
      baseClass,
      `${baseClass}--${variant}`,
      `${baseClass}--${size}`,
      fullWidth && `${baseClass}--full`,
      rounded && `${baseClass}--rounded`,
      glow && `${baseClass}--glow`,
      isLoading && `${baseClass}--loading`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="premium-btn__spinner" size={16} />}
        {!isLoading && leftIcon && <span className="premium-btn__icon">{leftIcon}</span>}
        {children && <span className="premium-btn__text">{children}</span>}
        {!isLoading && rightIcon && <span className="premium-btn__icon">{rightIcon}</span>}
      </button>
    );
  }
);

PremiumButton.displayName = 'PremiumButton';

// Icon Button variant for compact icon-only buttons
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon: ReactNode;
  rounded?: boolean;
  glow?: boolean;
  tooltip?: string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      icon,
      rounded = true,
      glow = false,
      tooltip,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClass = 'premium-icon-btn';
    const classes = [
      baseClass,
      `premium-btn--${variant}`,
      `${baseClass}--${size}`,
      rounded && `${baseClass}--rounded`,
      glow && `${baseClass}--glow`,
      isLoading && `${baseClass}--loading`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || isLoading}
        title={tooltip}
        {...props}
      >
        {isLoading ? <Loader2 className="premium-btn__spinner" size={16} /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';

// Button Group for grouping related buttons
interface ButtonGroupProps {
  children: ReactNode;
  attached?: boolean;
  vertical?: boolean;
  className?: string;
}

export function ButtonGroup({
  children,
  attached = false,
  vertical = false,
  className = ''
}: ButtonGroupProps) {
  const classes = [
    'premium-btn-group',
    attached && 'premium-btn-group--attached',
    vertical && 'premium-btn-group--vertical',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
