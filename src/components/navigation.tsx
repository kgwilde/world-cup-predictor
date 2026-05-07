'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Brain, Trophy, User } from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Home;
};

const BASE_NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home', Icon: Home },
  { href: '/predictions', label: 'Predictions', Icon: Brain },
  { href: '/scoring', label: 'Scoring', Icon: Trophy },
  { href: '/profile', label: 'Profile', Icon: User },
];

function isActivePath(itemPath: string, currentPath: string): boolean {
  if (itemPath === '/') {
    return currentPath === '/';
  }
  return currentPath.startsWith(itemPath);
}

type NavLinkProps = {
  item: NavItem;
  isActive: boolean;
  variant: 'top' | 'bottom';
  isDisabled?: boolean;
};

function NavLink({ item, isActive, variant, isDisabled = false }: NavLinkProps) {
  const { href, label, Icon } = item;

  if (variant === 'top') {
    const baseClasses =
      'px-4 py-2 font-display font-bold text-sm tracking-wide transition-colors border-b-2';

    const activeClasses = isActive
      ? 'border-wc-white text-wc-white'
      : 'border-transparent text-wc-white/40 hover:text-wc-white';

    const disabledClasses = isDisabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : '';

    return (
      <Link
        href={href}
        className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
        aria-disabled={isDisabled}
        tabIndex={isDisabled ? -1 : 0}
      >
        {label}
      </Link>
    );
  }

  const baseClasses =
    'flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors';

  const activeClasses = isActive ? 'text-wc-white' : 'text-wc-white/40';

  const disabledClasses = isDisabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : '';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
    >
      <Icon className="w-5 h-5" />
      <span className="font-display font-bold text-xs tracking-wide">{label}</span>
    </Link>
  );
}

export function Navigation() {
  const currentPath = usePathname();

  return (
    <>
      <nav className="hidden sm:block bg-wc-ink border-b border-wc-white/10 sticky top-[88px] z-10">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-2">
          {BASE_NAV_ITEMS.map((item) => {
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActivePath(item.href, currentPath)}
                variant="top"
              />
            );
          })}
        </div>
      </nav>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-wc-ink border-t border-wc-white/10 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto flex items-stretch">
          {BASE_NAV_ITEMS.map((item) => {
            const isProfileTab = item.label === 'Profile';

            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActivePath(item.href, currentPath)}
                variant="bottom"
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}
