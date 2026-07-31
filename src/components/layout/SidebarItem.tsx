import { NavLink } from "react-router-dom";
import type { NavigationItem } from "@/constants/navigation.ts";
import React from "react";

interface SidebarItemProps {
  item: NavigationItem;
  onClick?: () => void;
}

export function SidebarItem({ item, onClick }: SidebarItemProps) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.path}
      end={item.end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "group flex items-center gap-3 rounded-xl px-3 py-2.5",
          "text-sm font-medium text-black transition-colors",
          isActive
            ? "bg-brand-background"
            : "hover:bg-brand-background/60",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              "h-5 w-5 shrink-0 transition-colors",
              isActive
                ? "text-brand-gold"
                : "text-brand-forest/60 group-hover:text-brand-forest",
            ].join(" ")}
            strokeWidth={isActive ? 2.2 : 1.8}
          />

          <span className="text-black">{item.label}</span>
        </>
      )}
    </NavLink>
  );
}
