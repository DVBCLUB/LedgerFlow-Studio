/**
 * memoryService.ts
 * ============================================================
 * AI Virtual Assistant Memory System
 * 
 * Provides:
 * - Short-term conversation memory
 * - Long-term persistent memory
 * - Semantic search for context retrieval
 * - Memory indexing and management
 * - User preference storage
 * 
 * ============================================================
 */

// ============================================================================
// MEMORY TYPES
// ============================================================================

/**
 * Memory entry for storage
 */
export interface MemoryEntry {
  id: string;
  type: 'conversation' | 'fact' | 'preference' | 'context' | 'goal';
  content: string;
  metadata: MemoryMetadata;
  createdAt: Date;
  updatedAt: Date;
  expiration?: Date;
  importance: number; // 0-1
}

/**
 * Memory metadata
 */
export interface MemoryMetadata {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  tags: string[];
  category?: string;
  source?: 'user' | 'assistant' | 'system' | 'external';
  confidence?: number; // 0-1
  context?: string;
  relatedMemories?: string[]; // IDs of related memories
}

/**
 * Memory search options
 */
export interface MemorySearchOptions {
  query: string;
  conversationId?: string;
  userId?: string;
  type?: MemoryEntry['type'];
  tags?: string[];
  limit?: number;
  minConfidence?: number;
  includeExpired?: boolean;
}

/**
 * Memory search result
 */
export interface MemorySearchResult {
  memory: MemoryEntry;
  score: number;
  matches: Array<{ field: string; match: string }>;
}

/**
 * Conversation context for LLM
 */
export interface ConversationContextForLLM {
  shortTermMemory: MemoryEntry[];
  longTermMemory: MemoryEntry[];
  userPreferences: Record<string, any>;
  systemContext: string;
}

/**
 * Memory statistics
 */
export interface MemoryStats {
  total: number;
  byType: Record<MemoryEntry['type'], number>;
  byUser: Record<string, number>;
  byConversation: Record<string, number>;
  averageConfidence: number;
  storageSize: number; // in bytes
}

// ============================================================================
// MEMORY STORAGE
// ============================================================================

/**
 * In-memory storage for development/testing
 * In production, this would be replaced with a vector database
 */
class InMemoryMemoryStore {
  private memories: Map<string, MemoryEntry> = new Map();
  private userIndex: Map<string, Set<string>> = new Map(); // userId -> memoryIds
  private conversationIndex: Map<string, Set<string>> = new Map(); // conversationId -> memoryIds
  private tagIndex: Map<string, Set<string>> = new Map(); // tag -> memoryIds
  private typeIndex: Map<MemoryEntry['type'], Set<string>> = new Map();

  /**
   * Store a memory
   */
  store(memory: MemoryEntry): void {
    this.memories.set(memory.id, memory);

    // Update user index
    if (memory.metadata.userId) {
      const userMemories = this.userIndex.get(memory.metadata.userId) || new Set();
      userMemories.add(memory.id);
      this.userIndex.set(memory.metadata.userId, userMemories);
    }

    // Update conversation index
    if (memory.metadata.conversationId) {
      const convMemories = this.conversationIndex.get(memory.metadata.conversationId) || new Set();
      convMemories.add(memory.id);
      this.conversationIndex.set(memory.metadata.conversationId, convMemories);
    }

    // Update tag index
    for (const tag of memory.metadata.tags) {
      const tagMemories = this.tagIndex.get(tag) || new Set();
      tagMemories.add(memory.id);
      this.tagIndex.set(tag, tagMemories);
    }

    // Update type index
    const typeMemories = this.typeIndex.get(memory.type) || new Set();
    typeMemories.add(memory.id);
    this.typeIndex.set(memory.type, typeMemories);
  }

  /**
   * Retrieve a memory by ID
   */
  retrieve(id: string): MemoryEntry | undefined {
    const memory = this.memories.get(id);
    if (!memory) return undefined;

    // Check expiration
    if (memory.expiration && new Date() > memory.expiration) {
      this.remove(id);
      return undefined;
    }

    return memory;
  }

  /**
   * Remove a memory by ID
   */
  remove(id: string): boolean {
    const memory = this.memories.get(id);
    if (!memory) return false;

    // Remove from indexes
    if (memory.metadata.userId) {
      const userMemories = this.userIndex.get(memory.metadata.userId);
      if (userMemories) {
        userMemories.delete(id);
        if (userMemories.size === 0) {
          this.userIndex.delete(memory.metadata.userId);
        }
      }
    }

    if (memory.metadata.conversationId) {
      const convMemories = this.conversationIndex.get(memory.metadata.conversationId);
      if (convMemories) {
        convMemories.delete(id);
        if (convMemories.size === 0) {
          this.conversationIndex.delete(memory.metadata.conversationId);
        }
      }
    }

    for (const tag of memory.metadata.tags) {
      const tagMemories = this.tagIndex.get(tag);
      if (tagMemories) {
        tagMemories.delete(id);
        if (tagMemories.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    const typeMemories = this.typeIndex.get(memory.type);
    if (typeMemories) {
      typeMemories.delete(id);
      if (typeMemories.size === 0) {
        this.typeIndex.delete(memory.type);
      }
    }

    this.memories.delete(id);
    return true;
  }

  /**
   * Search memories
   */
  search(options: MemorySearchOptions): MemorySearchResult[] {
    const results: MemorySearchResult[] = [];
    const query = options.query.toLowerCase();

    // Determine which memories to search
    let memoryIds: Set<string>;

    if (options.conversationId) {
      memoryIds = this.conversationIndex.get(options.conversationId) || new Set();
    } else if (options.userId) {
      memoryIds = this.userIndex.get(options.userId) || new Set();
    } else {
      memoryIds = new Set(this.memories.keys());
    }

    // Filter by type if specified
    if (options.type) {
      const typeMemories = this.typeIndex.get(options.type);
      if (typeMemories) {
        memoryIds = new Set([...memoryIds].filter(id => typeMemories.has(id)));
      }
    }

    // Filter by tags if specified
    if (options.tags && options.tags.length > 0) {
      const tagMemories = options.tags.map(tag => this.tagIndex.get(tag) || new Set());
      if (tagMemories.length > 0) {
        // Intersection of all tag sets
        memoryIds = new Set([...memoryIds].filter(id => 
          tagMemories.every(tags => tags.has(id))
        ));
      }
    }

    // Search each memory
    for (const id of memoryIds) {
      const memory = this.memories.get(id);
      if (!memory) continue;

      // Check expiration
      if (memory.expiration && new Date() > memory.expiration && !options.includeExpired) {
        continue;
      }

      // Check confidence
      if (options.minConfidence !== undefined && 
          memory.metadata.confidence !== undefined && 
          memory.metadata.confidence < options.minConfidence) {
        continue;
      }

      // Calculate score based on matches
      const matches: Array<{ field: string; match: string }> = [];
      let score = 0;

      // Search in content
      const content = memory.content.toLowerCase();
      if (content.includes(query)) {
        matches.push({ field: 'content', match: query });
        score += memory.importance * 2;
      }

      // Search in metadata
      if (memory.metadata.context && memory.metadata.context.toLowerCase().includes(query)) {
        matches.push({ field: 'context', match: query });
        score += memory.importance * 1.5;
      }

      // Search in tags
      for (const tag of memory.metadata.tags) {
        if (tag.toLowerCase().includes(query)) {
          matches.push({ field: 'tag', match: tag });
          score += memory.importance * 0.5;
        }
      }

      // Add partial matches
      const queryWords = query.split(/\s+/);
      for (const word of queryWords) {
        if (word.length > 3) {
          if (content.includes(word)) {
            score += memory.importance * 0.3;
          }
        }
      }

      if (score > 0 || matches.length > 0) {
        results.push({
          memory,
          score,
          matches,
        });
      }
    }

    // Sort by score and limit
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, options.limit || 10);
  }

  /**
   * Get memories by conversation
   */
  getByConversation(conversationId: string): MemoryEntry[] {
    const memoryIds = this.conversationIndex.get(conversationId);
    if (!memoryIds) return [];

    const memories: MemoryEntry[] = [];
    for (const id of memoryIds) {
      const memory = this.memories.get(id);
      if (memory && (!(memory.expiration) || new Date() <= memory.expiration)) {
        memories.push(memory);
      }
    }

    // Sort by createdAt
    memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return memories;
  }

  /**
   * Get memories by user
   */
  getByUser(userId: string): MemoryEntry[] {
    const memoryIds = this.userIndex.get(userId);
    if (!memoryIds) return [];

    const memories: MemoryEntry[] = [];
    for (const id of memoryIds) {
      const memory = this.memories.get(id);
      if (memory && (!(memory.expiration) || new Date() <= memory.expiration)) {
        memories.push(memory);
      }
    }

    memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return memories;
  }

  /**
   * Get all memories
   */
  getAll(): MemoryEntry[] {
    const memories: MemoryEntry[] = [];
    for (const memory of this.memories.values()) {
      if (!(memory.expiration && new Date() > memory.expiration)) {
        memories.push(memory);
      }
    }
    memories.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return memories;
  }

  /**
   * Clear expired memories
   */
  clearExpired(): number {
    let count = 0;
    const now = new Date();

    for (const [id, memory] of this.memories.entries()) {
      if (memory.expiration && now > memory.expiration) {
        this.remove(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Clear all memories for a conversation
   */
  clearConversation(conversationId: string): number {
    const memoryIds = this.conversationIndex.get(conversationId);
    if (!memoryIds) return 0;

    let count = 0;
    for (const id of memoryIds) {
      if (this.remove(id)) count++;
    }

    return count;
  }

  /**
   * Clear all memories for a user
   */
  clearUser(userId: string): number {
    const memoryIds = this.userIndex.get(userId);
    if (!memoryIds) return 0;

    let count = 0;
    for (const id of memoryIds) {
      if (this.remove(id)) count++;
    }

    return count;
  }

  /**
   * Clear all memories
   */
  clearAll(): number {
    const count = this.memories.size;
    this.memories.clear();
    this.userIndex.clear();
    this.conversationIndex.clear();
    this.tagIndex.clear();
    this.typeIndex.clear();
    return count;
  }

  /**
   * Get statistics
   */
  getStats(): MemoryStats {
    const byType: Record<MemoryEntry['type'], number> = {
      conversation: 0,
      fact: 0,
      preference: 0,
      context: 0,
      goal: 0,
    };

    const byUser: Record<string, number> = {};
    const byConversation: Record<string, number> = {};

    let totalConfidence = 0;
    let totalCount = 0;
    let storageSize = 0;

    for (const memory of this.memories.values()) {
      // Count by type
      byType[memory.type] = (byType[memory.type] || 0) + 1;

      // Count by user
      if (memory.metadata.userId) {
        byUser[memory.metadata.userId] = (byUser[memory.metadata.userId] || 0) + 1;
      }

      // Count by conversation
      if (memory.metadata.conversationId) {
        byConversation[memory.metadata.conversationId] = 
          (byConversation[memory.metadata.conversationId] || 0) + 1;
      }

      // Calculate average confidence
      if (memory.metadata.confidence !== undefined) {
        totalConfidence += memory.metadata.confidence;
        totalCount++;
      }

      // Estimate storage size (content length + metadata)
      storageSize += memory.content.length * 2; // Approximate UTF-16 size
      storageSize += JSON.stringify(memory.metadata).length;
    }

    return {
      total: this.memories.size,
      byType,
      byUser,
      byConversation,
      averageConfidence: totalCount > 0 ? totalConfidence / totalCount : 0,
      storageSize,
    };
  }

  /**
   * Get size
   */
  get size(): number {
    return this.memories.size;
  }
}

// Singleton instance
export const memoryStore = new InMemoryMemoryStore();

// ============================================================================
// MEMORY MANAGER
// ============================================================================

/**
 * Memory Manager - High-level memory management
 */
class MemoryManager {
  private store: InMemoryMemoryStore;
  private userPreferences: Map<string, Map<string, any>> = new Map();

  constructor(store: InMemoryMemoryStore = memoryStore) {
    this.store = store;
  }

  /**
   * Add a memory
   */
  addMemory(
    type: MemoryEntry['type'],
    content: string,
    metadata: Partial<MemoryMetadata> = {},
    ttl?: number // Time-to-live in milliseconds
  ): MemoryEntry {
    const now = new Date();
    const id = `mem_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Calculate importance based on type
    const importanceMap: Record<MemoryEntry['type'], number> = {
      conversation: 0.5,
      fact: 0.8,
      preference: 0.9,
      context: 0.7,
      goal: 0.9,
    };

    const memory: MemoryEntry = {
      id,
      type,
      content,
      metadata: {
        tags: [],
        confidence: 0.8,
        ...metadata,
      },
      createdAt: now,
      updatedAt: now,
      expiration: ttl ? new Date(now.getTime() + ttl) : undefined,
      importance: importanceMap[type] || 0.5,
    };

    this.store.store(memory);
    return memory;
  }

  /**
   * Add conversation memory
   */
  addConversationMemory(
    conversationId: string,
    content: string,
    userId?: string,
    source: 'user' | 'assistant' | 'system' = 'assistant',
    tags: string[] = []
  ): MemoryEntry {
    return this.addMemory('conversation', content, {
      conversationId,
      userId,
      source,
      tags,
      confidence: source === 'assistant' ? 0.9 : 0.8,
    }, 24 * 60 * 60 * 1000); // 24 hours TTL
  }

  /**
   * Add fact memory (long-term)
   */
  addFactMemory(
    content: string,
    userId?: string,
    tags: string[] = [],
    category?: string
  ): MemoryEntry {
    return this.addMemory('fact', content, {
      userId,
      tags: ['fact', ...tags],
      category,
      confidence: 0.9,
    }); // No TTL - persistent
  }

  /**
   * Add user preference
   */
  setUserPreference(
    userId: string,
    key: string,
    value: any,
    category?: string
  ): void {
    if (!this.userPreferences.has(userId)) {
      this.userPreferences.set(userId, new Map());
    }

    const preferences = this.userPreferences.get(userId)!;
    preferences.set(key, value);

    // Also store as preference memory
    this.addMemory('preference', JSON.stringify({ key, value }), {
      userId,
      tags: ['preference', category || 'general'],
      category,
      confidence: 1.0,
    });
  }

  /**
   * Get user preference
   */
  getUserPreference(userId: string, key: string, defaultValue?: any): any {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return defaultValue;

    return preferences.has(key) ? preferences.get(key) : defaultValue;
  }

  /**
   * Get all preferences for a user
   */
  getUserPreferences(userId: string): Record<string, any> {
    const preferences = this.userPreferences.get(userId);
    if (!preferences) return {};

    const result: Record<string, any> = {};
    for (const [key, value] of preferences.entries()) {
      result[key] = value;
    }
    return result;
  }

  /**
   * Add context memory
   */
  addContextMemory(
    conversationId: string,
    content: string,
    context: string,
    userId?: string
  ): MemoryEntry {
    return this.addMemory('context', content, {
      conversationId,
      userId,
      context,
      tags: ['context'],
      confidence: 0.7,
    }, 6 * 60 * 60 * 1000); // 6 hours TTL
  }

  /**
   * Add goal memory
   */
  addGoalMemory(
    content: string,
    userId?: string,
    category?: string
  ): MemoryEntry {
    return this.addMemory('goal', content, {
      userId,
      tags: ['goal', 'objective'],
      category,
      confidence: 0.8,
    }, 30 * 24 * 60 * 60 * 1000); // 30 days TTL
  }

  /**
   * Remove a memory
   */
  removeMemory(id: string): boolean {
    return this.store.remove(id);
  }

  /**
   * Search memories
   */
  search(options: MemorySearchOptions): MemorySearchResult[] {
    return this.store.search(options);
  }

  /**
   * Get memories by conversation
   */
  getByConversation(conversationId: string): MemoryEntry[] {
    return this.store.getByConversation(conversationId);
  }

  /**
   * Get memories by user
   */
  getByUser(userId: string): MemoryEntry[] {
    return this.store.getByUser(userId);
  }

  /**
   * Get conversation context for LLM
   */
  getConversationContext(
    conversationId: string,
    userId?: string,
    limit: number = 10
  ): ConversationContextForLLM {
    const shortTermMemories = this.store.getByConversation(conversationId).slice(0, limit);
    const userPreferences = this.getUserPreferences(userId || 'anonymous');

    // Get long-term memories that might be relevant
    const longTermMemories = userId 
      ? this.store.getByUser(userId).filter(m => m.type !== 'conversation')
      : [];

    return {
      shortTermMemory: shortTermMemories,
      longTermMemory: longTermMemories.slice(0, 5),
      userPreferences,
      systemContext: this.getSystemContext(userId),
    };
  }

  /**
   * Get system context
   */
  private getSystemContext(userId?: string): string {
    const now = new Date();
    const hour = now.getHours();
    const day = now.toLocaleDateString('vi-VN', { weekday: 'long' });
    const timeOfDay = hour >= 5 && hour < 12 ? 'sáng' :
                     hour >= 12 && hour < 18 ? 'chiều' : 'tối';

    let context = `Hôm nay là ${day}, bây giờ là ${timeOfDay}.`;

    if (userId) {
      const userName = this.getUserPreference(userId, 'name');
      if (userName) {
        context += ` Người dùng tên là ${userName}.`;
      }
    }

    // Add current date
    context += ` Ngày hôm nay là ${now.toLocaleDateString('vi-VN')}.`;

    return context;
  }

  /**
   * Get relevant context for a query
   */
  getRelevantContext(
    query: string,
    conversationId?: string,
    userId?: string,
    limit: number = 5
  ): string {
    const searchResults = this.search({
      query,
      conversationId,
      userId,
      limit,
    });

    if (searchResults.length === 0) {
      return 'Không có ngữ cảnh liên quan.';
    }

    const contextParts: string[] = [];
    
    for (const result of searchResults) {
      contextParts.push(result.memory.content);
    }

    return `Ngữ cảnh liên quan:\n${contextParts.join('\n')}`;
  }

  /**
   * Update a memory
   */
  updateMemory(id: string, updates: Partial<MemoryEntry>): MemoryEntry | null {
    const memory = this.store.retrieve(id);
    if (!memory) return null;

    const updated = { ...memory, ...updates, updatedAt: new Date() };
    this.store.store(updated);
    return updated;
  }

  /**
   * Get memory statistics
   */
  getStats(): MemoryStats {
    return this.store.getStats();
  }

  /**
   * Clear expired memories
   */
  clearExpired(): number {
    return this.store.clearExpired();
  }

  /**
   * Clear conversation memories
   */
  clearConversation(conversationId: string): number {
    return this.store.clearConversation(conversationId);
  }

  /**
   * Clear all memories
   */
  clearAll(): number {
    this.userPreferences.clear();
    return this.store.clearAll();
  }

  /**
   * Export all memories
   */
  export(): MemoryEntry[] {
    return this.store.getAll();
  }

  /**
   * Import memories
   */
  import(memories: MemoryEntry[]): number {
    let count = 0;
    for (const memory of memories) {
      this.store.store(memory);
      count++;
    }
    return count;
  }
}

// Singleton instance
export const memoryManager = new MemoryManager();

// ============================================================================
// SESSION MEMORY (for current conversation)
// ============================================================================

/**
 * Session Memory - Manages current conversation context
 */
class SessionMemory {
  private context!: ConversationContextForLLM;
  private currentConversationId: string | null = null;
  private currentUserId: string | null = null;

  /**
   * Start a new session
   */
  startSession(userId: string, conversationId: string): void {
    this.currentUserId = userId;
    this.currentConversationId = conversationId;
    this.context = memoryManager.getConversationContext(conversationId, userId);
  }

  /**
   * End current session
   */
  endSession(): void {
    this.currentConversationId = null;
    this.currentUserId = null;
    this.context = {
      shortTermMemory: [],
      longTermMemory: [],
      userPreferences: {},
      systemContext: '',
    };
  }

  /**
   * Add message to current session
   */
  addMessage(
    content: string,
    role: 'user' | 'assistant' | 'system' = 'assistant',
    tags: string[] = []
  ): MemoryEntry | null {
    if (!this.currentConversationId) return null;

    const memory = memoryManager.addConversationMemory(
      this.currentConversationId,
      content,
      this.currentUserId ?? undefined,
      role,
      tags
    );

    // Update context
    this.context = memoryManager.getConversationContext(
      this.currentConversationId,
      this.currentUserId ?? undefined
    );

    return memory;
  }

  /**
   * Get current context
   */
  getContext(): ConversationContextForLLM {
    if (this.currentConversationId) {
      this.context = memoryManager.getConversationContext(
        this.currentConversationId,
        this.currentUserId ?? undefined
      );
    }
    return this.context;
  }

  /**
   * Get formatted context for LLM
   */
  getFormattedContext(): string {
    const context = this.getContext();
    const parts: string[] = [];

    // Add system context
    if (context.systemContext) {
      parts.push(`Ngữ cảnh hệ thống: ${context.systemContext}`);
    }

    // Add user preferences
    if (Object.keys(context.userPreferences).length > 0) {
      parts.push(`Sở thích người dùng: ${JSON.stringify(context.userPreferences)}`);
    }

    // Add short-term memory
    if (context.shortTermMemory.length > 0) {
      parts.push('Ngữ cảnh trước đó:');
      for (const memory of context.shortTermMemory.slice(-5)) {
        parts.push(`  ${memory.metadata.source === 'user' ? 'Người dùng' : 'Glacia'}: ${memory.content}`);
      }
    }

    // Add long-term memory
    if (context.longTermMemory.length > 0) {
      parts.push('Kiến thức liên quan:');
      for (const memory of context.longTermMemory) {
        parts.push(`  ${memory.content}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Get conversation ID
   */
  getConversationId(): string | null {
    return this.currentConversationId;
  }

  /**
   * Get user ID
   */
  getUserId(): string | null {
    return this.currentUserId;
  }
}

// Singleton instance
export const sessionMemory = new SessionMemory();

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Create a new conversation session
 */
export function startConversationSession(
  userId: string,
  conversationId: string
): void {
  sessionMemory.startSession(userId, conversationId);
}

/**
 * End current conversation session
 */
export function endConversationSession(): void {
  sessionMemory.endSession();
}

/**
 * Add message to current session
 */
export function addSessionMessage(
  content: string,
  role: 'user' | 'assistant' | 'system' = 'assistant',
  tags: string[] = []
): MemoryEntry | null {
  return sessionMemory.addMessage(content, role, tags);
}

/**
 * Get current session context
 */
export function getSessionContext(): ConversationContextForLLM {
  return sessionMemory.getContext();
}

/**
 * Get formatted session context for LLM
 */
export function getFormattedSessionContext(): string {
  return sessionMemory.getFormattedContext();
}
