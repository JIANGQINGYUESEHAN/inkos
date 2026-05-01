import { useState, useEffect } from "react";
import { fetchJson, useApi, postApi, putApi, deleteApi } from "../hooks/use-api";
import type { Theme } from "../hooks/use-theme";
import type { TFunction } from "../hooks/use-i18n";
import { useColors } from "../hooks/use-colors";
import { BookOpen, Plus, Trash2, Edit2, Check, X } from "lucide-react";

interface WritingExample {
  readonly id: string;
  readonly type: "good" | "bad" | "scene" | "dialogue";
  readonly sceneType?: string;
  readonly character?: string;
  readonly title?: string;
  readonly content: string;
  readonly source?: string;
  readonly tags: ReadonlyArray<string>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

interface WritingExamplesFile {
  readonly version: number;
  readonly examples: ReadonlyArray<WritingExample>;
}

interface BookSummary {
  readonly id: string;
  readonly title: string;
}

interface Nav { toDashboard: () => void }

const EXAMPLE_TYPES = [
  { value: "good", label: "好片段（学习目标）", color: "text-green-500" },
  { value: "bad", label: "反面教材（避免）", color: "text-red-500" },
  { value: "scene", label: "场景意境参考", color: "text-blue-500" },
  { value: "dialogue", label: "对话风格参考", color: "text-purple-500" },
] as const;

const SCENE_TYPES = [
  { value: "xianyi", label: "仙侠意境" },
  { value: "urban", label: "都市烟火气" },
  { value: "xuanhuan", label: "玄幻气势" },
  { value: "combat", label: "战斗场面" },
  { value: "romance", label: "感情戏" },
  { value: "mystery", label: "悬疑氛围" },
  { value: "daily", label: "日常生活" },
  { value: "other", label: "其他" },
] as const;

export function ExamplesManager({ nav, theme, t }: { nav: Nav; theme: Theme; t: TFunction }) {
  const c = useColors(theme);
  const [selectedBookId, setSelectedBookId] = useState<string>("");
  const [examples, setExamples] = useState<WritingExamplesFile>({ version: 1, examples: [] });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const { data: booksData } = useApi<{ books: ReadonlyArray<BookSummary> }>("/books");

  // New example form state
  const [newType, setNewType] = useState<"good" | "bad" | "scene" | "dialogue">("good");
  const [newSceneType, setNewSceneType] = useState<string>("other");
  const [newCharacter, setNewCharacter] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newSource, setNewSource] = useState("");

  useEffect(() => {
    if (selectedBookId) {
      loadExamples();
    }
  }, [selectedBookId]);

  const loadExamples = async () => {
    if (!selectedBookId) return;
    setLoading(true);
    try {
      const data = await fetchJson<WritingExamplesFile>(`/books/${selectedBookId}/examples`);
      setExamples(data);
    } catch {
      setExamples({ version: 1, examples: [] });
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedBookId || !newContent.trim()) return;
    try {
      await postApi(`/books/${selectedBookId}/examples`, {
        type: newType,
        sceneType: newType === "scene" ? newSceneType : undefined,
        character: newType === "dialogue" ? newCharacter : undefined,
        title: newTitle || undefined,
        content: newContent,
        source: newSource || undefined,
      });
      setShowAddForm(false);
      resetForm();
      await loadExamples();
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const handleDelete = async (exampleId: string) => {
    if (!selectedBookId || !confirm("确定删除这条范例吗？")) return;
    try {
      await deleteApi(`/books/${selectedBookId}/examples/${exampleId}`);
      await loadExamples();
    } catch (e) {
      alert(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const resetForm = () => {
    setNewType("good");
    setNewSceneType("other");
    setNewCharacter("");
    setNewTitle("");
    setNewContent("");
    setNewSource("");
  };

  const getTypeLabel = (type: string) => {
    return EXAMPLE_TYPES.find((t) => t.value === type)?.label ?? type;
  };

  const getTypeColor = (type: string) => {
    return EXAMPLE_TYPES.find((t) => t.value === type)?.color ?? "text-foreground";
  };

  const getSceneLabel = (sceneType?: string) => {
    return SCENE_TYPES.find((s) => s.value === sceneType)?.label ?? sceneType ?? "";
  };

  const groupedExamples = {
    good: examples.examples.filter((e) => e.type === "good"),
    bad: examples.examples.filter((e) => e.type === "bad"),
    scene: examples.examples.filter((e) => e.type === "scene"),
    dialogue: examples.examples.filter((e) => e.type === "dialogue"),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={nav.toDashboard} className={c.link}>{t("bread.home")}</button>
        <span className="text-border">/</span>
        <span>写作范例</span>
      </div>

      <h1 className="font-serif text-3xl flex items-center gap-3">
        <BookOpen size={28} className="text-primary" />
        写作范例管理
      </h1>

      <p className="text-muted-foreground">
        提供好片段让 AI 学习，提供反面教材让 AI 避免。支持场景意境参考和对话风格参考。
      </p>

      {/* Book selector */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">选择书籍：</label>
        <select
          value={selectedBookId}
          onChange={(e) => setSelectedBookId(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">-- 请选择 --</option>
          {booksData?.books?.map((book) => (
            <option key={book.id} value={book.id}>{book.title}</option>
          ))}
        </select>
        {selectedBookId && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            <Plus size={16} />
            添加范例
          </button>
        )}
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="p-6 border rounded-lg bg-card space-y-4">
          <h3 className="text-lg font-semibold">添加新范例</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">类型</label>
              <select
                value={newType}
                onChange={(e) => setNewType(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md bg-background mt-1"
              >
                {EXAMPLE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            {newType === "scene" && (
              <div>
                <label className="text-sm font-medium">场景类型</label>
                <select
                  value={newSceneType}
                  onChange={(e) => setNewSceneType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                >
                  {SCENE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            )}
            {newType === "dialogue" && (
              <div>
                <label className="text-sm font-medium">角色名</label>
                <input
                  value={newCharacter}
                  onChange={(e) => setNewCharacter(e.target.value)}
                  placeholder="例如：林烬"
                  className="w-full px-3 py-2 border rounded-md bg-background mt-1"
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium">标题（可选）</label>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="例如：仙侠意境描写"
              className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">来源（可选）</label>
            <input
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              placeholder="例如：季越人《玄鉴仙族》"
              className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium">内容 *</label>
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="粘贴小说片段..."
              rows={6}
              className="w-full px-3 py-2 border rounded-md bg-background mt-1"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newContent.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
            >
              <Check size={16} />
              保存
            </button>
            <button
              onClick={() => { setShowAddForm(false); resetForm(); }}
              className="flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent"
            >
              <X size={16} />
              取消
            </button>
          </div>
        </div>
      )}

      {/* Examples list */}
      {selectedBookId && (
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">加载中...</div>
          ) : examples.examples.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂无范例。点击"添加范例"开始。
            </div>
          ) : (
            EXAMPLE_TYPES.map((type) => {
              const items = groupedExamples[type.value];
              if (items.length === 0) return null;
              return (
                <div key={type.value} className="space-y-3">
                  <h3 className={`text-lg font-semibold ${type.color}`}>
                    {type.label} ({items.length})
                  </h3>
                  <div className="space-y-3">
                    {items.map((example) => (
                      <div
                        key={example.id}
                        className="p-4 border rounded-lg bg-card"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              {example.title && (
                                <span className="font-medium">{example.title}</span>
                              )}
                              {example.type === "scene" && example.sceneType && (
                                <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                                  {getSceneLabel(example.sceneType)}
                                </span>
                              )}
                              {example.type === "dialogue" && example.character && (
                                <span className="text-xs px-2 py-0.5 bg-secondary rounded">
                                  {example.character}
                                </span>
                              )}
                              {example.source && (
                                <span className="text-xs text-muted-foreground">
                                  ——{example.source}
                                </span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{example.content}</p>
                          </div>
                          <button
                            onClick={() => handleDelete(example.id)}
                            className="text-destructive hover:text-destructive/80 p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
