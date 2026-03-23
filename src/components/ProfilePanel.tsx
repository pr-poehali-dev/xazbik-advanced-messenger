import { useState, useRef, useCallback } from 'react';
import { User, getAvatarUrl } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface ProfilePanelProps {
  currentUser: User;
  onSave: (updated: User) => void;
  onClose: () => void;
  onLogout: () => void;
}

const XG_LOGO =
  'https://cdn.poehali.dev/projects/7687c169-bc8e-4c9f-962b-14d548a45af5/bucket/f5ee4df8-09eb-48a2-8181-fe16d4d1c736.png';

export default function ProfilePanel({
  currentUser,
  onSave,
  onClose,
  onLogout,
}: ProfilePanelProps) {
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [bio, setBio] = useState(currentUser.bio || '');
  const [phone, setPhone] = useState(currentUser.phone || '');
  const [avatar, setAvatar] = useState(currentUser.avatar || '');
  const [hidePhone, setHidePhone] = useState(currentUser.hidePhone || false);
  const [hideBio, setHideBio] = useState(currentUser.hideBio || false);
  const [hideAvatar, setHideAvatar] = useState(currentUser.hideAvatar || false);
  const [saved, setSaved] = useState(false);

  // Avatar upload modal state
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({
      ...currentUser,
      displayName: displayName.trim() || currentUser.displayName,
      bio: bio.trim(),
      phone: phone.trim(),
      hidePhone,
      hideBio,
      hideAvatar,
      avatar: avatar || getAvatarUrl(currentUser.username),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // File reading utility
  const readFileAsDataURL = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setAvatarPreview(result);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFileAsDataURL(file);
    },
    [readFileAsDataURL]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) readFileAsDataURL(file);
    },
    [readFileAsDataURL]
  );

  const handleAvatarConfirm = () => {
    if (avatarPreview) {
      setAvatar(avatarPreview);
    }
    setAvatarPreview(null);
    setShowAvatarModal(false);
  };

  const handleAvatarCancel = () => {
    setAvatarPreview(null);
    setShowAvatarModal(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openAvatarModal = () => {
    setAvatarPreview(null);
    setShowAvatarModal(true);
  };

  // Determine what to show as avatar display
  const hasCustomAvatar =
    avatar && !avatar.includes('api.dicebear.com');

  const Toggle = ({
    value,
    onChange,
    label,
  }: {
    value: boolean;
    onChange: (v: boolean) => void;
    label: string;
  }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm text-white/70">{label}</span>
      <button
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition-all duration-200"
        style={{ background: value ? '#3b9eff' : 'rgba(255,255,255,0.15)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
          style={{
            transform: value ? 'translateX(20px)' : 'translateX(0)',
          }}
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
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
        >
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
          <div className="relative cursor-pointer" onClick={openAvatarModal}>
            {hasCustomAvatar ? (
              <div
                className="w-[90px] h-[90px] rounded-full overflow-hidden"
                style={{
                  boxShadow:
                    '0 0 0 2px #3b9eff, 0 0 16px rgba(59,158,255,0.35)',
                }}
              >
                <img
                  src={avatar}
                  alt={currentUser.displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar
                name={currentUser.displayName}
                avatar={avatar || undefined}
                size={90}
                glow
              />
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                openAvatarModal();
              }}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: '#3b9eff',
                boxShadow: '0 2px 8px rgba(59,158,255,0.4)',
              }}
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
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
            Информация
          </p>
          <div>
            <p className="text-xs text-white/40 mb-1">Имя</p>
            <input
              className="glass-input w-full py-2.5 px-3 text-sm"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ваше имя"
            />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Биография</p>
            <textarea
              className="glass-input w-full py-2.5 px-3 text-sm resize-none"
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Расскажите о себе..."
            />
          </div>
          <div>
            <p className="text-xs text-white/40 mb-1">Телефон</p>
            <input
              className="glass-input w-full py-2.5 px-3 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 ..."
            />
          </div>
        </div>

        {/* Privacy */}
        <div className="glass rounded-2xl p-4">
          <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">
            Приватность
          </p>
          <Toggle
            value={hidePhone}
            onChange={setHidePhone}
            label="Скрыть номер телефона"
          />
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.07)',
              margin: '4px 0',
            }}
          />
          <Toggle
            value={hideBio}
            onChange={setHideBio}
            label="Скрыть биографию"
          />
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.07)',
              margin: '4px 0',
            }}
          />
          <Toggle
            value={hideAvatar}
            onChange={setHideAvatar}
            label="Скрыть аватар от незнакомцев"
          />
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

      {/* ====== AVATAR UPLOAD MODAL ====== */}
      {showAvatarModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={handleAvatarCancel}
        >
          <div
            className="glass-strong rounded-3xl p-6 w-full max-w-sm mx-4 animate-scale-in"
            style={{
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-white text-lg">
                Загрузить аватар
              </h3>
              <button
                onClick={handleAvatarCancel}
                className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <Icon name="X" size={18} className="text-white/60" />
              </button>
            </div>

            {/* Drop zone / preview */}
            {avatarPreview ? (
              <div className="flex flex-col items-center gap-4">
                <div
                  className="w-[200px] h-[200px] rounded-2xl overflow-hidden"
                  style={{
                    border: '2px solid rgba(59,158,255,0.4)',
                    boxShadow: '0 8px 24px rgba(59,158,255,0.2)',
                  }}
                >
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-xs text-white/40">
                  Предварительный просмотр
                </p>
                <button
                  onClick={() => {
                    setAvatarPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Выбрать другое изображение
                </button>
              </div>
            ) : (
              <div
                className="w-[200px] h-[200px] mx-auto rounded-2xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200"
                style={{
                  border: isDragging
                    ? '2px solid #3b9eff'
                    : '2px dashed rgba(255,255,255,0.2)',
                  background: isDragging
                    ? 'rgba(59,158,255,0.1)'
                    : 'rgba(255,255,255,0.03)',
                }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center"
                  style={{
                    background: 'rgba(59,158,255,0.15)',
                  }}
                >
                  <Icon
                    name="ImagePlus"
                    size={24}
                    className="text-blue-400"
                  />
                </div>
                <p className="text-xs text-white/40 text-center px-4">
                  Загрузите изображение
                </p>
                <p className="text-[10px] text-white/25 text-center px-4">
                  Перетащите или нажмите для выбора
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleAvatarCancel}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white/70 transition-all hover:bg-white/10"
                style={{
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
              >
                Отмена
              </button>
              <button
                onClick={handleAvatarConfirm}
                className={`flex-1 btn-primary text-sm ${
                  !avatarPreview ? 'opacity-40 pointer-events-none' : ''
                }`}
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
