import {
  BarChart3,
  Building2,
  CarFront,
  FileCheck2,
  LayoutDashboard,
  ReceiptText,
  ShoppingCart,
  Truck,
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
        path: "/dashboard",
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
        id: "vehicles",
        label: "Vehicles",
        path: "/vehicles",
        icon: CarFront,
      },
      {
        id: "documents",
        label: "Documents & OCR",
        path: "/documents",
        icon: FileCheck2,
      },
      {
        id: "purchases",
        label: "Purchases",
        path: "/purchases",
        icon: ShoppingCart,
      },
      {
        id: "deliveries",
        label: "Deliveries",
        path: "/deliveries",
        icon: Truck,
      },
    ],
  },
  {
    id: "management",
    label: "Management",
    items: [
      {
        id: "users",
        label: "User management",
        path: "/users",
        icon: Users,
      },
      {
        id: "invoices",
        label: "Invoices & Billing",
        path: "/invoices",
        icon: ReceiptText,
      },
      {
        id: "reports",
        label: "Reports",
        path: "/reports",
        icon: BarChart3,
      },
    ],
  },
];

export const navigationItems: NavigationItem[] =
  navigationGroups.flatMap((group) => group.items);
