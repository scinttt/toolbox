import type { VocabularyEntry, VocabularyStore } from "@/types";

const STORAGE_KEY = "translator-vocabulary";
const CURRENT_VERSION = 1;

function getStore(): VocabularyStore {
  if (typeof window === "undefined") {
    return { version: CURRENT_VERSION, entries: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { version: CURRENT_VERSION, entries: [] };
    }
    const parsed = JSON.parse(raw) as VocabularyStore;
    if (parsed.version !== CURRENT_VERSION) {
      // Future: handle migrations here
      return { version: CURRENT_VERSION, entries: [] };
    }
    return parsed;
  } catch {
    return { version: CURRENT_VERSION, entries: [] };
  }
}

function saveStore(store: VocabularyStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function getVocabularyEntries(): VocabularyEntry[] {
  return getStore().entries;
}

export function addWord(entry: VocabularyEntry): void {
  const store = getStore();
  // Deduplicate by word
  const exists = store.entries.some(
    (e) => e.word.toLowerCase() === entry.word.toLowerCase()
  );
  if (exists) return;

  store.entries.unshift(entry);
  saveStore(store);
}

export function removeWord(word: string): void {
  const store = getStore();
  store.entries = store.entries.filter(
    (e) => e.word.toLowerCase() !== word.toLowerCase()
  );
  saveStore(store);
}

export function hasWord(word: string): boolean {
  const store = getStore();
  return store.entries.some(
    (e) => e.word.toLowerCase() === word.toLowerCase()
  );
}

export function isStorageAvailable(): boolean {
  try {
    const testKey = "__storage_test__";
    localStorage.setItem(testKey, "1");
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

// Exported for testing
export { STORAGE_KEY, CURRENT_VERSION };
