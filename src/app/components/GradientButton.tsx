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
    font-bold text-white rounded-lg
    transition-all duration-300 transform
    hover:scale-[1.02] cursor-pointer
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    shadow-lg
  `.trim();

  const gradientClasses = destructive
    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
    : 'bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-highlight)] hover:from-[var(--color-highlight)] hover:to-[var(--color-accent)]';

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${gradientClasses} ${className}`}
    >
      {children}
    </button>
  );
};

export default GradientButton;
