// ExtractionProgress.tsx
import { FileSearch, ScanLine, Sparkles, Save, Loader2 } from "lucide-react";
import { EXTRACTION_STAGES, type ExtractionStage } from "@/api/documents";
import { AnimatedCheck } from "../ui/AnimatedCheck";

/** Labels for the stages the parser publishes. Kept in the same order as
 * EXTRACTION_STAGES so a stage's index doubles as its position in the list. */
const STAGE_LABELS: Record<ExtractionStage, { title: string; icon: typeof FileSearch }> = {
  reading:          { title: "Reading the document",  icon: FileSearch },
  extracting_text:  { title: "Running OCR",           icon: ScanLine },
  detecting_fields: { title: "Detecting fields",      icon: Sparkles },
  saving:           { title: "Saving results",        icon: Save },
};

type Props = {
  /** Current stage from the server; undefined before the first poll lands. */
  stage?: ExtractionStage;
  /** Whether this document needed OCR — only known once text extraction is
   * done, and it changes what the completed step should say. */
  usedOcr?: boolean | null;
};

export function ExtractionProgress({ stage, usedOcr }: Props) {
  const activeIndex = stage ? EXTRACTION_STAGES.indexOf(stage) : 0;

  return (
    <div>
      <p className="m-0 mb-3 flex items-center gap-2 text-sm font-medium text-brand-text">
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-gold-dark" />
        Extracting invoice details…
      </p>

      <ol className="m-0 list-none space-y-1.5 p-0">
        {EXTRACTION_STAGES.map((name, index) => {
          const { title, icon: Icon } = STAGE_LABELS[name];
          const done = index < activeIndex;
          const active = index === activeIndex;
          // "Running OCR" is skipped entirely for text-based PDFs; say so
          // rather than leaving a step that never lights up.
          const skipped = name === "extracting_text" && done && usedOcr === false;

          return (
            <li
              key={name}
              className={`animate-rise-in flex items-center gap-2.5 text-sm transition-colors duration-300 ${
                active ? "text-brand-text" : done ? "text-brand-muted" : "text-gray-300"
              }`}
              style={{ animationDelay: `${index * 60}ms` }}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg transition-all duration-300 ${
                  active
                    ? "bg-brand-gold-dark/10 text-brand-gold-dark"
                    : done
                      ? "bg-brand-forest/10 text-brand-forest"
                      : "bg-gray-100 text-gray-300"
                }`}
              >
                {done ? <AnimatedCheck className="h-3.5 w-3.5" /> : <Icon className={`h-3.5 w-3.5 ${active ? "animate-pulse" : ""}`} />}
              </span>
              <span className={active ? "font-medium" : undefined}>
                {skipped ? "Text layer read directly — no OCR needed" : title}
              </span>
              {active && (
                <span className="ml-auto h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                  <span className="progress-stripe animate-bar-stripe block h-full w-full bg-brand-gold-dark" />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Sweeping beam laid over the document preview while extraction runs, so
 * the file being worked on is visibly the subject of the work. Decorative
 * and pointer-transparent — the stage list carries the real information. */
export function ScanBeam() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <div className="animate-scan-sweep absolute inset-x-0 h-1/3 bg-gradient-to-b from-transparent via-brand-gold/25 to-transparent" />
    </div>
  );
}
