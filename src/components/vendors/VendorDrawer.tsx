import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

export function VendorDrawer({ open, title, subtitle, width = "max-w-xl", onClose, children }: {
  open: boolean; title: string; subtitle?: string; width?: string; onClose: () => void; children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", close);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", close); };
  }, [open, onClose]);

  return <div className={`fixed inset-0 z-100 ${open ? "pointer-events-auto" : "pointer-events-none"}`} aria-hidden={!open}>
    <button aria-label="Close drawer" onClick={onClose} className={`absolute inset-0 bg-slate-950/30 backdrop-blur-[1px] transition-opacity ${open ? "opacity-100" : "opacity-0"}`} />
    <aside role="dialog" aria-modal="true" className={`absolute inset-y-0 right-0 flex w-full ${width} flex-col bg-brand-background shadow-2xl transition-transform duration-300 ease-out ${open ? "translate-x-0" : "translate-x-full"}`}>
      <header className="flex h-18 shrink-0 items-center justify-between border-b border-brand-border bg-white px-5">
        <div className="min-w-0"><h2 className="m-0 truncate text-lg font-semibold text-brand-forest">{title}</h2>{subtitle && <p className="mb-0 mt-0.5 truncate text-xs text-brand-muted">{subtitle}</p>}</div>
        <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-lg text-brand-muted hover:bg-brand-background hover:text-brand-text"><X className="h-5 w-5" /></button>
      </header>
      <div className="flex-1 overflow-y-auto p-5">{children}</div>
    </aside>
  </div>;
}
