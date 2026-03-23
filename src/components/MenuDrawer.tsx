import { User } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface MenuDrawerProps {
  currentUser: User;
  onClose: () => void;
  onProfile: () => void;
  onNewGroup: () => void;
  onNewChannel: () => void;
  onContacts: () => void;
  onCalls: () => void;
  onSaved: () => void;
  onSettings: () => void;
  visible: boolean;
}

const items = [
  { icon: 'User', label: 'Мой профиль', key: 'profile' },
  { icon: 'Users', label: 'Создать группу', key: 'group' },
  { icon: 'Radio', label: 'Создать канал', key: 'channel' },
  { icon: 'BookUser', label: 'Контакты', key: 'contacts' },
  { icon: 'Phone', label: 'Звонки', key: 'calls' },
  { icon: 'Bookmark', label: 'Избранное', key: 'saved' },
  { icon: 'Settings', label: 'Настройки', key: 'settings' },
] as const;

type MenuKey = typeof items[number]['key'];

export default function MenuDrawer({
  currentUser, onClose, onProfile, onNewGroup, onNewChannel,
  onContacts, onCalls, onSaved, onSettings, visible
}: MenuDrawerProps) {
  const handlers: Record<MenuKey, () => void> = {
    profile: onProfile,
    group: onNewGroup,
    channel: onNewChannel,
    contacts: onContacts,
    calls: onCalls,
    saved: onSaved,
    settings: onSettings,
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40 animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col animate-sidebar-in"
        style={{
          width: 300,
          background: 'rgba(10, 14, 26, 0.92)',
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          borderRight: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '8px 0 40px rgba(0,0,0,0.6)',
        }}
      >
        {/* User header */}
        <div
          className="px-6 pt-10 pb-6"
          style={{ background: 'linear-gradient(180deg, rgba(59,158,255,0.12) 0%, transparent 100%)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Avatar name={currentUser.displayName} avatar={currentUser.avatar} size={60} online glow />
            <div>
              <p className="font-bold text-white text-base">{currentUser.displayName}</p>
              <p className="text-blue-400 text-sm">@{currentUser.username}</p>
            </div>
          </div>
        </div>

        {/* Menu items */}
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {items.map((item, i) => (
            <button
              key={item.key}
              onClick={() => { handlers[item.key](); onClose(); }}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl mb-1 transition-all duration-150 group animate-fade-in"
              style={{
                animationDelay: `${i * 40}ms`,
                color: 'rgba(255,255,255,0.85)',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(59,158,255,0.15)', border: '1px solid rgba(59,158,255,0.2)' }}
              >
                <Icon name={item.icon} size={18} className="text-blue-400" />
              </div>
              <span className="font-medium text-sm">{item.label}</span>
              <Icon name="ChevronRight" size={16} className="ml-auto text-white/25 group-hover:text-white/50 transition-colors" />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <img src="https://cdn.poehali.dev/projects/7687c169-bc8e-4c9f-962b-14d548a45af5/bucket/f5ee4df8-09eb-48a2-8181-fe16d4d1c736.png" alt="XG" className="w-8 h-8 rounded-lg object-contain" />
          <div>
            <p className="font-display font-bold text-white/70 text-sm">XazbikGram</p>
            <p className="text-white/30 text-xs">версия 1.2.4</p>
          </div>
        </div>
      </div>
    </>
  );
}