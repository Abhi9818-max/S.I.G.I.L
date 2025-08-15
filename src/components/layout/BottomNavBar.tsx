
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Star, ListChecks, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/reputation', label: 'Reputation', icon: Star },
  { href: '/todo', label: 'Pacts', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const [pillStyle, setPillStyle] = useState({});
  const navRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = navItems.findIndex((item) => pathname === item.href);
    const activeItemEl = itemRefs.current[activeIndex];

    if (activeItemEl && navRef.current) {
        const { offsetLeft, offsetWidth } = activeItemEl;
        setPillStyle({
            width: `${offsetWidth}px`,
            transform: `translateX(${offsetLeft}px)`,
        });
    }
  }, [pathname]);

  return (
    <nav 
        ref={navRef}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-sm h-16 md:hidden bg-background/50 border border-border/50 rounded-2xl flex justify-around items-center z-50 backdrop-blur-lg"
    >
      <div 
        className="nav-pill"
        style={pillStyle}
      />
      {navItems.map((item, index) => {
        const isActive = pathname === item.href;
        return (
          <Link
            href={item.href}
            key={item.href}
            ref={el => itemRefs.current[index] = el}
            className={cn(
              'nav-item',
              isActive ? 'active' : ''
            )}
          >
            <item.icon className="h-6 w-6" />
            <span className="nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
