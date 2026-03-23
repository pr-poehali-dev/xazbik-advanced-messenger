import { useState } from 'react';
import { User, Chat, Folder, formatTime } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface SidebarProps {
  currentUser: User;
  chats: Chat[];
  users: User[];
  folders: Folder[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onOpenMenu: () => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onNewChannel: () => void;
  onOpenProfile: () => void;
  onOpenSearch: () => void;
}

export default function Sidebar({
  currentUser, chats, users, folders, activeChatId,
  onSelectChat, onOpenMenu, onNewChat, onNewGroup, onNewChannel, onOpenProfile, onOpenSearch
}: SidebarProps) {
  const [activeFolder, setActiveFolder] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getUserById = (id: string) => users.find(u => u.id === id);

  const getChatName = (chat: Chat) => {
    if (chat.type === 'private') {
      const other = chat.members.find(m => m !== currentUser.id);
      const u = other ? getUserById(other) : null;
      return u?.displayName || chat.name;
    }
    return chat.name;
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'private') {
      const other = chat.members.find(m => m !== currentUser.id);
      const u = other ? getUserById(other) : null;
      return u?.avatar;
    }
    return chat.avatar;
  };

  const getChatOnline = (chat: Chat) => {
    if (chat.type === 'private') {
      const other = chat.members.find(m => m !== currentUser.id);
      const u = other ? getUserById(other) : null;
      return u?.online || false;
    }
    return false;
  };

  const filteredChats = chats.filter(c => {
    const name = getChatName(c).toLowerCase();
    const q = searchQuery.toLowerCase();
    if (q && !name.includes(q)) return false;
    if (activeFolder === 'all') return true;
    const folder = folders.find(f => f.id === activeFolder);
    return folder?.chatIds.includes(c.id) ?? false;
  });

  const sortedChats = [...filteredChats].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    const aTime = a.lastMessage?.timestamp || 0;
    const bTime = b.lastMessage?.timestamp || 0;
    return bTime - aTime;
  });

  return (
    <div className="flex flex-col h-full glass-panel border-r" style={{ borderColor: 'var(--glass-border)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-5 pb-3">
        <button
          onClick={onOpenMenu}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: 'var(--glass-bg-strong)', border: '1px solid var(--glass-border)' }}
        >
          <Icon name="Menu" size={20} className="text-white/80" />
        </button>
        <div className="flex-1 relative">
          <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            className="glass-input w-full py-2.5 pl-9 pr-3 text-sm"
            placeholder="Поиск"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onClick={onOpenSearch}
          />
        </div>
        <button
          onClick={onNewChat}
          className="w-10 h-10 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b9eff, #2563eb)', boxShadow: '0 4px 12px rgba(59,158,255,0.35)' }}
        >
          <Icon name="PenSquare" size={18} className="text-white" />
        </button>
      </div>

      {/* Folders */}
      {folders.length > 1 && (
        <div className="flex gap-2 px-4 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {folders.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFolder(f.id)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: activeFolder === f.id ? 'linear-gradient(135deg, #3b9eff, #2563eb)' : 'var(--glass-bg)',
                color: activeFolder === f.id ? 'white' : 'rgba(255,255,255,0.5)',
                border: `1px solid ${activeFolder === f.id ? 'transparent' : 'var(--glass-border)'}`,
              }}
            >
              <span>{f.icon}</span>
              <span>{f.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto px-2">
        {sortedChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3 py-12">
            <div className="text-5xl">💬</div>
            <p className="text-sm">Нет чатов</p>
            <button onClick={onNewChat} className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
              Найти людей →
            </button>
          </div>
        ) : (
          sortedChats.map((chat, i) => {
            const name = getChatName(chat);
            const avatar = getChatAvatar(chat);
            const isOnline = getChatOnline(chat);
            const isActive = chat.id === activeChatId;
            const lastMsg = chat.lastMessage;

            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 mb-0.5 animate-fade-in group`}
                style={{
                  animationDelay: `${i * 30}ms`,
                  background: isActive ? 'rgba(59,158,255,0.15)' : 'transparent',
                  border: isActive ? '1px solid rgba(59,158,255,0.25)' : '1px solid transparent',
                }}
                onMouseEnter={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)';
                }}
                onMouseLeave={e => {
                  if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                <div className="relative">
                  <Avatar name={name} avatar={avatar} size={50} online={isOnline} />
                  {chat.pinned && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: '#3b9eff' }}>
                      <Icon name="Pin" size={8} className="text-white" />
                    </div>
                  )}
                  {chat.type === 'channel' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#a855f7' }}>
                      <span className="text-[8px]">📢</span>
                    </div>
                  )}
                  {chat.type === 'group' && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#14d9c5' }}>
                      <span className="text-[8px]">👥</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-semibold text-white text-sm truncate">{name}</span>
                    <span className="text-xs ml-2 flex-shrink-0" style={{ color: chat.unread > 0 ? '#3b9eff' : 'rgba(255,255,255,0.35)' }}>
                      {lastMsg ? formatTime(lastMsg.timestamp) : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.45)' }}>
                      {lastMsg?.deleted ? <span className="italic">Сообщение удалено</span>
                        : lastMsg?.type === 'voice' ? '🎤 Голосовое'
                        : lastMsg?.type === 'video' ? '📹 Видео'
                        : lastMsg?.text || 'Нет сообщений'}
                    </p>
                    {chat.unread > 0 && (
                      <span className={`unread-badge ml-2 flex-shrink-0 ${chat.muted ? 'opacity-50' : ''}`}>
                        {chat.unread > 99 ? '99+' : chat.unread}
                      </span>
                    )}
                    {chat.muted && chat.unread === 0 && (
                      <Icon name="BellOff" size={12} className="ml-2 flex-shrink-0 text-white/30" />
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
