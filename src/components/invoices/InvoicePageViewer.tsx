import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Loader2, ZoomIn, ZoomOut } from "lucide-react";
import { fetchPageImage, type EvidenceBox } from "@/api/invoiceExtraction";

/**
 * The document, with the extractor's evidence drawn on it.
 *
 * This is the component that makes review fast rather than tedious. Without
 * it a reviewer checking a total has to find that number on the page
 * themselves, for every field, on every invoice. With it, selecting a field
 * points straight at the pixels the value came from.
 *
 * The coordinate handling is the whole job. Evidence boxes are in extraction
 * pixel space (300 DPI by default); the page is rendered at a lower DPI for
 * display and then scaled again by CSS to fit the panel. Both conversions
 * have to be applied or the highlight lands somewhere near the right text,
 * which is worse than no highlight — it tells the reviewer to check the
 * wrong number.
 */

export type Highlight = {
  field: string;
  pageNumber: number;
  box: EvidenceBox;
  /** Drawn differently: the selected field is what the reviewer is looking
   * at, the rest are context. */
  active: boolean;
};

type Props = {
  documentId: string;
  pageCount: number;
  highlights: Highlight[];
  activePage?: number;
  onPageChange?: (page: number) => void;
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

export function InvoicePageViewer({
  documentId,
  pageCount,
  highlights,
  activePage,
  onPageChange,
}: Props) {
  const [page, setPage] = useState(activePage ?? 1);
  // The render is tagged with the page it belongs to, so "are we still
  // loading" is answerable by comparison rather than by a second piece of
  // state that has to be kept in step with it.
  const [render, setRender] = useState<{ page: number; url: string; scale: number } | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [error, setError] = useState<{ page: number; message: string } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Follow the selected field onto its own page. Adjusted during render
  // rather than in an effect: this is derived state, and syncing it from an
  // effect means one render showing the wrong page before the correction.
  const [lastActivePage, setLastActivePage] = useState(activePage);
  if (activePage !== lastActivePage) {
    setLastActivePage(activePage);
    if (activePage && activePage !== page) setPage(activePage);
  }

  const image = render && render.page === page ? render : null;
  const pageError = error && error.page === page ? error.message : null;
  const loading = !image && !pageError;

  useEffect(() => {
    let revoked = false;
    let objectUrl: string | null = null;

    fetchPageImage(documentId, page)
      .then(result => {
        if (revoked) {
          URL.revokeObjectURL(result.objectUrl);
          return;
        }
        objectUrl = result.objectUrl;
        setRender({ page, url: result.objectUrl, scale: result.scale });
      })
      .catch(() => {
        if (!revoked) setError({ page, message: "This page could not be rendered." });
      });

    return () => {
      revoked = true;
      // The blob is ours; leaking one per page view would grow unboundedly
      // as a reviewer pages through a long document.
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, page]);

  // Scroll the active highlight into view when the reviewer selects a field
  // that is off-screen — otherwise the pointer is correct and invisible.
  useEffect(() => {
    const active = highlights.find(item => item.active && item.pageNumber === page);
    if (!active || !image || !containerRef.current) return;
    const top = active.box.y * image.scale * zoom;
    containerRef.current.scrollTo({
      top: Math.max(0, top - containerRef.current.clientHeight / 3),
      behavior: "smooth",
    });
  }, [highlights, image, page, zoom]);

  const goTo = (next: number) => {
    const bounded = Math.min(Math.max(next, 1), Math.max(pageCount, 1));
    setPage(bounded);
    onPageChange?.(bounded);
  };

  const visible = highlights.filter(item => item.pageNumber === page && item.box);

  return (
    <div className="flex h-full flex-col rounded-lg border border-gray-200 bg-gray-50">
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[5.5rem] text-center text-sm text-gray-600">
            Page {page} of {Math.max(pageCount, 1)}
          </span>
          <button
            type="button"
            onClick={() => goTo(page + 1)}
            disabled={page >= pageCount}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setZoom(value => Math.max(MIN_ZOOM, value - ZOOM_STEP))}
            disabled={zoom <= MIN_ZOOM}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center text-xs tabular-nums text-gray-500">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom(value => Math.min(MAX_ZOOM, value + ZOOM_STEP))}
            disabled={zoom >= MAX_ZOOM}
            className="rounded p-1.5 text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div ref={containerRef} className="relative flex-1 overflow-auto p-4">
        {loading && (
          <div className="flex h-64 items-center justify-center text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {pageError && (
          <div className="flex h-64 items-center justify-center px-6 text-center text-sm text-gray-500">
            {pageError}
          </div>
        )}

        {image && !pageError && (
          <div className="relative mx-auto w-fit shadow-sm">
            <img
              src={image.url}
              alt={`Page ${page}`}
              className="block max-w-none"
              style={{ width: naturalSize ? naturalSize.width * zoom : undefined }}
              onLoad={event => {
                const element = event.currentTarget;
                setNaturalSize({ width: element.naturalWidth, height: element.naturalHeight });
              }}
            />

            {/* Boxes are positioned in the *rendered* image's pixel space,
                so each one is scaled twice: once from extraction DPI to
                render DPI (image.scale), once for the zoom the reviewer
                chose. Applying only one puts the highlight near the right
                text, which is worse than none — it points at the wrong
                number with equal confidence. */}
            {visible.map(item => {
              const factor = image.scale * zoom;
              return (
                <div
                  key={`${item.field}-${item.box.x}-${item.box.y}`}
                  className={
                    item.active
                      ? "pointer-events-none absolute rounded-sm border-2 border-sky-500 bg-sky-400/20 ring-2 ring-sky-200 transition-all"
                      : "pointer-events-none absolute rounded-sm border border-amber-300/70 bg-amber-200/10 transition-all"
                  }
                  style={{
                    left: item.box.x * factor,
                    top: item.box.y * factor,
                    width: item.box.width * factor,
                    height: item.box.height * factor,
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
