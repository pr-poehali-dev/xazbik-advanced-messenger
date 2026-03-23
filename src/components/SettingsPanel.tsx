import { useState } from 'react';
import Icon from '@/components/ui/icon';

interface SettingsPanelProps {
  accentColor: string;
  wallpaper: string;
  onChangeAccent: (color: string) => void;
  onChangeWallpaper: (wp: string) => void;
  onClose: () => void;
}

const ACCENT_COLORS = [
  { label: 'Синий', value: '#3b9eff' },
  { label: 'Фиолетовый', value: '#a855f7' },
  { label: 'Бирюзовый', value: '#14d9c5' },
  { label: 'Розовый', value: '#ec4899' },
  { label: 'Оранжевый', value: '#f97316' },
  { label: 'Зелёный', value: '#22c55e' },
];

const WALLPAPERS = [
  { label: 'По умолчанию', value: 'default', preview: 'linear-gradient(135deg, #0a0e1a, #0d1530)' },
  { label: 'Рассвет', value: 'dawn', preview: 'linear-gradient(135deg, #1a0a2e, #2d1b69, #0a0e1a)' },
  { label: 'Океан', value: 'ocean', preview: 'linear-gradient(135deg, #0a1628, #0c3b6e, #0a2040)' },
  { label: 'Закат', value: 'sunset', preview: 'linear-gradient(135deg, #1a0a0a, #6b1a1a, #1a0a2e)' },
  { label: 'Лес', value: 'forest', preview: 'linear-gradient(135deg, #0a1a0a, #0d3b1a, #0a1a0a)' },
  { label: 'Северное сияние', value: 'aurora', preview: 'linear-gradient(135deg, #0a1a1a, #0a2d1a, #1a0a2e)' },
];

const WALLPAPER_BG: Record<string, string> = {
  default: '',
  dawn: 'linear-gradient(180deg, #1a0a2e 0%, #2d1b69 50%, #0a0e1a 100%)',
  ocean: 'linear-gradient(180deg, #0a1628 0%, #0c3b6e 50%, #0a2040 100%)',
  sunset: 'linear-gradient(180deg, #1a0a0a 0%, #6b1a1a 50%, #1a0a2e 100%)',
  forest: 'linear-gradient(180deg, #0a1a0a 0%, #0d3b1a 50%, #0a1a0a 100%)',
  aurora: 'linear-gradient(180deg, #0a1a1a 0%, #0a2d1a 50%, #1a0a2e 100%)',
};

export { WALLPAPER_BG };

export default function SettingsPanel({ accentColor, wallpaper, onChangeAccent, onChangeWallpaper, onClose }: SettingsPanelProps) {
  const [tab, setTab] = useState<'appearance' | 'notifications' | 'privacy'>('appearance');

  const [notifMessages, setNotifMessages] = useState(true);
  const [notifSound, setNotifSound] = useState(true);
  const [notifCalls, setNotifCalls] = useState(true);
  const [notifGroups, setNotifGroups] = useState(false);

  const [privLastSeen, setPrivLastSeen] = useState(true);
  const [privOnline, setPrivOnline] = useState(true);
  const [privForward, setPrivForward] = useState(true);
  const [privRead, setPrivRead] = useState(true);

  return (
    <div className="flex flex-col h-full animate-slide-in-right">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white/10 transition-all">
          <Icon name="ArrowLeft" size={20} className="text-white/80" />
        </button>
        <h2 className="font-semibold text-white">Настройки</h2>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-3">
        {([
          { id: 'appearance', label: 'Вид', icon: 'Palette' },
          { id: 'notifications', label: 'Уведомления', icon: 'Bell' },
          { id: 'privacy', label: 'Приватность', icon: 'Shield' },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-all"
            style={{
              background: tab === t.id ? 'rgba(59,158,255,0.2)' : 'transparent',
              color: tab === t.id ? '#3b9eff' : 'rgba(255,255,255,0.4)',
              border: tab === t.id ? '1px solid rgba(59,158,255,0.3)' : '1px solid transparent',
            }}
          >
            <Icon name={t.icon} size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-5">
        {tab === 'appearance' && (
          <>
            {/* Accent color */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-4">Акцентный цвет</p>
              <div className="grid grid-cols-3 gap-2">
                {ACCENT_COLORS.map(c => (
                  <button
                    key={c.value}
                    onClick={() => onChangeAccent(c.value)}
                    className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all"
                    style={{
                      background: accentColor === c.value ? 'rgba(255,255,255,0.08)' : 'transparent',
                      border: accentColor === c.value ? `1px solid ${c.value}55` : '1px solid transparent',
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-full transition-all"
                      style={{
                        background: c.value,
                        boxShadow: accentColor === c.value ? `0 4px 12px ${c.value}66` : 'none',
                        transform: accentColor === c.value ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {accentColor === c.value && (
                        <div className="w-full h-full rounded-full flex items-center justify-center">
                          <Icon name="Check" size={16} className="text-white" />
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-white/60">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Wallpaper */}
            <div className="glass rounded-2xl p-4">
              <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-4">Фон мессенджера</p>
              <div className="grid grid-cols-3 gap-2">
                {WALLPAPERS.map(wp => (
                  <button
                    key={wp.value}
                    onClick={() => onChangeWallpaper(wp.value)}
                    className="flex flex-col items-center gap-2 rounded-xl overflow-hidden transition-all"
                    style={{
                      border: wallpaper === wp.value ? `2px solid ${accentColor}` : '2px solid transparent',
                    }}
                  >
                    <div
                      className="w-full h-16 rounded-xl"
                      style={{ background: wp.preview }}
                    />
                    <span className="text-xs text-white/60 pb-1">{wp.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {tab === 'notifications' && (
          <div className="glass rounded-2xl p-4 space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Уведомления</p>
            {([
              { label: 'Уведомления о сообщениях', on: notifMessages, set: setNotifMessages },
              { label: 'Звук уведомлений', on: notifSound, set: setNotifSound },
              { label: 'Уведомления о звонках', on: notifCalls, set: setNotifCalls },
              { label: 'Уведомления групп', on: notifGroups, set: setNotifGroups },
            ] as const).map(item => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm text-white/80">{item.label}</span>
                <button
                  onClick={() => item.set(!item.on)}
                  className="relative w-11 h-6 rounded-full transition-all duration-200"
                  style={{ background: item.on ? accentColor : 'rgba(255,255,255,0.15)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
                    style={{ transform: item.on ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'privacy' && (
          <div className="glass rounded-2xl p-4 space-y-1">
            <p className="text-xs text-white/40 uppercase tracking-wider font-semibold mb-3">Конфиденциальность</p>
            {([
              { label: 'Показывать время последнего визита', on: privLastSeen, set: setPrivLastSeen },
              { label: 'Показывать статус "в сети"', on: privOnline, set: setPrivOnline },
              { label: 'Разрешить пересылку сообщений', on: privForward, set: setPrivForward },
              { label: 'Показывать прочитанность', on: privRead, set: setPrivRead },
            ] as const).map(item => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-sm text-white/80">{item.label}</span>
                <button
                  onClick={() => item.set(!item.on)}
                  className="relative w-11 h-6 rounded-full transition-all duration-200"
                  style={{ background: item.on ? accentColor : 'rgba(255,255,255,0.15)' }}
                >
                  <span
                    className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-all duration-200"
                    style={{ transform: item.on ? 'translateX(20px)' : 'translateX(0)' }}
                  />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}