import {
  LayoutDashboard,
  Share2,
  BotMessageSquare,
  CalendarClock,
  Users,
  BarChart3,
  Settings,
  PenSquare,
} from 'lucide-react';

export type NavLink = {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const navLinks: NavLink[] = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    path: '/dashboard/accounts',
    label: 'Social Accounts',
    icon: Share2,
  },
  {
    path: '/dashboard/post-generator',
    label: 'AI Post Generator',
    icon: PenSquare,
  },
  {
    path: '/dashboard/scheduler',
    label: 'Scheduler',
    icon: CalendarClock,
  },
  {
    path: '/dashboard/competitors',
    label: 'Competitors',
    icon: Users,
  },
  {
    path: '/dashboard/automations',
    label: 'Automations',
    icon: BotMessageSquare,
  },
  {
    path: '/dashboard/reports',
    label: 'Reports',
    icon: BarChart3,
  },
];

export const settingsLink: NavLink = {
  path: '/dashboard/settings',
  label: 'Settings',
  icon: Settings,
};
