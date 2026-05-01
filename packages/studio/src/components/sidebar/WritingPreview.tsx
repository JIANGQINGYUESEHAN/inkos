import { useMemo, useEffect, useRef } from "react";
import { useChatStore, chatSelectors } from "../../store/chat";
import { SidebarCard } from "./SidebarCard";

function extractProseText(messages: ReadonlyArray<{ role: string; content: string; parts?: ReadonlyArray<{ type: string; content?: string }> }>): string {
  let prose = "";
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const msg = messages[i];
    if (msg.role !== "assistant") continue;
    if (msg.parts && msg.parts.length > 0) {
      const textParts = msg.parts
        .filter((p) => p.type === "text" && p.content)
        .map((p) => p.content!)
        .join("\n\n");
      if (textParts) {
        prose = textParts + (prose ? "\n\n" + prose : "");
      }
    } else if (msg.content) {
      prose = msg.content + (prose ? "\n\n" + prose : "");
    }
  }
  return prose;
}

function formatProseForDisplay(text: string): string {
  if (!text) return "";
  const lines = text.split("\n");
  const body = lines.filter((l) => !l.startsWith("# ")).join("\n").trim();
  return body;
}

interface WritingPreviewProps {
  readonly isZh: boolean;
}

export function WritingPreview({ isZh }: WritingPreviewProps) {
  const messages = useChatStore(chatSelectors.activeMessages);
  const isStreaming = useChatStore(chatSelectors.isActiveSessionStreaming);
  const scrollRef = useRef<HTMLDivElement>(null);

  const rawProse = useMemo(() => extractProseText(messages as any), [messages]);
  const displayContent = useMemo(() => formatProseForDisplay(rawProse), [rawProse]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [displayContent]);

  const charCount = displayContent.replace(/\s/g, "").length;

  if (!displayContent) return null;

  return (
    <SidebarCard title={isZh ? "📝 写作预览" : "📝 Writing Preview"} defaultOpen={true}>
      <div className="flex flex-col gap-2">
        {isStreaming && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-primary/5 border border-primary/10">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
            <span className="text-[11px] text-primary font-medium">
              {isZh ? "正在生成..." : "Generating..."}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground/60 px-1">
          <span>{isZh ? "字数" : "chars"}: {charCount.toLocaleString()}</span>
        </div>
        <div
          ref={scrollRef}
          className="max-h-80 overflow-y-auto text-sm leading-7 font-serif text-foreground/85"
        >
          {displayContent.split(/\n\n+/).filter(Boolean).map((para, i) => (
            <p key={i} className="mb-4 leading-7">{para}</p>
          ))}
        </div>
      </div>
    </SidebarCard>
  );
}
