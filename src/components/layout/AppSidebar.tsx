import { useState } from 'react';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Settings, 
  FileText, 
  Activity,
  Smartphone,
  Webhook
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';

const mainItems = [
  { 
    title: 'Dashboard', 
    url: '/', 
    icon: LayoutDashboard,
    description: 'Overview and metrics'
  },
  { 
    title: 'Sessions', 
    url: '/sessions', 
    icon: Smartphone,
    description: 'WhatsApp sessions'
  },
  { 
    title: 'Messages', 
    url: '/messages', 
    icon: MessageSquare,
    description: 'Message history'
  },
  { 
    title: 'Webhooks', 
    url: '/webhooks', 
    icon: Webhook,
    description: 'Webhook configuration'
  },
];

const managementItems = [
  { 
    title: 'Users', 
    url: '/users', 
    icon: Users,
    description: 'User management',
    roles: ['admin']
  },
  { 
    title: 'Activity Logs', 
    url: '/logs', 
    icon: FileText,
    description: 'System logs'
  },
  { 
    title: 'System Status', 
    url: '/status', 
    icon: Activity,
    description: 'Health monitoring'
  },
  { 
    title: 'Settings', 
    url: '/settings', 
    icon: Settings,
    description: 'Application settings'
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    if (path === '/') {
      return currentPath === '/';
    }
    return currentPath.startsWith(path);
  };

  const getNavClasses = (path: string) => {
    const baseClasses = "w-full justify-start gap-3 h-12 px-3 rounded-lg transition-all duration-200";
    
    if (isActive(path)) {
      return `${baseClasses} bg-primary text-primary-foreground font-medium shadow-sm`;
    }
    
    return `${baseClasses} hover:bg-muted/50 text-muted-foreground hover:text-foreground`;
  };

  return (
    <Sidebar className="border-r transition-all duration-300">
      <SidebarHeader className="border-b px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-semibold text-sm">WhatsApp API</span>
              <span className="text-xs text-muted-foreground">Multi-Session</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses(item.url)}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Management
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {managementItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses(item.url)}
                      title={collapsed ? item.title : undefined}
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && (
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{item.title}</span>
                          <span className="text-xs opacity-70">{item.description}</span>
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}