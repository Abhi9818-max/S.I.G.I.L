
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, ShieldCheck, ListChecks, Settings, BarChart2, Gem } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/friends', label: 'Friends', icon: Users },
  { href: '/alliances', label: 'Alliances', icon: ShieldCheck },
  { href: '/reputation', label: 'Reputation', icon: Users },
  { href: '/market', label: 'Market', icon: Gem },
  { href: '/todo', label: 'Pacts', icon: ListChecks },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  // A more compact list for the bottom nav
  const mobileNavItems = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/friends', label: 'Friends', icon: Users },
    { href: '/reputation', label: 'Reputation', icon: Star },
    { href: '/todo', label: 'Pacts', icon: ListChecks },
    { href: '/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 md:hidden bg-background border-t border-border flex justify-around items-center z-50">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link href={item.href} key={item.href} className="flex-1 flex justify-center items-center h-full">
                <div
                    className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300',
                    isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                    )}
                >
                    <item.icon className="h-6 w-6" />
                </div>
            </Link>
          );
        })}
    </nav>
  );
}
