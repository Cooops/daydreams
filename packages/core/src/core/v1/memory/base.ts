import type { MemoryStore, WorkingMemory } from "../types";

/**
 * Retrieves or creates a new conversation memory for the given ID
 * @param memory - The memory store to use
 * @param conversationId - Unique identifier for the conversation
 * @returns A WorkingMemory object for the conversation
 */
export async function getOrCreateConversationMemory(
  memory: MemoryStore,
  conversationId: string
): Promise<WorkingMemory> {
  const data = await memory.get<WorkingMemory>(conversationId);
  if (data) return data;
  return {
    inputs: [],
    outputs: [],
    thoughts: [],
    calls: [],
    results: [],
    chains: [],
  };
}

/**
 * Creates a new in-memory store for conversation data
 * @returns A MemoryStore implementation using a Map for storage
 */
export function createMemoryStore(): MemoryStore {
  const data = new Map<string, any>();
  return {
    /**
     * Retrieves a value from the store
     * @param key - Key to look up
     * @returns The stored value or null if not found
     */
    async get(key: string) {
      return data.get(key);
    },

    /**
     * Removes all entries from the store
     */
    async clear() {
      data.clear();
    },

    /**
     * Removes a specific entry from the store
     * @param key - Key to remove
     */
    async delete(key: string) {
      data.delete(key);
    },

    /**
     * Stores a value in the store
     * @param key - Key to store under
     * @param value - Value to store
     */
    async set(key: string, value: any) {
      data.set(key, value);
    },
  };
}
