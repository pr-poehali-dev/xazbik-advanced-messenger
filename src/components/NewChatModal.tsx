import { useState } from 'react';
import { User, Chat, generateId, getAvatarUrl } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface NewChatModalProps {
  mode: 'chat' | 'group' | 'channel';
  users: User[];
  currentUser: User;
  onCreateChat: (chat: Chat) => void;
  onClose: () => void;
}

export default function NewChatModal({ mode, users, currentUser, onCreateChat, onClose }: NewChatModalProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [step, setStep] = useState<'select' | 'info'>('select');

  const filtered = users.filter(u =>
    u.id !== currentUser.id &&
    (u.username.toLowerCase().includes(query.toLowerCase()) ||
      u.displayName.toLowerCase().includes(query.toLowerCase()))
  );

  const handleSelectUser = (userId: string) => {
    if (mode === 'chat') {
      const user = users.find(u => u.id === userId)!;
      const chat: Chat = {
        id: generateId(),
        type: 'private',
        name: user.displayName,
        members: [currentUser.id, userId],
        unread: 0,
        lastMessage: undefined,
      };
      onCreateChat(chat);
      return;
    }
    setSelected(prev => prev.includes(userId)
      ? prev.filter(id => id !== userId)
      : [...prev, userId]
    );
  };

  const handleCreate = () => {
    if (mode === 'group' || mode === 'channel') {
      if (step === 'select' && selected.length > 0) {
        setStep('info');
        return;
      }
      const chat: Chat = {
        id: generateId(),
        type: mode,
        name: groupName.trim() || (mode === 'group' ? 'Новая группа' : 'Новый канал'),
        username: groupName.trim().toLowerCase().replace(/\s+/g, '_'),
        description: groupDesc.trim(),
        members: [currentUser.id, ...selected],
        createdBy: currentUser.id,
        unread: 0,
        avatar: getAvatarUrl(groupName || 'group'),
      };
      onCreateChat(chat);
    }
  };

  const titles = { chat: 'Новый чат', group: 'Создать группу', channel: 'Создать канал' };
  const icons = { chat: 'MessageCircle', group: 'Users', channel: 'Radio' };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fade-in"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl sm:rounded-3xl animate-slide-up overflow-hidden"
        style={{
          background: 'rgba(12,17,35,0.97)',
          backdropFilter: 'blur(40px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 -24px 64px rgba(0,0,0,0.7)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4">
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
            <Icon name="X" size={18} className="text-white/70" />
          </button>
          <div className="flex items-center gap-2 flex-1">
            <Icon name={icons[mode]} size={18} className="text-blue-400" />
            <h3 className="font-semibold text-white">{titles[mode]}</h3>
          </div>
          {(mode !== 'chat') && selected.length > 0 && (
            <button
              onClick={handleCreate}
              className="px-4 py-1.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: '#3b9eff' }}
            >
              {step === 'select' ? 'Далее' : 'Создать'}
            </button>
          )}
        </div>

        {step === 'info' ? (
          <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
            <div className="flex justify-center py-4">
              <div
                className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                style={{ background: 'rgba(59,158,255,0.15)', border: '2px dashed rgba(59,158,255,0.3)' }}
              >
                {mode === 'channel' ? '📢' : '👥'}
              </div>
            </div>
            <input
              className="glass-input w-full py-3 px-4 text-sm"
              placeholder={mode === 'group' ? 'Название группы' : 'Название канала'}
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
            <textarea
              className="glass-input w-full py-3 px-4 text-sm resize-none"
              rows={3}
              placeholder="Описание (необязательно)"
              value={groupDesc}
              onChange={e => setGroupDesc(e.target.value)}
            />
            <p className="text-xs text-white/30">{selected.length} участников выбрано</p>
            <button
              onClick={handleCreate}
              className="btn-primary w-full"
              disabled={!groupName.trim()}
            >
              Создать
            </button>
          </div>
        ) : (
          <>
            <div className="px-5 pb-3">
              <div className="relative">
                <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  autoFocus
                  className="glass-input w-full py-2.5 pl-9 pr-3 text-sm"
                  placeholder="Поиск пользователей..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Selected chips */}
            {selected.length > 0 && (
              <div className="flex gap-2 px-5 pb-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {selected.map(id => {
                  const u = users.find(u => u.id === id)!;
                  return (
                    <button
                      key={id}
                      onClick={() => setSelected(prev => prev.filter(s => s !== id))}
                      className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1 rounded-full text-xs animate-scale-in"
                      style={{ background: 'rgba(59,158,255,0.2)', border: '1px solid rgba(59,158,255,0.3)', color: '#3b9eff' }}
                    >
                      <Avatar name={u.displayName} size={18} />
                      {u.displayName}
                      <Icon name="X" size={10} />
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-3 pb-4">
              {filtered.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Avatar name={user.displayName} avatar={user.avatar} size={44} online={user.online} />
                  <div className="text-left flex-1">
                    <p className="font-semibold text-white text-sm">{user.displayName}</p>
                    <p className="text-white/40 text-xs">@{user.username}</p>
                  </div>
                  {mode !== 'chat' && (
                    <div
                      className="w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                      style={{
                        borderColor: selected.includes(user.id) ? '#3b9eff' : 'rgba(255,255,255,0.2)',
                        background: selected.includes(user.id) ? '#3b9eff' : 'transparent',
                      }}
                    >
                      {selected.includes(user.id) && <Icon name="Check" size={12} className="text-white" />}
                    </div>
                  )}
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-white/25 gap-3">
                  <Icon name="Users" size={36} />
                  <p className="text-sm">Нет пользователей</p>
                  <p className="text-xs text-center">Зарегистрируйтесь с другого аккаунта,<br />чтобы начать общение</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
