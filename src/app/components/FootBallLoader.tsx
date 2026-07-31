import React from 'react'
import Image from 'next/image'

interface FootballLoaderProps {
  className?: string
  size?: number
}

const FootballLoader: React.FC<FootballLoaderProps> = ({
  className = '',
  size = 96,
}) => (
  <div className={`flex w-full items-center justify-center ${className}`} role="status" aria-live="polite" aria-label="Loading">
    <div className="rounded-full border border-[var(--color-surface-border)] bg-[var(--color-surface-soft)]/70 p-3 shadow-lg">
      <Image
        src="/football.png"
        alt=""
        aria-hidden="true"
        className="animate-spin"
        width={size}
        height={size}
        priority
      />
    </div>
  </div>
)

export default FootballLoader