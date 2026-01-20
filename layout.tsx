'use client';

import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Home, Upload, BarChart3, Settings, LogOut, Bot } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth, useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { signOut, type User } from 'firebase/auth';
import { doc } from 'firebase/firestore';
import type { Faculty } from '@/lib/types';
import { useEffect } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/upload', label: 'Upload', icon: Upload },
  { href: '/dashboard/results', label: 'Results', icon: BarChart3 },
];

function UserProfile({ user }: { user: User }) {
  const firestore = useFirestore();
  const facultyRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'faculties', user.uid);
  }, [firestore, user]);
  const { data: faculty, isLoading } = useDoc<Faculty>(facultyRef);

  if (isLoading) {
    return (
        <div className="flex items-center gap-3 p-2">
            <Avatar className="h-9 w-9">
              <AvatarFallback>...</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
                <span className="truncate text-sm font-medium">Loading...</span>
                <span className="truncate text-xs text-muted-foreground">...</span>
            </div>
        </div>
    )
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    if (firstName && lastName) {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`;
    }
    if (firstName) {
        return firstName.charAt(0);
    }
    return 'FM';
  }

  return (
    <div className="flex items-center gap-3 p-2">
        <Avatar className="h-9 w-9">
            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`} data-ai-hint="person face" />
            <AvatarFallback>{getInitials(faculty?.firstName, faculty?.lastName)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-medium">{faculty?.firstName} {faculty?.lastName}</span>
            <span className="truncate text-xs text-muted-foreground">{user.email}</span>
        </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  if (isUserLoading || !user) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
             <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Bot className="h-8 w-8" />
                <span>Loading Dashboard...</span>
            </div>
        </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === item.href}
                  tooltip={item.label}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter>
          {user && <UserProfile user={user} />}
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <SidebarTrigger className="md:hidden" />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
                <LogOut className="h-5 w-5" />
            </Button>
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
