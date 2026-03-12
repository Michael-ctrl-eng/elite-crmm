"use client";
import React from "react";
import SidebarItem from "../ui/SideBarItems";
import { Home, Settings, Crown, Shield, Eye } from "lucide-react";
import { sidebarItems } from "@/libs/sideBarLinks";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/libs/rbac";

interface SideBarProps {
  onNavigate?: () => void;
}

export default function SideBar({ onNavigate }: SideBarProps) {
  const { data: session } = useSession();

  const userName = session?.user?.name || "User";
  const userEmail = session?.user?.email || "user@example.com";
  const userRole = session?.user?.role || "VIEWER";
  const tenantName = session?.user?.tenant?.name || "Workspace";

  const roleIcon = {
    ADMIN: <Crown className="w-3 h-3" />,
    MANAGER: <Shield className="w-3 h-3" />,
    VIEWER: <Eye className="w-3 h-3" />,
  };

  const roleColor = {
    ADMIN: "bg-purple-100 text-purple-700",
    MANAGER: "bg-blue-100 text-blue-700",
    VIEWER: "bg-gray-100 text-gray-700",
  };

  const userIsAdmin = isAdmin(userRole as any);

  // Filter sidebar items based on role
  const filterItems = (items: typeof sidebarItems) => {
    return items
      .map(item => {
        // Filter children if they exist
        if (item.children) {
          const filteredChildren = item.children.filter(child => {
            if (child.adminOnly) return userIsAdmin;
            return true;
          });

          if (filteredChildren.length === 0) return null;

          return { ...item, children: filteredChildren };
        }

        // Check if item itself is admin only
        if (item.adminOnly && !userIsAdmin) return null;

        return item;
      })
      .filter(Boolean);
  };

  const filteredItems = filterItems(sidebarItems);

  return (
    <div className="w-full h-full flex flex-col luxury-glass border-r border-white/20">
      {/* Top Logo & Tenant */}
      <div className="p-2 border-b border-white/20">
        <div className="flex w-full p-2 items-center gap-2 floating-luxury cursor-pointer">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <span className="text-white font-bold text-xl italic">E</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm font-bold text-gray-900 truncate tracking-tight">
              {tenantName}
            </h1>
            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold shadow-sm ${roleColor[userRole as keyof typeof roleColor]}`}>
              {roleIcon[userRole as keyof typeof roleIcon]}
              {userRole}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar links */}
      <div className="w-full flex-1 p-2 overflow-auto scrollbar-hide">
        <div className="space-y-1">
          {filteredItems.map((item) => {
            if (!item) return null;

            const lucideIconMap = {
              home: Home,
              settings: Settings,
            } as const;

            const IconComponent = item.lucideIcon
              ? lucideIconMap[item.lucideIcon]
              : null;

            const iconNode = IconComponent ? (
              <IconComponent size={16} />
            ) : item.icon ? (
              <img src={item.icon} alt={item.label} className="w-4 h-4" />
            ) : undefined;

            return (
              <SidebarItem
                key={item.label}
                icon={iconNode}
                label={item.label}
                route={item.route}
                onClick={onNavigate}
              >
                {item.children?.map((child) => (
                  <SidebarItem
                    key={child.label}
                    label={child.label}
                    route={child.route}
                    onClick={onNavigate}
                  />
                ))}
              </SidebarItem>
            );
          })}
        </div>
      </div>

      {/* Bottom profile card */}
      <div className="p-2 border-t border-white/20">
        <div className="w-full h-auto p-3 flex items-center space-x-3 luxury-glass rounded-2xl floating-luxury cursor-pointer shadow-sm">
          <div className="w-10 h-10 bg-black/5 rounded-full flex items-center justify-center border border-white/30 backdrop-blur-md flex-shrink-0">
            <span className="text-sm font-bold text-gray-800">
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-[10px] text-gray-500 truncate uppercase tracking-wider font-semibold">
              {userRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
