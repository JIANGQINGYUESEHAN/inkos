import type { MessageState } from "../../types";

const MODEL_KEY = "inkos.selected-model";
const SERVICE_KEY = "inkos.selected-service";

function loadPersistedModel(): string | null {
  try { return globalThis.localStorage?.getItem(MODEL_KEY) ?? null; } catch { return null; }
}
function loadPersistedService(): string | null {
  try { return globalThis.localStorage?.getItem(SERVICE_KEY) ?? null; } catch { return null; }
}

export const initialMessageState: MessageState = {
  sessions: {},
  sessionIdsByBook: {},
  activeSessionId: null,
  input: "",
  selectedModel: loadPersistedModel(),
  selectedService: loadPersistedService(),
};
