import React from 'react';

interface ProfileSectionProps {
  title?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noContentPadding?: boolean;
}

export default function ProfileSection({ title, icon, children, className = '', noContentPadding = false }: ProfileSectionProps) {
  return (
    <section className={`w-full max-w-4xl mx-auto bg-[var(--color-dark)] rounded-xl shadow-lg border border-[var(--color-primary)] p-0 mb-8 ${className}`}>
      {(title || icon) && (
        <div className="flex items-center mb-6 gap-3 px-8 pt-8">
          {icon && <span className="text-2xl">{icon}</span>}
          {title && <h2 className="text-2xl font-bold text-white">{title}</h2>}
        </div>
      )}
      <div className={noContentPadding ? '' : 'px-8 pb-8'}>{children}</div>
    </section>
  );
}
