/** Shared date-range filtering for list screens.
 *
 * Every filterable list needs the same four presets and the same custom
 * range, and every one of them gets the timezone question wrong in the same
 * way if it reaches for `Date` arithmetic. Comparisons here are on
 * `yyyy-mm-dd` strings, which sort lexicographically — so a range check is a
 * string compare with no parsing and no timezone to get wrong.
 */

export type DateFilterValue = {
  /** A preset key, or "custom" when `from`/`to` carry the range. */
  preset: string;
  from: string;
  to: string;
};

export const DATE_PRESETS = [
  { value: "any",    label: "Any time"      },
  { value: "7d",     label: "Last 7 days"   },
  { value: "30d",    label: "Last 30 days"  },
  { value: "3m",     label: "Last 3 months" },
  { value: "1y",     label: "Last year"     },
  { value: "custom", label: "Custom range"  },
];

export const EMPTY_DATE_FILTER: DateFilterValue = { preset: "any", from: "", to: "" };

/** Local `yyyy-mm-dd`. `toISOString()` is UTC, which shifts the boundary by a
 * day for anyone east or west of Greenwich — and the dates being compared are
 * themselves written down in local time. */
export function isoDay(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

/** The inclusive window a filter selects. An open end is `undefined` rather
 * than a sentinel date, so "everything before March" stays expressible. */
export function dateWindow({ preset, from, to }: DateFilterValue): { from?: string; to?: string } {
  if (preset === "custom") return { from: from || undefined, to: to || undefined };
  if (preset === "any") return {};
  const cutoff = new Date();
  if (preset === "7d")  cutoff.setDate(cutoff.getDate() - 7);
  if (preset === "30d") cutoff.setDate(cutoff.getDate() - 30);
  if (preset === "3m")  cutoff.setMonth(cutoff.getMonth() - 3);
  if (preset === "1y")  cutoff.setFullYear(cutoff.getFullYear() - 1);
  return { from: isoDay(cutoff) };
}

/** Whether a filter is actually narrowing anything. "Custom range" with both
 * ends blank is selected but not yet constraining, and showing it as an
 * active filter would have the user hunting for a filter that removes no
 * rows. */
export function isDateFilterActive(value: DateFilterValue): boolean {
  return value.preset !== "any" && (value.preset !== "custom" || Boolean(value.from || value.to));
}

/** Does a date fall inside the window? Accepts anything starting with a
 * `yyyy-mm-dd` — a bare day or a full ISO timestamp — and treats a missing
 * date as outside any window, since a row with no date cannot be shown to
 * belong to a period. */
export function withinDateFilter(value: string | null | undefined, filter: DateFilterValue): boolean {
  if (!isDateFilterActive(filter)) return true;
  if (!value) return false;
  const day = value.slice(0, 10);
  const { from, to } = dateWindow(filter);
  if (from && day < from) return false;
  if (to && day > to) return false;
  return true;
}

export function formatDay(value: string): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" })
    .format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

/** Short human label for a filter, used on the active-filter chips. */
export function describeDateFilter(value: DateFilterValue): string {
  if (value.preset !== "custom") {
    return DATE_PRESETS.find(preset => preset.value === value.preset)?.label ?? "Any time";
  }
  if (!value.from && !value.to) return "Custom range";
  return `${value.from ? formatDay(value.from) : "Any"} – ${value.to ? formatDay(value.to) : "Today"}`;
}
