import { useState } from 'react';
import { generateId, getAvatarUrl, User } from '@/lib/store';
import Icon from '@/components/ui/icon';

interface AuthProps {
  onAuth: (user: User) => void;
  users: User[];
}

export default function Auth({ onAuth, users }: AuthProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 400);
  };

  const handleLogin = () => {
    const u = users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!u) {
      setError('Пользователь не найден');
      triggerShake();
      return;
    }
    setError('');
    onAuth({ ...u, online: true, lastSeen: Date.now() });
  };

  const handleRegister = () => {
    if (!username.trim() || username.length < 3) {
      setError('Имя пользователя минимум 3 символа');
      triggerShake();
      return;
    }
    if (!displayName.trim()) {
      setError('Введите имя');
      triggerShake();
      return;
    }
    if (users.find(u => u.username.toLowerCase() === username.trim().toLowerCase())) {
      setError('Имя пользователя уже занято');
      triggerShake();
      return;
    }
    const user: User = {
      id: generateId(),
      username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
      displayName: displayName.trim(),
      bio: bio.trim(),
      phone: phone.trim(),
      avatar: getAvatarUrl(username),
      online: true,
      lastSeen: Date.now(),
    };
    setError('');
    onAuth(user);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: '#0a0e1a', backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(59,158,255,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.12) 0%, transparent 50%)' }}>
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute w-96 h-96 rounded-full opacity-20 top-[-10%] left-[-10%]" style={{ background: 'radial-gradient(circle, #3b9eff 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute w-96 h-96 rounded-full opacity-15 bottom-[-10%] right-[-10%]" style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div className="absolute w-64 h-64 rounded-full opacity-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #14d9c5 0%, transparent 70%)', filter: 'blur(60px)' }} />
      </div>

      <div className={`relative w-full max-w-sm mx-4 animate-slide-up ${shake ? 'animate-shake' : ''}`}>
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-4 animate-glow-pulse" style={{ background: 'linear-gradient(135deg, #3b9eff, #a855f7)', boxShadow: '0 8px 32px rgba(59,158,255,0.4)' }}>
            <span className="text-3xl">✈️</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">XazbikGram</h1>
          <p className="text-white/50 text-sm mt-1">Версия 1.2.4</p>
        </div>

        {/* Card */}
        <div className="glass-strong rounded-3xl p-6" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.5)' }}>
          {/* Tabs */}
          <div className="flex rounded-2xl p-1 mb-6" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {(['login', 'register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{
                  background: mode === m ? 'linear-gradient(135deg, #3b9eff, #2563eb)' : 'transparent',
                  color: mode === m ? 'white' : 'rgba(255,255,255,0.5)',
                  boxShadow: mode === m ? '0 4px 12px rgba(59,158,255,0.3)' : 'none',
                }}
              >
                {m === 'login' ? 'Войти' : 'Регистрация'}
              </button>
            ))}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">@</span>
              <input
                className="glass-input w-full py-3 pl-8 pr-4 text-sm"
                placeholder="имя_пользователя"
                value={username}
                onChange={e => setUsername(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>

            {mode === 'register' && (
              <>
                <input
                  className="glass-input w-full py-3 px-4 text-sm animate-fade-in"
                  placeholder="Ваше имя"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                />
                <input
                  className="glass-input w-full py-3 px-4 text-sm animate-fade-in"
                  placeholder="Номер телефона (необязательно)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                />
                <input
                  className="glass-input w-full py-3 px-4 text-sm animate-fade-in"
                  placeholder="О себе (необязательно)"
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                />
              </>
            )}

            {error && (
              <p className="text-red-400 text-xs text-center animate-fade-in">{error}</p>
            )}

            <button
              onClick={mode === 'login' ? handleLogin : handleRegister}
              className="btn-primary w-full mt-2 flex items-center justify-center gap-2"
            >
              <Icon name={mode === 'login' ? 'LogIn' : 'UserPlus'} size={18} />
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </button>
          </div>
        </div>

        <p className="text-center text-white/25 text-xs mt-6">
          XazbikGram — безопасный и быстрый мессенджер
        </p>
      </div>
    </div>
  );
}
