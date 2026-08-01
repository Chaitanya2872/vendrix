// Sidebar.tsx
import { X } from "lucide-react";
import { navigationGroups } from "@/constants/navigation.ts";
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
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] lg:hidden"
        />
      )}

      <aside
        className={[
          "fixed inset-y-0 left-0 z-50 flex w-65 flex-col",
          "border-r border-[#e8ede8] bg-white/90 backdrop-blur-xl shadow-[4px_0_24px_rgba(31,45,36,0.06)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-16 items-center justify-between border-b border-[#e8ede8] px-5">
          <div className="flex items-center gap-3">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-[#2a5f44] to-[#1d4030] font-bold text-white shadow-[0_4px_12px_rgba(42,95,68,0.3)]">
              V
              <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-white/10 to-transparent" />
            </div>

            <div>
              <p className="m-0 text-base font-semibold leading-tight bg-gradient-to-r from-[#1d4030] to-[#2a5f44] bg-clip-text text-transparent">
                Venqor
              </p>
              <p className="m-0 text-xs text-[#7a8f82]">
                Vendor Management
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="rounded-lg p-2 text-[#7a8f82] transition-all hover:bg-[#f0f4f0] hover:text-[#1d4030] hover:scale-95 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-5 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d5dfd5]">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#7a8f82]">
            Workspace
          </p>

          {navigationGroups.map((group) => (
  <div key={group.id} className="mb-5">
    <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-widest text-brand-muted">
      {group.label}
    </p>

    <div className="space-y-1">
      {group.items.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          onClick={onClose}
        />
      ))}
    </div>
  </div>
))}
        </nav>

        <div className="border-t border-[#e8ede8] p-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#f0f5f0] to-[#e6ede6] p-4 text-center">
            <div className="absolute -right-6 -top-6 h-16 w-16 rounded-full bg-[#2a5f44]/5" />
            <div className="absolute -bottom-6 -left-6 h-12 w-12 rounded-full bg-[#2a5f44]/5" />
            <p className="relative m-0 text-sm font-medium text-[#1d4030]">
              Need assistance?
            </p>
            <p className="relative mb-0 mt-1 text-xs leading-5 text-[#7a8f82]">
              Contact your workspace administrator.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}