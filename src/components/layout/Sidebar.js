import { X } from "lucide-react";
import { navigationItems } from "@/constants/navigation";
import { SidebarItem } from "./SidebarItem";
import React from "react";
export function Sidebar({ open, onClose }) {
    return (React.createElement(React.Fragment, null,
        open && (React.createElement("button", { type: "button", "aria-label": "Close sidebar overlay", onClick: onClose, className: "fixed inset-0 z-40 bg-black/40 lg:hidden" })),
        React.createElement("aside", { className: [
                "fixed inset-y-0 left-0 z-50 flex w-65 flex-col",
                "border-r border-brand-border bg-white text-black shadow-sm",
                "transition-transform duration-300",
                "lg:translate-x-0",
                open ? "translate-x-0" : "-translate-x-full",
            ].join(" ") },
            React.createElement("div", { className: "flex h-16 items-center justify-between border-b border-brand-border px-5" },
                React.createElement("div", { className: "flex items-center gap-3" },
                    React.createElement("div", { className: "grid h-9 w-9 place-items-center rounded-xl bg-brand-gold font-bold text-brand-forest" }, "V"),
                    React.createElement("div", null,
                        React.createElement("p", { className: "m-0 text-base font-semibold leading-tight text-black" }, "Venqor"),
                        React.createElement("p", { className: "m-0 text-xs text-brand-muted" }, "Vendor Management"))),
                React.createElement("button", { type: "button", "aria-label": "Close sidebar", onClick: onClose, className: "rounded-lg p-2 text-brand-muted hover:bg-brand-background hover:text-black lg:hidden" },
                    React.createElement(X, { className: "h-5 w-5" }))),
            React.createElement("nav", { className: "flex-1 space-y-1 overflow-y-auto px-3 py-5" },
                React.createElement("p", { className: "mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-brand-muted" }, "Workspace"),
                navigationItems.map((item) => (React.createElement(SidebarItem, { key: item.path, item: item, onClick: onClose })))),
            React.createElement("div", { className: "border-t border-brand-border p-4" },
                React.createElement("div", { className: "rounded-xl bg-brand-background p-4 text-center" },
                    React.createElement("p", { className: "m-0 text-sm font-medium text-black" }, "Need assistance?"),
                    React.createElement("p", { className: "mb-0 mt-1 text-xs leading-5 text-brand-muted" }, "Contact your workspace administrator."))))));
}
