'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Logo } from '@/components/icons/logo';
import { navLinks, settingsLink } from '@/lib/nav-links';
import { PenSquare, LogOut, User, DollarSign } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
            <Logo className="text-primary size-7" />
            <span className="font-headline text-sidebar-foreground transition-all group-data-[collapsible=icon]:-translate-x-20 group-data-[collapsible=icon]:opacity-0">
              ViralinkAI
            </span>
          </Link>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <SidebarMenu>
            {navLinks.map((link) => (
              <SidebarMenuItem key={link.path}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === link.path}
                  tooltip={{
                    children: link.label,
                    className: 'bg-sidebar-background text-sidebar-foreground border-sidebar-border',
                  }}
                >
                  <Link href={link.path}>
                    <link.icon className="shrink-0" />
                    <span>{link.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname === settingsLink.path}
                tooltip={{
                    children: settingsLink.label,
                    className: 'bg-sidebar-background text-sidebar-foreground border-sidebar-border',
                  }}
                >
                <Link href={settingsLink.path}>
                  <settingsLink.icon />
                  <span>{settingsLink.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-lg font-semibold md:text-xl font-headline">
              {navLinks.find((l) => pathname.startsWith(l.path))?.label ??
               (pathname.startsWith(settingsLink.path) ? settingsLink.label : 'Dashboard')}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild>
                <Link href="/dashboard/post-generator">
                    <PenSquare className="mr-2" />
                    New Post
                </Link>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://picsum.photos/seed/avatar/100/100" alt="@shadcn" />
                    <AvatarFallback>MR</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Max Robinson</p>
                    <p className="text-xs leading-none text-muted-foreground">m@example.com</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                    <DollarSign className="mr-2" />
                    <span>Billing</span>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <settingsLink.icon className="mr-2" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut className="mr-2" />
                    <span>Log out</span>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
