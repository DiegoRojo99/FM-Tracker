'use client';

import Image from 'next/image';
import { ReactNode } from 'react';

type BlurredCardProps = {
  children: ReactNode;
  imageSrc?: string;
  alt?: string;
  className?: string; // Allow custom styling if needed
  blurSize?: '2xs' | 'xs' | 'sm' | 'md' | 'lg'; // Define blur size options
};

export default function BlurredCard({
  children,
  imageSrc = '/football-corner.jpg',
  alt = 'Background',
  className = '',
  blurSize = 'sm',
}: BlurredCardProps) {
  return (
    <div className={`relative rounded-xl overflow-hidden shadow-lg ${className}`}>
      {/* Blurred background image */}
      <Image
        src={imageSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
        className="object-cover opacity-40"
        unoptimized
      />

      {/* Foreground content with backdrop blur */}
      <div className={`relative z-10 p-4 backdrop-blur-${blurSize} bg-white/60 dark:bg-zinc-900/60 rounded-xl h-full`}>
        {children}
      </div>
    </div>
  );
}
