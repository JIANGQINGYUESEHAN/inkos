import { useEffect, useState } from "react";
import { Package, Coins, BookOpen, FlaskRound, Map, Wrench, Eye, ChevronDown, Building2 } from "lucide-react";
import { useChatStore } from "../../store/chat";
import { fetchJson } from "../../hooks/use-api";
import { SidebarCard } from "./SidebarCard";
import { cn } from "../../lib/utils";

interface LedgerCategory {
  name: string;
  icon: React.ReactNode;
  headers: string[];
  rows: string[][];
}

interface LedgerSection {
  title: string;
  icon: React.ReactNode;
  categories: LedgerCategory[];
}

function parseParticleLedger(md: string): LedgerSection[] {
  const sections: LedgerSection[] = [];
  const parts = md.split(/^## /m).slice(1);

  for (const part of parts) {
    const lines = part.split("\n");
    const title = lines[0].trim();
    if (!title || title === "数值体系") continue;

    const body = lines.slice(1).join("\n");
    const categories = parseCategories(body);
    if (categories.length > 0) {
      sections.push({ title, icon: null, categories });
    }
  }

  return sections;
}

function parseCategories(body: string): LedgerCategory[] {
  const categories: LedgerCategory[] = [];
  const subSections = body.split(/^### /m).slice(1);

  for (const section of subSections) {
    const lines = section.split("\n");
    const name = lines[0].trim();
    if (!name) continue;

    const tableStart = lines.findIndex((l) => l.startsWith("|"));
    if (tableStart === -1) {
      continue;
    }

    const headerLine = lines[tableStart] ?? "";
    const headers = headerLine.split("|").map((h) => h.trim()).filter(Boolean);

    const rows: string[][] = [];
    for (let i = tableStart + 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("|")) break;
      const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
      if (cells.length === 0) continue;
      rows.push(cells);
    }

    categories.push({ name, icon: null, headers, rows });
  }

  return categories;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "灵石": <Coins size={12} className="text-amber-500" />,
  "功法": <BookOpen size={12} className="text-blue-500" />,
  "丹药": <FlaskRound size={12} className="text-emerald-500" />,
  "阵法": <Wrench size={12} className="text-purple-500" />,
  "地图": <Map size={12} className="text-rose-500" />,
  "杂物": <Package size={12} className="text-zinc-500" />,
  "阵纹感知": <Eye size={12} className="text-indigo-500" />,
  "他人之物（未获得）": <Eye size={12} className="text-sky-500" />,
  "情报": <Eye size={12} className="text-teal-500" />,
};

function isEmpty(cat: LedgerCategory): boolean {
  return cat.rows.length === 0 || cat.rows.every(
    (r) => r.length <= 1 || (r[0] === "—" && r.length === 1) || r.slice(0, -1).every((c) => c === "—"),
  );
}

function LedgerCategoryCard({ cat }: { readonly cat: LedgerCategory }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[cat.name] ?? null;
  const empty = isEmpty(cat);
  const count = empty ? 0 : cat.rows.length;

  return (
    <div className="rounded-lg bg-secondary/30 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
      >
        <span className="shrink-0">{icon}</span>
        <span className="text-sm font-medium text-foreground font-['SimSun','Songti_SC','STSong',serif] flex-1 truncate">
          {cat.name}
        </span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full shrink-0",
          empty ? "bg-zinc-500/10 text-zinc-500" : "bg-primary/10 text-primary",
        )}>
          {empty ? "暂无" : count}
        </span>
        <ChevronDown size={12} className={cn("text-muted-foreground/50 transition-transform shrink-0", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-2.5 pb-2.5">
          {empty ? (
            <p className="text-xs text-muted-foreground/60 px-1">暂无</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="border-b border-border/30">
                    {cat.headers.map((h, i) => (
                      <th key={i} className={cn(
                        "text-left py-1 px-1 text-muted-foreground/60 font-medium",
                        i === 0 ? "" : "whitespace-nowrap",
                      )}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {cat.rows.map((row, ri) => (
                    <tr key={ri} className="border-b border-border/10 last:border-0">
                      {row.map((cell, ci) => (
                        <td key={ci} className={cn(
                          "py-1 px-1",
                          ci === 0 ? "text-foreground/80 font-medium" : "text-muted-foreground",
                          ci > 0 ? "whitespace-nowrap" : "",
                        )}>
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
      )}
    </div>
  );
}

const PROTAGONIST_SECTIONS = new Set(["陈东储物袋", "陈东见闻录"]);

interface StorageBagSectionProps {
  readonly bookId: string;
}

export function StorageBagSection({ bookId }: StorageBagSectionProps) {
  const [sections, setSections] = useState<LedgerSection[]>([]);
  const bookDataVersion = useChatStore((s) => s.bookDataVersion);

  useEffect(() => {
    fetchJson<{ content: string | null }>(`/books/${bookId}/truth/particle_ledger.md`)
      .then((data) => {
        if (data.content) {
          setSections(parseParticleLedger(data.content));
        } else {
          setSections([]);
        }
      })
      .catch(() => setSections([]));
  }, [bookId, bookDataVersion]);

  if (sections.length === 0) return null;

  const protagonist = sections.filter((s) => PROTAGONIST_SECTIONS.has(s.title));
  const others = sections.filter((s) => !PROTAGONIST_SECTIONS.has(s.title));

  return (
    <>
      {protagonist.length > 0 && (
        <SidebarCard title="主角" icon={<Package size={14} className="text-amber-400" />}>
          <div className="space-y-1.5">
            {protagonist.map((section) => (
              <div key={section.title} className="mb-2 last:mb-0">
                <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-1 px-1">
                  {section.title}
                </div>
                {section.categories.map((cat) => (
                  <LedgerCategoryCard key={cat.name} cat={cat} />
                ))}
              </div>
            ))}
          </div>
        </SidebarCard>
      )}
      {others.map((section) => (
        <SidebarCard key={section.title} title={section.title} icon={<Building2 size={14} className="text-blue-400" />}>
          <div className="space-y-1.5">
            {section.categories.map((cat) => (
              <LedgerCategoryCard key={cat.name} cat={cat} />
            ))}
          </div>
        </SidebarCard>
      ))}
    </>
  );
}
