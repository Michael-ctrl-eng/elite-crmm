export interface SidebarLink {
  label: string;
  icon?: string;
  route?: string;
  children?: SidebarLink[];
  lucideIcon?: "home" | "settings";
  prefetch?: boolean;
  adminOnly?: boolean;
}

export const sidebarItems: SidebarLink[] = [
  {
    label: "Dashboard",
    lucideIcon: "home",
    route: "/",
    prefetch: true
  },
  {
    label: "Deals",
    icon: "/sideBarIcons/handshake.svg",
    route: "/deals",
    prefetch: true
  },
  {
    label: "To-Do",
    icon: "/sideBarIcons/layout-list.svg",
    route: "/todo",
    prefetch: true
  },
  { 
    label: "Meetings", 
    icon: "/sideBarIcons/presentation.svg", 
    route: "/meetings",
    prefetch: true
  },
  { 
    label: "Prospects", 
    icon: "/sideBarIcons/trending-up.svg",
    route: "/prospects",
    prefetch: true
  },
  {
    label: "Contact",
    icon: "/sideBarIcons/mail.svg",
    children: [
      {
        label: "Customers",
        route: "/contact/customers",
        prefetch: true
      },
      { 
        label: "Companies", 
        route: "/contact/companies",
        prefetch: true
      },
    ],
  },
  {
    label: "Tools & Analytics",
    icon: "/sideBarIcons/bar-chart.svg",
    children: [
      {
        label: "Reports",
        route: "/tools/reports"
      },
      {
        label: "Automation",
        route: "/tools/automation"
      },
    ],
  },
  {
    label: "Settings",
    lucideIcon: "settings",
    children: [
      {
        label: "Workspace",
        route: "/settings/workspace",
        prefetch: true
      },
      {
        label: "Users",
        route: "/settings/users",
        prefetch: true,
        adminOnly: true
      },
      {
        label: "Email",
        route: "/settings/email",
        prefetch: true
      },
    ],
  },
];
