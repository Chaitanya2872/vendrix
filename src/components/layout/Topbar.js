import React from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { navigationItems } from "@/constants/navigation";
export function Topbar({ onMenuClick }) {
    const location = useLocation();
    const currentItem = [...navigationItems]
        .sort((a, b) => b.path.length - a.path.length)
        .find((item) => item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path));
    return (React.createElement("header", { className: "sticky top-0 z-30 flex h-16 w-full items-center gap-4 border-b border-brand-border bg-brand-surface px-4 md:px-6" },
        React.createElement("button", { type: "button", "aria-label": "Open sidebar", onClick: onMenuClick, className: "rounded-lg p-2 text-brand-forest hover:bg-brand-background lg:hidden" },
            React.createElement(Menu, { className: "h-5 w-5" })),
        React.createElement("div", { className: "min-w-0" },
            React.createElement("h2", { className: "m-0 truncate text-base font-semibold text-brand-forest" }, currentItem?.label ?? "Vendor Management"),
            React.createElement("p", { className: "m-0 hidden text-xs text-brand-muted sm:block" }, "Manage your vendor workspace")),
        React.createElement("div", { className: "ml-auto hidden w-full max-w-sm items-center gap-2 rounded-xl border border-brand-border bg-brand-background px-3 py-2 md:flex" },
            React.createElement(Search, { className: "h-4 w-4 shrink-0 text-brand-muted" }),
            React.createElement("input", { type: "search", "aria-label": "Search", placeholder: "Search vendors, contracts...", className: "w-full border-0 bg-transparent text-sm outline-none placeholder:text-brand-muted" })),
        React.createElement("button", { type: "button", "aria-label": "Notifications", className: "relative rounded-xl border border-brand-border p-2.5 text-brand-forest hover:bg-brand-background" },
            React.createElement(Bell, { className: "h-5 w-5" }),
            React.createElement("span", { className: "absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-gold-dark" })),
        React.createElement("button", { type: "button", className: "flex items-center gap-2 rounded-xl p-1.5 hover:bg-brand-background" },
            React.createElement("div", { className: "grid h-9 w-9 place-items-center rounded-full bg-brand-forest text-sm font-semibold text-white" }, "CK"),
            React.createElement("div", { className: "hidden text-left md:block" },
                React.createElement("p", { className: "m-0 text-sm font-medium" }, "Chaitanya K"),
                React.createElement("p", { className: "m-0 text-xs text-brand-muted" }, "Administrator")),
            React.createElement(ChevronDown, { className: "hidden h-4 w-4 text-brand-muted md:block" }))));
}
