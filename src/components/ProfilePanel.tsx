import { useState } from 'react';
import { User, getAvatarUrl } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface ProfilePanelProps {
  currentUser: User;
  onSave: (updated: User) => void;
  onClose: () => void;
  onLogout: () => void;
}

export default function ProfilePanel({ currentUser, onSave, onClose, onLogout }: ProfilePanelProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [hidePhone, setHidePhone] = useState(currentUser.hidePhone || false);
  const [hideBio, setHideBio] = useState(currentUser.hideBio || false);
  const [hideAvatar, setHideAvatar] = useState(currentUser.hideAvatar || false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    onSave({
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      phone: phone.trim(),
      hidePhone,
      hideBio,
      hideAvatar,
      avatar: getAvatarUrl(currentUser.username),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/70">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all duration-200"
        style={{ background: value ? '#3b9eff' : 'rgba(255,255,255,0.15)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
          style={{ transform: value ? 'translateX(20px)' : 'translateX(0)' }}
        />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-4"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
          <Icon name="ArrowLeft" size={20} className="text-white/80" />
        </button>
        <h2 className="font-semibold text-white">Редактирование профиля</h2>
        <button
          onClick={handleSave}
          className="ml-auto text-sm font-semibold transition-all"
          style={{ color: saved ? '#22c55e' : '#3b9eff' }}
        >
          {saved ? '✓ Сохранено' : 'Сохранить'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <Avatar name={currentUser.displayName} avatar={currentUser.avatar} size={90} glow />
            <button
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: '#3b9eff', boxShadow: '0 2px 8px rgba(59,158,255,0.4)' }}
            >
              <Icon name="Camera" size={14} className="text-white" />
            </button>
          </div>
          <div className="text-center">
            <p className="font-bold text-white">{currentUser.displayName}</p>
            <p className="text-blue-400 text-sm">@{currentUser.username}</p>
          </div>
        </div>

        {/* Info fields */}
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Информация</p>
          <div>
            <p className="text-xs text-white/40 mb-1">Имя</p>
            <input
              className="glass-input w-full py-2.5 px-3 text-sm"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Биография</p>
            <textarea
              className="glass-input w-full py-2.5 px-3 text-sm resize-none"
              rows={3}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
            />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Телефон</p>
            <input
              className="glass-input w-full py-2.5 px-3 text-sm"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+7 ..."
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Приватность</p>
          <Toggle value={hidePhone} onChange={setHidePhone} label="Скрыть номер телефона" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
          <Toggle value={hideBio} onChange={setHideBio} label="Скрыть биографию" />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
          <Toggle value={hideAvatar} onChange={setHideAvatar} label="Скрыть аватар от незнакомцев" />
        </div>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full py-3 rounded-2xl text-sm font-semibold text-red-400 transition-all hover:bg-red-500/10"
          style={{ border: '1px solid rgba(239,68,68,0.2)' }}
        >
          Выйти из аккаунта
        </button>
      </div>
    </div>
  );
}
