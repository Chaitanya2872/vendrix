import {
  BarChart3,
  Building2,
  FileCheck2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavigationGroup {
  id: string;
  label: string;
  items: NavigationItem[];
}

export const navigationGroups: NavigationGroup[] = [
  {
    id: "workspace",
    label: "Workspace",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        path: "/",
        icon: LayoutDashboard,
        end: true,
      },
      {
        id: "vendors",
        label: "Vendors",
        path: "/vendors",
        icon: Building2,
      },
      {
        id: "contracts",
        label: "Contracts",
        path: "/contracts",
        icon: FileText,
      },
      {
        id: "documents",
        label: "Documents",
        path: "/documents",
        icon: FileCheck2,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "users",
        label: "Users",
        path: "/users",
        icon: Users,
      },
      {
        id: "compliance",
        label: "Compliance",
        path: "/compliance",
        icon: ShieldCheck,
        badge: 8,
      },
      {
        id: "reports",
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
      },
      {
        id: "settings",
        label: "Settings",
        path: "/settings",
        icon: Settings,
      },
    ],
  },
];

export const navigationItems: NavigationItem[] =
  navigationGroups.flatMap((group) => group.items);