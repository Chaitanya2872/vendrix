import { X } from "lucide-react";
import { navigationItems } from "@/constants/navigation.ts";
import { SidebarItem } from "./SidebarItem.tsx";
import React from "react";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-65 flex-col",
          "border-r border-brand-border bg-white text-black shadow-sm",
          "transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-brand-border px-5">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gold font-bold text-brand-forest">
              V
            </div>

            <div>
              <p className="m-0 text-base font-semibold leading-tight text-black">
                Venqor
              </p>

              <p className="m-0 text-xs text-brand-muted">
                Vendor Management
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="rounded-lg p-2 text-brand-muted hover:bg-brand-background hover:text-black lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
            Workspace
          </p>

          {navigationItems.map((item) => (
            <SidebarItem
              key={item.path}
              item={item}
              onClick={onClose}
            />
          ))}
        </nav>

        <div className="border-t border-brand-border p-4">
          <div className="rounded-xl bg-brand-background p-4 text-center">
            <p className="m-0 text-sm font-medium text-black">
              Need assistance?
            </p>

            <p className="mb-0 mt-1 text-xs leading-5 text-brand-muted">
              Contact your workspace administrator.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
