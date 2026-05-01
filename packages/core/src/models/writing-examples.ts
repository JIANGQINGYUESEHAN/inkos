import { z } from "zod";

/**
 * Writing examples for few-shot learning.
 * Users can provide good fragments (to learn from) and bad fragments (to avoid).
 */

export const ExampleTypeSchema = z.enum(["good", "bad", "scene", "dialogue"]);
export type ExampleType = z.infer<typeof ExampleTypeSchema>;

export const ExampleSceneTypeSchema = z.enum([
  "xianyi",      // 仙侠意境
  "urban",       // 都市烟火气
  "xuanhuan",    // 玄幻气势
  "combat",      // 战斗场面
  "romance",     // 感情戏
  "mystery",     // 悬疑氛围
  "daily",       // 日常生活
  "other",       // 其他
]);
export type ExampleSceneType = z.infer<typeof ExampleSceneTypeSchema>;

export const WritingExampleSchema = z.object({
  id: z.string(),
  type: ExampleTypeSchema,
  sceneType: ExampleSceneTypeSchema.optional(),
  character: z.string().optional(),  // 对话风格参考时的角色名
  title: z.string().optional(),      // 范例标题
  content: z.string(),               // 范例内容
  source: z.string().optional(),     // 来源（如"季越人《玄鉴仙族》"）
  tags: z.array(z.string()).default([]),  // 标签
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type WritingExample = z.infer<typeof WritingExampleSchema>;

export const WritingExamplesFileSchema = z.object({
  version: z.literal(1).default(1),
  examples: z.array(WritingExampleSchema).default([]),
});
export type WritingExamplesFile = z.infer<typeof WritingExamplesFileSchema>;

/**
 * Create a new writing example with defaults.
 */
export function createWritingExample(
  input: Omit<WritingExample, "id" | "createdAt" | "updatedAt">,
): WritingExample {
  const now = new Date().toISOString();
  return {
    id: `ex-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...input,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Format examples for injection into Writer prompt.
 */
export function formatExamplesForPrompt(
  examples: ReadonlyArray<WritingExample>,
  language: "zh" | "en" = "zh",
): string {
  if (examples.length === 0) return "";

  const goodExamples = examples.filter((e) => e.type === "good");
  const badExamples = examples.filter((e) => e.type === "bad");
  const sceneExamples = examples.filter((e) => e.type === "scene");
  const dialogueExamples = examples.filter((e) => e.type === "dialogue");

  const sections: string[] = [];

  if (goodExamples.length > 0) {
    sections.push(
      language === "en"
        ? formatGoodExamplesEn(goodExamples)
        : formatGoodExamplesZh(goodExamples),
    );
  }

  if (badExamples.length > 0) {
    sections.push(
      language === "en"
        ? formatBadExamplesEn(badExamples)
        : formatBadExamplesZh(badExamples),
    );
  }

  if (sceneExamples.length > 0) {
    sections.push(
      language === "en"
        ? formatSceneExamplesEn(sceneExamples)
        : formatSceneExamplesZh(sceneExamples),
    );
  }

  if (dialogueExamples.length > 0) {
    sections.push(
      language === "en"
        ? formatDialogueExamplesEn(dialogueExamples)
        : formatDialogueExamplesZh(dialogueExamples),
    );
  }

  return sections.join("\n\n");
}

function formatGoodExamplesZh(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## 写作范例（学习目标）", "", "以下片段展示了期望的写作质量，你的输出应尽量贴近这种风格：", ""];
  for (const ex of examples) {
    const title = ex.title ? `### ${ex.title}` : "";
    const source = ex.source ? ` ——${ex.source}` : "";
    if (title) lines.push(title);
    lines.push(`> ${ex.content}${source}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatBadExamplesEn(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## Anti-Examples (Avoid These Patterns)", "", "The following fragments demonstrate patterns to AVOID. Do not reproduce these patterns in your output:", ""];
  for (const ex of examples) {
    const title = ex.title ? `### ${ex.title}` : "";
    if (title) lines.push(title);
    lines.push(`✗ ${ex.content}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatBadExamplesZh(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## 反面教材（避免以下模式）", "", "以下片段展示了需要避免的模式，你的输出不得出现类似写法：", ""];
  for (const ex of examples) {
    const title = ex.title ? `### ${ex.title}` : "";
    if (title) lines.push(title);
    lines.push(`✗ ${ex.content}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatGoodExamplesEn(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## Writing Examples (Learning Targets)", "", "The following fragments demonstrate the desired writing quality. Your output should approximate this style:", ""];
  for (const ex of examples) {
    const title = ex.title ? `### ${ex.title}` : "";
    const source = ex.source ? ` ——${ex.source}` : "";
    if (title) lines.push(title);
    lines.push(`> ${ex.content}${source}`);
    lines.push("");
  }
  return lines.join("\n");
}

function formatSceneExamplesZh(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## 场景意境参考", "", "以下片段展示了特定场景的意境营造方式，写作时可参考这种氛围感：", ""];
  const grouped = groupBySceneType(examples);
  for (const [sceneType, items] of grouped) {
    lines.push(`### ${getSceneTypeNameZh(sceneType)}`);
    for (const ex of items) {
      const source = ex.source ? ` ——${ex.source}` : "";
      lines.push(`> ${ex.content}${source}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function formatSceneExamplesEn(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## Scene Atmosphere Reference", "", "The following fragments demonstrate how to create atmosphere for specific scene types:", ""];
  const grouped = groupBySceneType(examples);
  for (const [sceneType, items] of grouped) {
    lines.push(`### ${getSceneTypeNameEn(sceneType)}`);
    for (const ex of items) {
      const source = ex.source ? ` ——${ex.source}` : "";
      lines.push(`> ${ex.content}${source}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function formatDialogueExamplesZh(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## 对话风格参考", "", "以下对话片段展示了不同角色的说话方式，写作对话时请参考：", ""];
  const grouped = groupByCharacter(examples);
  for (const [character, items] of grouped) {
    lines.push(`### ${character}`);
    for (const ex of items) {
      lines.push(`> ${ex.content}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function formatDialogueExamplesEn(examples: ReadonlyArray<WritingExample>): string {
  const lines = ["## Dialogue Style Reference", "", "The following dialogue fragments demonstrate different characters' speaking styles:", ""];
  const grouped = groupByCharacter(examples);
  for (const [character, items] of grouped) {
    lines.push(`### ${character}`);
    for (const ex of items) {
      lines.push(`> ${ex.content}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

function groupBySceneType(
  examples: ReadonlyArray<WritingExample>,
): Map<string, WritingExample[]> {
  const map = new Map<string, WritingExample[]>();
  for (const ex of examples) {
    const key = ex.sceneType ?? "other";
    const arr = map.get(key) ?? [];
    arr.push(ex);
    map.set(key, arr);
  }
  return map;
}

function groupByCharacter(
  examples: ReadonlyArray<WritingExample>,
): Map<string, WritingExample[]> {
  const map = new Map<string, WritingExample[]>();
  for (const ex of examples) {
    const key = ex.character ?? "unknown";
    const arr = map.get(key) ?? [];
    arr.push(ex);
    map.set(key, arr);
  }
  return map;
}

function getSceneTypeNameZh(sceneType: string): string {
  const names: Record<string, string> = {
    xianyi: "仙侠意境",
    urban: "都市烟火气",
    xuanhuan: "玄幻气势",
    combat: "战斗场面",
    romance: "感情戏",
    mystery: "悬疑氛围",
    daily: "日常生活",
    other: "其他",
  };
  return names[sceneType] ?? sceneType;
}

function getSceneTypeNameEn(sceneType: string): string {
  const names: Record<string, string> = {
    xianyi: "Xianxia Atmosphere",
    urban: "Urban Life",
    xuanhuan: "Xuanhuan Momentum",
    combat: "Combat Scenes",
    romance: "Romance",
    mystery: "Mystery & Suspense",
    daily: "Daily Life",
    other: "Other",
  };
  return names[sceneType] ?? sceneType;
}
