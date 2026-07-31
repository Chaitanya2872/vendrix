import {
  Building2,
  FileText,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  end?: boolean;
}

export const navigationItems: NavigationItem[] = [
  {
    label: "Dashboard",
    path: "/",
    icon: LayoutDashboard,
    end: true,
  },
  {
    label: "Vendors",
    path: "/vendors",
    icon: Building2,
  },
  {
    label: "Contracts",
    path: "/contracts",
    icon: FileText,
  },
  {
    label: "Documents",
    path: "/documents",
    icon: ShieldCheck,
  },
  {
    label: "Users",
    path: "/users",
    icon: Users,
  },
  {
    label: "Settings",
    path: "/settings",
    icon: Settings,
  },
];