import React from 'react';
import Image from 'next/image';

interface LoadingButtonProps {
  type?: 'button' | 'submit' | 'reset';
  width?: 'auto' | 'full';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  type = 'button',
  width = 'auto',
  size = 'md',
  disabled = false,
  isLoading = false,
  loadingText,
  children,
  onClick,
  className = '',
}) => {
  const baseClasses = 'relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-200 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const widthClasses = {
    auto: '',
    full: 'w-full',
  };

  const classes = `${baseClasses} ${sizeClasses[size]} ${widthClasses[width]} ${className}`;

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={classes}
    >
      {isLoading && (
        <Image
          src="/football.png"
          alt=""
          width={16}
          height={16}
          className="mr-2 h-4 w-4 animate-spin"
          unoptimized
        />
      )}
      {isLoading ? (loadingText || 'Loading...') : children}
    </button>
  );
};

export default LoadingButton;
