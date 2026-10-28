import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'milo_chat_unread_notifications_v1';
const listeners = new Set<(count: number) => void>();
let unreadCount = 0;
let loadPromise: Promise<number> | null = null;

function publish(): void {
  for (const listener of listeners) listener(unreadCount);
}

export function getChatUnreadCount(): number {
  return unreadCount;
}

export function subscribeToChatUnreadCount(listener: (count: number) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function loadChatUnreadCount(): Promise<number> {
  if (!loadPromise) {
    loadPromise = AsyncStorage.getItem(STORAGE_KEY)
      .then(value => {
        const parsed = Number(value || 0);
        unreadCount = Number.isFinite(parsed) ? Math.min(99, Math.max(0, Math.floor(parsed))) : 0;
        publish();
        return unreadCount;
      })
      .catch(() => unreadCount);
  }
  return loadPromise;
}

export async function incrementChatUnreadCount(): Promise<number> {
  await loadChatUnreadCount();
  unreadCount = Math.min(99, unreadCount + 1);
  publish();
  try { await AsyncStorage.setItem(STORAGE_KEY, String(unreadCount)); } catch { /* in-memory count still works */ }
  return unreadCount;
}

export async function clearChatUnreadCount(): Promise<void> {
  await loadChatUnreadCount();
  unreadCount = 0;
  publish();
  try { await AsyncStorage.setItem(STORAGE_KEY, '0'); } catch { /* best effort */ }
}
