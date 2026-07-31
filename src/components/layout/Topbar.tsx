import React from "react";
import { Bell, ChevronDown, Menu, Search } from "lucide-react";
import { useLocation } from "react-router-dom";
import { navigationItems } from "@/constants/navigation.ts";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const location = useLocation();

  const currentItem = [...navigationItems]
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) =>
      item.path === "/"
        ? location.pathname === "/"
        : location.pathname.startsWith(item.path),
    );

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center gap-2 border-b border-brand-border bg-brand-surface px-4 md:gap-3 md:px-6">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-brand-forest hover:bg-brand-background lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="min-w-0 shrink md:max-w-[145px] lg:max-w-none">
        <h2 className="m-0 truncate text-base font-semibold text-brand-forest">
          {currentItem?.label ?? "Vendor Management"}
        </h2>

        <p className="m-0 hidden truncate text-xs text-brand-muted lg:block">
          Manage your vendor workspace
        </p>
      </div>

      <div className="ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-xl border border-brand-border bg-brand-background px-3 py-2 md:flex md:max-w-sm">
        <Search className="h-4 w-4 shrink-0 text-brand-muted" />

        <input
          type="search"
          aria-label="Search"
          placeholder="Search vendors, contracts..."
          className="w-full border-0 bg-transparent text-sm outline-none placeholder:text-brand-muted"
        />
      </div>

      <button
        type="button"
        aria-label="Notifications"
        className="relative rounded-xl border border-brand-border p-2.5 text-brand-forest hover:bg-brand-background"
      >
        <Bell className="h-5 w-5" />

        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-brand-gold-dark" />
      </button>

      <button
        type="button"
        className="flex items-center gap-2 rounded-xl p-1.5 hover:bg-brand-background"
      >
        <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-forest text-sm font-semibold text-white">
          CK
        </div>

        <div className="hidden text-left xl:block">
          <p className="m-0 text-sm font-medium">Chaitanya K</p>
          <p className="m-0 text-xs text-brand-muted">Administrator</p>
        </div>

        <ChevronDown className="hidden h-4 w-4 text-brand-muted xl:block" />
      </button>
    </header>
  );
}
