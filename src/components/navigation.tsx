'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Brain, Trophy, User, Shield } from 'lucide-react';

import { useAuthStore } from '@/app/stores/useAuthStore';

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
  showBadge?: boolean;
};

function NavLink({ item, isActive, variant, isDisabled = false, showBadge = false }: NavLinkProps) {
  const { href, label, Icon } = item;

  if (variant === 'top') {
    const baseClasses =
      'relative px-4 py-2 font-display font-bold text-sm tracking-wide transition-colors border-b-2';

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
        {showBadge && <span className="absolute top-1.5 right-1 w-2 h-2 rounded-full bg-wc-gold" />}
      </Link>
    );
  }

  const baseClasses =
    'relative flex flex-col items-center justify-center gap-1 flex-1 py-3 transition-colors';

  const activeClasses = isActive ? 'text-wc-white' : 'text-gray-400';

  const disabledClasses = isDisabled ? 'opacity-40 pointer-events-none cursor-not-allowed' : '';

  return (
    <Link
      href={href}
      className={`${baseClasses} ${activeClasses} ${disabledClasses}`}
      aria-disabled={isDisabled}
      tabIndex={isDisabled ? -1 : 0}
    >
      <div className="relative">
        <Icon className="w-5 h-5" />
        {showBadge && (
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-wc-gold" />
        )}
      </div>
      <span className="font-display font-bold text-xs tracking-wide">{label}</span>
    </Link>
  );
}

export function Navigation() {
  const currentPath = usePathname();
  const user = useAuthStore((s) => s.user);
  const authLoading = useAuthStore((s) => s.loading);
  const showProfileBadge = !authLoading && !user;
  const isAdmin = !!user && user.uid === process.env.NEXT_PUBLIC_ADMIN_UID;

  const navItems = isAdmin
    ? [...BASE_NAV_ITEMS, { href: '/admin', label: 'Admin', Icon: Shield }]
    : BASE_NAV_ITEMS;

  return (
    <>
      <nav className="hidden sm:block bg-wc-ink border-b border-wc-white/10 sticky top-[88px] z-10">
        <div className="max-w-2xl mx-auto px-4 flex items-center gap-2">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActivePath(item.href, currentPath)}
                variant="top"
                showBadge={item.href === '/profile' && showProfileBadge}
              />
            );
          })}
        </div>
      </nav>

      <nav className="sm:hidden fixed bottom-0 inset-x-0 bg-wc-ink border-t border-wc-white/10 z-20 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-2xl mx-auto flex items-stretch">
          {navItems.map((item) => {
            return (
              <NavLink
                key={item.href}
                item={item}
                isActive={isActivePath(item.href, currentPath)}
                variant="bottom"
                showBadge={item.href === '/profile' && showProfileBadge}
              />
            );
          })}
        </div>
      </nav>
    </>
  );
}
