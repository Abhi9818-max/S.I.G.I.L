
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShieldCheck, ListChecks, Settings, Timer, StickyNote } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFriends } from '@/components/providers/FriendProvider';
import { useAlliance } from '@/components/providers/AllianceProvider';
import { useTodos } from '@/components/providers/TodoProvider';
import { isToday, parseISO } from 'date-fns';

const navItems = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/alliances', label: 'Alliances', icon: ShieldCheck },
  { href: '/todo', label: 'Pacts', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const { incomingRequests } = useFriends();
  const { incomingAllianceInvitations, incomingAllianceChallenges } = useAlliance();
  const { todoItems } = useTodos();

  const hasFriendNotifications = incomingRequests.length > 0 || incomingAllianceInvitations.length > 0 || incomingAllianceChallenges.length > 0;
  
  const hasIncompletePactsToday = todoItems.some(
    item => !item.completed && isToday(parseISO(item.createdAt))
  );

  // Hide the nav bar on the login page
  if (pathname === '/login') {
    return null;
  }

  return (
    <nav 
        className="fixed bottom-0 left-0 w-full h-16 md:hidden bg-background/80 border-t border-border/50 flex justify-around items-center z-50 backdrop-blur-lg"
    >
      {navItems.map((item) => {
        const isActive = pathname.startsWith(item.href) && (item.href === '/' ? pathname === '/' : true);
        
        let showDot = false;
        if (item.href === '/friends') {
          showDot = hasFriendNotifications;
        } else if (item.href === '/todo') {
          showDot = hasIncompletePactsToday;
        }

        return (
          <Link
            href={item.href}
            key={item.href}
            className={cn(
              'relative flex flex-col items-center justify-center text-xs gap-1 transition-colors w-1/5 h-full',
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
            {showDot && (
              <span className="absolute top-2 right-1/2 translate-x-[14px] flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-background"></span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
