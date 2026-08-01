// SidebarItem.tsx
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
          "group relative flex items-center gap-3 rounded-xl px-3 py-2.5",
          "text-sm font-medium text-[#2d3d33] transition-all duration-200",
          "hover:bg-[#f0f5f0] hover:scale-[1.02]",
          isActive
            ? "bg-gradient-to-r from-[#e8f0e8] to-[#d5e4d5] shadow-[inset_0_1px_2px_rgba(255,255,255,0.8)]"
            : "hover:bg-[#f0f5f0]/60",
          isActive && "before:absolute before:left-0 before:top-1/2 before:h-6 before:w-1 before:-translate-y-1/2 before:rounded-r-full before:bg-gradient-to-b from-[#2a5f44] to-[#3d7a5a]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={[
              "h-5 w-5 shrink-0 transition-all duration-200",
              isActive
                ? "text-[#2a5f44]"
                : "text-[#7a8f82] group-hover:text-[#2a5f44]",
              isActive && "drop-shadow-[0_2px_4px_rgba(42,95,68,0.15)]",
            ].join(" ")}
            strokeWidth={isActive ? 2.2 : 1.8}
          />

          <span className="text-[#2d3d33]">{item.label}</span>

          {isActive && (
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#2a5f44] shadow-[0_0_8px_rgba(42,95,68,0.4)]" />
          )}
        </>
      )}
    </NavLink>
  );
}