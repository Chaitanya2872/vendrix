// AnimatedCheck.tsx
/** A tick that draws itself in, used as the terminal state of upload and
 * save actions. The dash length (24) matches the path's own length, so the
 * check-draw keyframe retracts the offset from fully hidden to fully drawn.
 * Purely decorative — the surrounding control carries the accessible label. */
export function AnimatedCheck({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`${className} animate-pop-in`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12.5 9.5 18 20 6.5" strokeDasharray={24} className="animate-check-draw" />
    </svg>
  );
}
