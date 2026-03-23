export interface User {
  id: string;
  username: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  phone?: string;
  online: boolean;
  lastSeen: number;
  hidePhone?: boolean;
  hideBio?: boolean;
  hideAvatar?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  text?: string;
  type: 'text' | 'voice' | 'video' | 'image' | 'sticker';
  voiceUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  stickerEmoji?: string;
  duration?: number;
  timestamp: number;
  readAt?: number;
  editedAt?: number;
  replyToId?: string;
  forwardFromId?: string;
  pinned?: boolean;
  deleted?: boolean;
  deletedForAll?: boolean;
}

export interface Chat {
  id: string;
  type: 'private' | 'group' | 'channel' | 'saved';
  name: string;
  username?: string;
  avatar?: string;
  members: string[];
  createdBy?: string;
  description?: string;
  pinned?: boolean;
  folderId?: string;
  lastMessage?: Message;
  unread: number;
  muted?: boolean;
  wallpaper?: string;
  themeColor?: string;
}

export interface Folder {
  id: string;
  name: string;
  icon: string;
  chatIds: string[];
}

export interface Call {
  id: string;
  chatId: string;
  type: 'voice' | 'video';
  status: 'missed' | 'incoming' | 'outgoing';
  duration?: number;
  timestamp: number;
  participants: string[];
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  chats: Chat[];
  messages: Record<string, Message[]>;
  folders: Folder[];
  calls: Call[];
  theme: 'dark' | 'light';
  wallpaper: string;
  accentColor: string;
}

const DEFAULT_STATE: AppState = {
  currentUser: null,
  users: [],
  chats: [],
  messages: {},
  folders: [
    { id: 'all', name: 'Все чаты', icon: '💬', chatIds: [] },
  ],
  calls: [],
  theme: 'dark',
  wallpaper: 'default',
  accentColor: '#3b9eff',
};

const STORAGE_KEY = 'xazbikgram_v1';

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (_e) {
    // ignore storage errors
  }
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function getInitials(name: string): string {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - ts;
  if (diff < 86400000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 7 * 86400000) {
    return d.toLocaleDateString('ru', { weekday: 'short' });
  }
  return d.toLocaleDateString('ru', { day: '2-digit', month: '2-digit' });
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function getAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}