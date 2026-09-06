"use client";
import ToggleSwitch from "./ToggleSwitch";
import { SearchIcon } from "./icons";

export default function ControlsBar({
  fieldFilter,
  onFieldFilterChange,
  highlightDiff,
  onHighlightDiffChange,
  onlyDiff,
  onOnlyDiffChange,
}: {
  fieldFilter: string;
  onFieldFilterChange: (v: string) => void;
  highlightDiff: boolean;
  onHighlightDiffChange: (v: boolean) => void;
  onlyDiff: boolean;
  onOnlyDiffChange: (v: boolean) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 py-3">
      <div className="relative flex-1 min-w-0">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={fieldFilter}
          onChange={(e) => onFieldFilterChange(e.target.value)}
          placeholder="Filter specs (e.g. battery, RAM)..."
          className="w-full text-sm bg-card border-2 border-border-heavy rounded-none pl-9 pr-3 py-2 outline-none focus:ring-2 focus:ring-accent placeholder:text-muted-foreground"
        />
      </div>

      <div className="flex gap-4 sm:gap-6 shrink-0">
        <ToggleSwitch checked={highlightDiff} onChange={onHighlightDiffChange} label="Highlight" />
        <ToggleSwitch checked={onlyDiff} onChange={onOnlyDiffChange} label="Diffs only" />
      </div>
    </div>
  );
}