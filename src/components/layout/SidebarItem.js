import { NavLink } from "react-router-dom";
import React from "react";
export function SidebarItem({ item, onClick }) {
    const Icon = item.icon;
    return (React.createElement(NavLink, { to: item.path, end: item.end, onClick: onClick, className: ({ isActive }) => [
            "group flex items-center gap-3 rounded-xl px-3 py-2.5",
            "text-sm font-medium text-black transition-colors",
            isActive
                ? "bg-brand-background"
                : "hover:bg-brand-background/60",
        ].join(" ") }, ({ isActive }) => (React.createElement(React.Fragment, null,
        React.createElement(Icon, { className: [
                "h-5 w-5 shrink-0 transition-colors",
                isActive
                    ? "text-brand-gold"
                    : "text-brand-forest/60 group-hover:text-brand-forest",
            ].join(" "), strokeWidth: isActive ? 2.2 : 1.8 }),
        React.createElement("span", { className: "text-black" }, item.label)))));
}
