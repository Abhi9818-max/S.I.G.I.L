
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Star, ListChecks, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/reputation', label: 'Reputation', icon: Star },
  { href: '/todo', label: 'Pacts', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  // Hide the nav bar on the login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav 
        className="fixed bottom-0 left-0 w-full h-16 md:hidden bg-background/80 border-t border-border/50 flex justify-around items-center z-50 backdrop-blur-lg"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'flex flex-col items-center justify-center text-xs gap-1 transition-colors',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
