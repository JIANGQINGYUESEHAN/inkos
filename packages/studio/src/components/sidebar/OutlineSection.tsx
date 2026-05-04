import { useEffect, useState, useCallback } from "react";
import { MapPin, ChevronDown, AlertTriangle, Pencil, Save, X } from "lucide-react";
import { useChatStore } from "../../store/chat";
import { fetchJson } from "../../hooks/use-api";
import { SidebarCard } from "./SidebarCard";

interface VolOutline {
  volume: string;
  title: string;
  excerpt: string;
  endReqs: string[];
}

function parseVolumeMapSimple(md: string): VolOutline[] {
  const results: VolOutline[] = [];
  const sections = md.split(/^## /m).slice(1);

  for (const section of sections) {
    const lines = section.split("\n");
    const title = lines[0].trim();
    if (!title.includes("卷")) continue;

    const volMatch = title.match(/第(.+?)卷/);
    const volume = volMatch?.[1] ?? title;
    const body = lines.slice(1).join("\n");

    const excerpt = body.replace(/^[#\s]+/, "").split(/[。\n]/)[0]?.trim() ?? "";

    const endReqs: string[] = [];
    const volEndSection = body.match(/(?:卷尾|尾声|VolEnd).*?必须发生.*?(?:\n|$)([\s\S]*?)(?=\n(?:##|###|$))/);
    if (volEndSection) {
      const reqLines = volEndSection[1].split(/\n-|\n\d+\.\s*/).map((s) => s.trim()).filter((s) => s.length > 5);
      endReqs.push(...reqLines);
    }

    results.push({ volume, title, excerpt, endReqs });
  }

  return results;
}

export function OutlineSection({ bookId }: { readonly bookId: string }) {
  const [outline, setOutline] = useState<VolOutline[]>([]);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [rawContent, setRawContent] = useState("");
  const bookDataVersion = useChatStore((s) => s.bookDataVersion);

  const load = useCallback(() => {
    if (!bookId) return;
    fetchJson<{ content: string | null }>(`/books/${bookId}/truth/outline/volume_map.md`)
      .then((mapData) => {
        if (mapData?.content) {
          setRawContent(mapData.content);
          setOutline(parseVolumeMapSimple(mapData.content));
        } else {
          setRawContent("");
          setOutline([]);
        }
      })
      .catch(() => {
        // Keep existing state on error
      });
  }, [bookId]);

  useEffect(() => {
    if (!editing) load();
  }, [load, editing, bookDataVersion]);

  const handleEdit = () => {
    setEditText(rawContent);
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchJson(`/books/${bookId}/truth/outline/volume_map.md`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      const parsed = parseVolumeMapSimple(editText);
      if (parsed.length === 0) {
        // Parse failed — keep editing mode so user can fix
        alert("大纲格式解析失败。确保每卷以 '## 第X卷' 开头。");
        setRawContent(editText);
      } else {
        setRawContent(editText);
        setOutline(parsed);
        setEditing(false);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  // Always show the card if we have content or are editing
  const hasContent = rawContent.length > 0 || editing;

  if (!hasContent) return null;

  if (editing) {
    return (
      <SidebarCard title="大纲" icon={<MapPin size={14} className="text-amber-400" />}>
        <div className="space-y-2">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full h-64 text-xs font-mono bg-background border border-border/50 rounded-lg p-2 resize-none focus:outline-none focus:border-primary/40"
          />
          <div className="flex gap-1">
            <button onClick={handleSave} disabled={saving} className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50">
              <Save size={10} /> {saving ? "保存中" : "保存"}
            </button>
            <button onClick={() => { setEditing(false); setOutline(parseVolumeMapSimple(rawContent)); }} className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-secondary rounded hover:bg-secondary/80">
              <X size={10} /> 取消
            </button>
          </div>
        </div>
      </SidebarCard>
    );
  }

  return (
    <SidebarCard
      title="大纲"
      icon={<MapPin size={14} className="text-amber-400" />}
      actions={
        <button onClick={handleEdit} className="text-muted-foreground/60 hover:text-foreground">
          <Pencil size={10} />
        </button>
      }
    >
      <div className="space-y-2">

        {outline.length > 0 ? (
          outline.map((vol) => {
            return (
              <div
                key={vol.volume}
                className="rounded-lg overflow-hidden bg-secondary/30"
              >
                <button
                  onClick={(e) => {
                    const next = (e.currentTarget.nextElementSibling as HTMLElement | null);
                    if (next) next.classList.toggle("hidden");
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 text-left"
                >
                  <span className="w-3 h-3 rounded-full bg-muted-foreground/20 shrink-0" />
                  <span className="text-sm font-medium text-foreground font-['SimSun','Songti_SC','STSong',serif] flex-1 truncate">
                    第{vol.volume}卷
                  </span>
                  <ChevronDown size={12} className="text-muted-foreground/50 shrink-0" />
                </button>
                <div className="hidden px-2.5 pb-2.5 space-y-1">
                  <p className="text-xs text-muted-foreground leading-relaxed">{vol.excerpt}</p>
                  {vol.endReqs.length > 0 && (
                    <div className="mt-1.5 pt-1.5 border-t border-border/20">
                      <div className="text-[10px] text-amber-600 font-medium mb-1 flex items-center gap-1">
                        <AlertTriangle size={10} />
                        卷尾必须发生
                      </div>
                      <ul className="space-y-0.5">
                        {vol.endReqs.map((req, ri) => (
                          <li key={ri} className="text-[10px] text-muted-foreground leading-relaxed">· {req}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-xs text-muted-foreground/60 px-1 py-2">
            大纲解析失败，点击编辑按钮查看原始内容。
          </div>
        )}
        <button
          onClick={handleEdit}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground rounded-lg hover:bg-secondary/30"
        >
          <Pencil size={10} /> 编辑大纲
        </button>
      </div>
    </SidebarCard>
  );
}
