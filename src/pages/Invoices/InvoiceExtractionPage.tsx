import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle, CheckCircle2, Clock, FileText, Loader2, Upload, X,
} from "lucide-react";
import { toast } from "sonner";
import {
  isTerminal, uploadInvoice, type UploadAccepted,
} from "@/api/invoiceExtraction";
import { useExtractionStatus } from "@/hooks/useExtractionStatus";

/**
 * Upload invoices and watch them process.
 *
 * The queue is deliberately in-session rather than a server-backed list of
 * every invoice ever uploaded: this screen answers "what did I just upload
 * and is it done", which is a different question from "show me our invoices"
 * — that one is the existing invoices list.
 */

const ACCEPTED = ".pdf,.jpg,.jpeg,.png,.tif,.tiff,.webp";
const ACCEPTED_LABEL = "PDF, JPG, PNG, TIFF or WEBP";
// Matches settings.max_upload_size_mb on the server. Checked here too so an
// oversized file fails instantly instead of after a slow upload that the
// server was always going to reject.
const MAX_SIZE_MB = 25;

type QueueEntry = {
  key: string;
  filename: string;
  documentId: string | null;
  uploadPercent: number;
  error: string | null;
  duplicateOf: string | null;
};

export function InvoiceExtractionPage() {
  const navigate = useNavigate();
  const [queue, setQueue] = useState<QueueEntry[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const update = useCallback((key: string, patch: Partial<QueueEntry>) => {
    setQueue(current => current.map(entry => (entry.key === key ? { ...entry, ...patch } : entry)));
  }, []);

  const startUpload = useCallback(
    async (file: File) => {
      const key = `${file.name}-${file.size}-${Date.now()}-${Math.random()}`;

      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setQueue(current => [
          {
            key, filename: file.name, documentId: null, uploadPercent: 0,
            error: `This file is ${(file.size / 1024 / 1024).toFixed(1)} MB; the limit is ${MAX_SIZE_MB} MB.`,
            duplicateOf: null,
          },
          ...current,
        ]);
        return;
      }

      setQueue(current => [
        { key, filename: file.name, documentId: null, uploadPercent: 0, error: null, duplicateOf: null },
        ...current,
      ]);

      try {
        const accepted: UploadAccepted = await uploadInvoice(file, {
          onProgress: percent => update(key, { uploadPercent: percent }),
        });
        update(key, {
          documentId: accepted.document_id,
          uploadPercent: 100,
          duplicateOf: accepted.duplicate_of,
        });
        if (accepted.duplicate_of) {
          toast.info(`${file.name} was already uploaded as ${accepted.duplicate_of}`);
        }
      } catch (error) {
        // The server distinguishes "wrong kind of file" from "too big" from
        // "broken file"; showing its message rather than a generic failure is
        // the difference between a user who can fix it and one who cannot.
        const detail = (error as { response?: { data?: { detail?: { message?: string } } } })
          ?.response?.data?.detail;
        update(key, { error: detail?.message ?? "Upload failed." });
      }
    },
    [update],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      Array.from(files).forEach(file => void startUpload(file));
    },
    [startUpload],
  );

  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Extract invoices</h1>
        <p className="mt-1 text-sm text-gray-500">
          Upload invoices from any supplier. Nothing leaves this server.
        </p>
      </header>

      <div
        onDragOver={event => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={event => {
          event.preventDefault();
          setDragging(false);
          handleFiles(event.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
          dragging ? "border-sky-400 bg-sky-50" : "border-gray-200 bg-white hover:border-gray-300"
        }`}
      >
        <Upload className={`mx-auto h-8 w-8 ${dragging ? "text-sky-500" : "text-gray-300"}`} />
        <p className="mt-3 text-sm font-medium text-gray-700">
          Drop invoices here, or click to choose
        </p>
        <p className="mt-1 text-xs text-gray-400">
          {ACCEPTED_LABEL} · up to {MAX_SIZE_MB} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={event => {
            handleFiles(event.target.files);
            // Cleared so re-selecting the same file fires change again.
            event.target.value = "";
          }}
        />
      </div>

      {queue.length > 0 && (
        <section className="mt-6 space-y-2">
          {queue.map(entry => (
            <QueueRow
              key={entry.key}
              entry={entry}
              onOpen={() => entry.documentId && navigate(`/invoices/review/${entry.documentId}`)}
              onDismiss={() => setQueue(current => current.filter(item => item.key !== entry.key))}
            />
          ))}
        </section>
      )}
    </div>
  );
}

function QueueRow({
  entry,
  onOpen,
  onDismiss,
}: {
  entry: QueueEntry;
  onOpen: () => void;
  onDismiss: () => void;
}) {
  // Polling only begins once the document exists and only runs while it is
  // still working — a finished row must not keep a timer alive for the rest
  // of the session.
  const { status } = useExtractionStatus(entry.documentId, {
    enabled: Boolean(entry.documentId) && !entry.error,
  });

  const uploading = !entry.documentId && !entry.error;
  const done = status ? isTerminal(status.status) : false;
  const failed = Boolean(entry.error) || status?.status === "FAILED";

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border bg-white px-4 py-3 ${
        failed ? "border-red-200" : "border-gray-200"
      } ${done && !failed ? "cursor-pointer hover:bg-gray-50" : ""}`}
      onClick={() => done && !failed && onOpen()}
    >
      <div className="shrink-0">
        {failed ? (
          <AlertCircle className="h-4 w-4 text-red-500" />
        ) : done ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        ) : uploading ? (
          <Upload className="h-4 w-4 text-gray-400" />
        ) : (
          <Loader2 className="h-4 w-4 animate-spin text-sky-500" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p className="truncate text-sm font-medium text-gray-900">{entry.filename}</p>
          <span className="shrink-0 text-xs tabular-nums text-gray-400">
            {failed ? "" : uploading ? `${entry.uploadPercent}%` : `${status?.progress ?? 0}%`}
          </span>
        </div>

        <p className="mt-0.5 truncate text-xs text-gray-500">
          {entry.error
            ? entry.error
            : status?.status === "FAILED"
              ? status.error?.message ?? "Processing failed."
              : entry.duplicateOf
                ? `Already uploaded as ${entry.duplicateOf}`
                : uploading
                  ? "Uploading…"
                  : done
                    ? status?.status === "REVIEW_REQUIRED"
                      ? "Needs review"
                      : "Ready"
                    : status?.stage_label ?? "Queued"}
        </p>

        {!failed && !done && (
          <div className="mt-2 h-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-sky-500 transition-[width] duration-500"
              style={{ width: `${uploading ? entry.uploadPercent : status?.progress ?? 0}%` }}
            />
          </div>
        )}
      </div>

      {done && !failed && (
        <span className="shrink-0 text-xs font-medium text-sky-600">Review</span>
      )}

      <button
        type="button"
        onClick={event => {
          event.stopPropagation();
          onDismiss();
        }}
        className="shrink-0 rounded p-1 text-gray-300 hover:bg-gray-100 hover:text-gray-500"
        aria-label={`Dismiss ${entry.filename}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function EmptyQueueHint() {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-400">
      <FileText className="h-3.5 w-3.5" />
      <Clock className="h-3.5 w-3.5" />
      Scanned invoices take about two minutes per page.
    </div>
  );
}
