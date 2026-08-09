import { getSpecIcon, getGroupIcon, getSpecAccent } from "@/components/feeds/specIcons";
import { SpecGroup } from "@/lib/gadgets/types";
import { formatSpecValue, splitMultiline, slugifyTitle } from "@/lib/gadgets/formatSpecValue";

interface ProductSpecTableProps {
  group: SpecGroup;
  specs: Record<string, unknown>;
}

export default function ProductSpecTable({ group, specs }: ProductSpecTableProps) {
  const hasAnyValue = group.fields.some(
    (f) => specs[f.key] !== null && specs[f.key] !== undefined && specs[f.key] !== ""
  );
  if (!hasAnyValue) return null;

  const GroupIcon = getGroupIcon(group.title);

  return (
    <section
      id={slugifyTitle(group.title)}
      className="reveal-up scroll-mt-24 flex border-2 border-border-heavy bg-card rounded-none shadow-brutal overflow-hidden"
    >
      <div className="flex flex-col items-center justify-center gap-2 w-20 sm:w-24 shrink-0 bg-accent-2 border-r-4 border-border-heavy px-2 py-6">
        <GroupIcon className="w-10 h-10 sm:w-12 sm:h-12 text-on-accent-2" strokeWidth={2} />
      </div>

      <div className="flex-1 min-w-0 p-4 sm:p-5">
        <h2 className="text-base sm:text-lg font-extrabold uppercase tracking-wide text-foreground pb-3 mb-3 border-b-2 border-border">
          {group.title}
        </h2>

        <dl className="divide-y-2 divide-border">
          {group.fields.map((field) => {
            const raw = specs[field.key];
            const isEmpty = raw === null || raw === undefined || raw === "";
            const FieldIcon = getSpecIcon(field.label);
            const accent = getSpecAccent(field.label);

            return (
              <div
                key={field.key}
                className="grid grid-cols-[minmax(0,1fr)] sm:grid-cols-[9rem_1fr] gap-x-4 gap-y-1 py-2.5 first:pt-0 last:pb-0"
              >
                <dt className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-wide text-muted-foreground pt-0.5">
                  <span className={`flex items-center justify-center w-6 h-6 shrink-0 border-2 border-border-heavy bg-background ${accent.icon}`}>
                    <FieldIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                  </span>
                  {field.label}
                </dt>
                <dd className="text-sm font-bold text-foreground">
                  {isEmpty ? (
                    <span className="text-muted-foreground font-medium">—</span>
                  ) : field.type === "multiline" ? (
                    <ul className="space-y-1">
                      {splitMultiline(raw).map((line, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className={`w-1.5 h-1.5 mt-1.5 shrink-0 ${accent.bar}`} />
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    formatSpecValue(field, raw)
                  )}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </section>
  );
}