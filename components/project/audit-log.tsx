import { formatDateTime } from "@/lib/utils";
import { titleCase } from "@/lib/utils";

interface Props {
  entries: Array<{
    id: string;
    action: string;
    actorName: string;
    before: object | null;
    after: object | null;
    reason: string | null;
    createdAt: string;
  }>;
}

export function AuditLogList({ entries }: Props) {
  if (entries.length === 0) return null;
  return (
    <div>
      <h3 className="text-xs uppercase tracking-[0.14em] text-matthews-deep/55 mb-3">
        Approval & change log
      </h3>
      <ul className="space-y-3">
        {entries.map((e) => (
          <li
            key={e.id}
            className="rounded-[var(--radius-matthews)] border border-matthews-deep/10 p-3 text-sm"
          >
            <div className="flex items-center justify-between text-xs text-matthews-deep/55 mb-1">
              <span>{titleCase(e.action)}</span>
              <span>{formatDateTime(e.createdAt)}</span>
            </div>
            <p className="text-matthews-deep/85">
              <span className="font-medium">{e.actorName}</span>
              {e.reason ? (
                <>
                  {" — "}
                  <span className="italic">"{e.reason}"</span>
                </>
              ) : null}
            </p>
            {(e.before || e.after) && e.action.includes("override") ? (
              <pre className="mt-2 text-[10px] bg-platinum p-2 rounded-[var(--radius-matthews)] overflow-x-auto text-matthews-deep/70">
                {JSON.stringify({ before: e.before, after: e.after }, null, 2)}
              </pre>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
