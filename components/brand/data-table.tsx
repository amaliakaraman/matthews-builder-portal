import { cn } from "@/lib/utils";

/**
 * DataTable — strict implementation of PRD §7.2.6 table spec:
 *   - Title:    Satoshi Bold 12pt / 16pt leading, Deep Blue
 *   - Source:   Satoshi Italic 10pt, 60% black
 *   - Headers:  Satoshi Regular 10pt / 12pt leading, Deep Blue
 *   - Data:     Satoshi Regular 9pt, 100% black
 *   - Numbered: Satoshi Regular 9pt, right-aligned
 *   - Left col: left-aligned. All other cols: center-aligned.
 *   - Header row variants: Electric Blue (white) or Deep Blue (white). Default: no fill.
 */

export type Column<T> = {
  key: keyof T | string;
  header: React.ReactNode;
  /** Renderer; receives row + index. */
  cell?: (row: T, index: number) => React.ReactNode;
  /** Override alignment (defaults to: first column = left, others = center). */
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  /** If true, this column is rendered as the first/numbered/left-aligned. */
  isLeading?: boolean;
};

export interface DataTableProps<T> {
  title?: string;
  source?: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  headerVariant?: "none" | "electric" | "deep";
  emptyState?: React.ReactNode;
  rowHref?: (row: T) => string | undefined;
  className?: string;
}

export function DataTable<T>({
  title,
  source,
  columns,
  rows,
  rowKey,
  headerVariant = "none",
  emptyState,
  rowHref,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {title ? (
        <h3 className="font-bold text-[12pt] leading-[16pt] text-matthews-deep">
          {title}
        </h3>
      ) : null}
      {source ? (
        <p className="italic text-[10pt] text-black/60 mb-2">{source}</p>
      ) : null}
      <div className="overflow-x-auto rounded-[var(--radius-matthews)] border border-matthews-deep/10">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr
              className={cn(
                headerVariant === "electric" && "bg-electric-light text-white",
                headerVariant === "deep" && "bg-matthews-deep text-white",
                headerVariant === "none" &&
                  "border-b border-matthews-deep/15 text-matthews-deep"
              )}
            >
              {columns.map((col, idx) => {
                const align =
                  col.align ?? (idx === 0 || col.isLeading ? "left" : "center");
                return (
                  <th
                    key={String(col.key)}
                    scope="col"
                    className={cn(
                      "px-3 py-2 text-[10pt] leading-[12pt] font-normal",
                      align === "left" && "text-left",
                      align === "center" && "text-center",
                      align === "right" && "text-right",
                      col.headerClassName
                    )}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-10 text-center text-sm text-matthews-deep/60"
                >
                  {emptyState ?? "Nothing to show."}
                </td>
              </tr>
            ) : (
              rows.map((row, idx) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={rowKey(row, idx)}
                    className={cn(
                      "border-b border-matthews-deep/10 last:border-b-0 text-[9pt] text-black",
                      href && "hover:bg-platinum/60 cursor-pointer"
                    )}
                    onClick={
                      href
                        ? () => {
                            if (typeof window !== "undefined")
                              window.location.href = href;
                          }
                        : undefined
                    }
                  >
                    {columns.map((col, colIdx) => {
                      const align =
                        col.align ??
                        (colIdx === 0 || col.isLeading ? "left" : "center");
                      const value = col.cell
                        ? col.cell(row, idx)
                        : (row as Record<string, React.ReactNode>)[
                            col.key as string
                          ];
                      return (
                        <td
                          key={String(col.key)}
                          className={cn(
                            "px-3 py-3 align-middle",
                            align === "left" && "text-left",
                            align === "center" && "text-center",
                            align === "right" && "text-right",
                            col.className
                          )}
                        >
                          {value as React.ReactNode}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
