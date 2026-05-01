import { useEffect, useState } from "react";
import { Building2, Globe, Users, Map, ChevronDown } from "lucide-react";
import { useChatStore } from "../../store/chat";
import { fetchJson } from "../../hooks/use-api";
import { SidebarCard } from "./SidebarCard";
import { cn } from "../../lib/utils";

interface LedgerCategory {
  name: string;
  headers: string[];
  rows: string[][];
}

function parseMdSections(md: string): Array<{ title: string; categories: LedgerCategory[] }> {
  const results: Array<{ title: string; categories: LedgerCategory[] }> = [];
  const parts = md.split(/^## /m).slice(1);

  for (const part of parts) {
    const lines = part.split("\n");
    const title = lines[0].trim();
    if (!title) continue;

    const body = lines.slice(1).join("\n");
    const subs = body.split(/^### /m).slice(1);
    const categories: LedgerCategory[] = [];

    for (const sub of subs) {
      const slines = sub.split("\n");
      const name = slines[0].trim();
      if (!name) continue;

      const tableStart = slines.findIndex((l) => l.startsWith("|"));
      if (tableStart === -1) continue;

      const headerLine = slines[tableStart] ?? "";
      const headers = headerLine.split("|").map((h) => h.trim()).filter(Boolean);

      const rows: string[][] = [];
      for (let i = tableStart + 2; i < slines.length; i++) {
        const line = slines[i].trim();
        if (!line.startsWith("|")) break;
        const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
        if (cells.length === 0) continue;
        rows.push(cells);
      }
      categories.push({ name, headers, rows });
    }
    if (categories.length > 0) {
      results.push({ title, categories });
    }
  }
  return results;
}

const ICONS: Record<string, React.ReactNode> = {
  "他人之物": <Users size={14} className="text-violet-400" />,
  "宗门资源": <Building2 size={14} className="text-blue-400" />,
  "世界资源": <Globe size={14} className="text-emerald-400" />,
  "地图": <Map size={14} className="text-rose-400" />,
};

function isEmpty(rows: string[][]): boolean {
  return rows.length === 0 || rows.every(
    (r) => r.slice(0, -1).every((c) => c === "—"),
  );
}

export function WorldLedgerSection({ bookId }: { readonly bookId: string }) {
  const [sections, setSections] = useState<Array<{ title: string; categories: LedgerCategory[] }>>([]);
  const bookDataVersion = useChatStore((s) => s.bookDataVersion);

  useEffect(() => {
    fetchJson<{ content: string | null }>(`/books/${bookId}/truth/world_ledger.md`)
      .then((data) => {
        if (data.content) setSections(parseMdSections(data.content));
        else setSections([]);
      })
      .catch(() => setSections([]));
  }, [bookId, bookDataVersion]);

  if (sections.length === 0) return null;

  return (
    <>
      {sections.map((section) => (
        <SidebarCard key={section.title} title={section.title} icon={ICONS[section.title]}>
          <div className="space-y-1.5">
            {section.categories.map((cat) => {
              const empty = isEmpty(cat.rows);
              return (
                <div key={cat.name} className="rounded-lg bg-secondary/30 overflow-hidden">
                  <button
                    onClick={(e) => {
                      const next = (e.currentTarget.nextElementSibling as HTMLElement | null);
                      if (next) next.classList.toggle("hidden");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                  >
                    <span className="text-sm font-medium text-foreground font-['SimSun','Songti_SC','STSong',serif] flex-1 truncate">
                      {cat.name}
                    </span>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
                      empty ? "bg-zinc-500/10 text-zinc-500" : "bg-primary/10 text-primary",
                    )}>
                      {empty ? "暂无" : cat.rows.length}
                    </span>
                    <ChevronDown size={12} className="text-muted-foreground/50 shrink-0" />
                  </button>
                  <div className="hidden px-2.5 pb-2.5">
                    {empty ? (
                      <p className="text-xs text-muted-foreground/60 px-1">暂无</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="border-b border-border/30">
                              {cat.headers.map((h, i) => (
                                <th key={i} className={cn("text-left py-1 px-1 text-muted-foreground/60 font-medium", i === 0 ? "" : "whitespace-nowrap")}>
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {cat.rows.map((row, ri) => (
                              <tr key={ri} className="border-b border-border/10 last:border-0">
                                {row.map((cell, ci) => (
                                  <td key={ci} className={cn("py-1 px-1", ci === 0 ? "text-foreground/80 font-medium" : "text-muted-foreground", ci > 0 ? "whitespace-nowrap" : "")}>
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </SidebarCard>
      ))}
    </>
  );
}
