'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ComponentProps } from 'react';

type NavigationLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
  href: string;
};

export default function NavigationLink({ href, className = '', ...props }: NavigationLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname?.startsWith(`${href}/`);

  return (
    <Link
      {...props}
      href={href}
      className={`fm-nav-link ${className}`}
      aria-current={active ? 'page' : undefined}
    />
  );
}
