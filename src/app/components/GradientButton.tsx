import React from 'react';

interface GradientButtonProps {
  /** Button text or content */
  children: React.ReactNode;
  /** Click handler */
  onClick?: () => void;
  /** Button type for forms */
  type?: 'button' | 'submit' | 'reset';
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Width variant */
  width?: 'auto' | 'full';
  /** Custom className to add additional styles */
  className?: string;
  /** Whether to use destructive colors (red gradient) */
  destructive?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  size = 'md',
  width = 'auto',
  className = '',
  destructive = false,
}) => {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const widthClasses = {
    auto: 'inline-block',
    full: 'w-full',
  };

  const baseClasses = `
    ${sizeClasses[size]}
    ${widthClasses[width]}
    inline-flex items-center justify-center gap-2
    rounded-md font-bold
    border border-[var(--color-surface-border)]
    transition-colors duration-200
    hover:brightness-105 cursor-pointer
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-highlight)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-dark)]
    disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none disabled:hover:translate-y-0
  `.trim();

  const colorClasses = destructive
    ? 'bg-gradient-to-r from-[#b42318] to-[#d92d20] text-white'
    : 'bg-linear-to-r/srgb from-[var(--color-highlight)] to-[var(--color-highlight-violet)] text-white';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${colorClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default GradientButton;
