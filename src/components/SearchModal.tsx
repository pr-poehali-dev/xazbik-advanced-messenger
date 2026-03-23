import { useState } from 'react';
import { User, Chat, getAvatarUrl } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface SearchModalProps {
  users: User[];
  chats: Chat[];
  currentUser: User;
  onSelectUser: (user: User) => void;
  onSelectChat: (chatId: string) => void;
  onClose: () => void;
}

export default function SearchModal({ users, chats, currentUser, onSelectUser, onSelectChat, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');

  const q = query.toLowerCase().trim();

  const filteredUsers = q
    ? users.filter(u =>
        u.id !== currentUser.id &&
        (u.username.includes(q) || u.displayName.toLowerCase().includes(q))
      )
    : [];

  const filteredChats = q
    ? chats.filter(c =>
        c.type !== 'private' &&
        (c.name.toLowerCase().includes(q) || (c.username || '').includes(q))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden animate-slide-up"
        style={{
          background: 'rgba(12,17,35,0.97)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 p-4">
          <Icon name="Search" size={18} className="text-white/40 flex-shrink-0" />
          <input
            autoFocus
            className="flex-1 bg-transparent text-white text-base outline-none placeholder-white/30"
            placeholder="Поиск по имени или @username..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <Icon name="X" size={16} className="text-white/40 hover:text-white/70" />
            </button>
          )}
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-2">
          {!q && (
            <div className="flex flex-col items-center justify-center py-12 text-white/25 gap-3">
              <Icon name="Search" size={40} />
              <p className="text-sm">Введите имя или @юзернейм</p>
            </div>
          )}

          {q && filteredUsers.length === 0 && filteredChats.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-white/25 gap-3">
              <Icon name="SearchX" size={40} />
              <p className="text-sm">Ничего не найдено</p>
            </div>
          )}

          {filteredUsers.length > 0 && (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider px-3 py-2">Люди</p>
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => onSelectUser(user)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Avatar name={user.displayName} avatar={user.avatar} size={44} online={user.online} />
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">{user.displayName}</p>
                    <p className="text-blue-400 text-xs">@{user.username}</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="ml-auto text-white/25" />
                </button>
              ))}
            </>
          )}

          {filteredChats.length > 0 && (
            <>
              <p className="text-xs text-white/30 uppercase tracking-wider px-3 py-2 mt-2">Группы и каналы</p>
              {filteredChats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: chat.type === 'channel' ? 'rgba(168,85,247,0.2)' : 'rgba(20,217,197,0.2)' }}
                  >
                    {chat.type === 'channel' ? '📢' : '👥'}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white text-sm">{chat.name}</p>
                    <p className="text-white/40 text-xs">{chat.members.length} участников</p>
                  </div>
                  <Icon name="ChevronRight" size={16} className="ml-auto text-white/25" />
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
