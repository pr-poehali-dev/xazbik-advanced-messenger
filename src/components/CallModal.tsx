import { useState, useEffect } from 'react';
import { User, formatDuration } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface CallModalProps {
  callType: 'voice' | 'video';
  caller: User;
  callee: User;
  onEnd: () => void;
}

export default function CallModal({ callType, caller, callee, onEnd }: CallModalProps) {
  const [status, setStatus] = useState<'calling' | 'connected'>('calling');
  const [duration, setDuration] = useState(0);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(callType === 'video');

  useEffect(() => {
    const timer = setTimeout(() => setStatus('connected'), 2000 + Math.random() * 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (status !== 'connected') return;
    const interval = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-between py-16 px-6 animate-fade-in"
      style={{
        background: 'linear-gradient(180deg, rgba(10,14,26,0.97) 0%, rgba(20,30,60,0.97) 100%)',
        backdropFilter: 'blur(40px)',
      }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-80 h-80 rounded-full top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow-pulse"
          style={{ background: 'radial-gradient(circle, rgba(59,158,255,0.3) 0%, transparent 70%)', filter: 'blur(40px)' }}
        />
      </div>

      {/* Top info */}
      <div className="text-center animate-slide-up">
        <div className="relative inline-block mb-6">
          <Avatar name={callee.displayName} avatar={callee.avatar} size={100} glow />
          {callType === 'video' && cameraOn && (
            <div className="absolute inset-0 rounded-full overflow-hidden bg-gray-800 flex items-center justify-center">
              <Icon name="Video" size={32} className="text-white/40" />
            </div>
          )}
        </div>
        <h2 className="font-bold text-white text-2xl">{callee.displayName}</h2>
        <p className="text-white/50 mt-1 text-sm">@{callee.username}</p>
        <p
          className="mt-3 text-sm font-medium animate-fade-in"
          style={{ color: status === 'connected' ? '#22c55e' : 'rgba(255,255,255,0.5)' }}
        >
          {status === 'calling'
            ? (callType === 'video' ? '📹 Видеозвонок...' : '📞 Вызов...')
            : formatDuration(duration)}
        </p>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs animate-slide-up" style={{ animationDelay: '100ms' }}>
        <div className="flex justify-center gap-6 mb-8">
          <button
            onClick={() => setMuted(!muted)}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95"
              style={{
                background: muted ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${muted ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
              }}
            >
              <Icon name={muted ? 'MicOff' : 'Mic'} size={22} className={muted ? 'text-red-400' : 'text-white'} />
            </div>
            <span className="text-xs text-white/40">{muted ? 'Вкл. звук' : 'Выкл. звук'}</span>
          </button>

          {callType === 'video' && (
            <button onClick={() => setCameraOn(!cameraOn)} className="flex flex-col items-center gap-2 group">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95"
                style={{
                  background: !cameraOn ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${!cameraOn ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.15)'}`,
                }}
              >
                <Icon name={cameraOn ? 'Video' : 'VideoOff'} size={22} className={!cameraOn ? 'text-red-400' : 'text-white'} />
              </div>
              <span className="text-xs text-white/40">Камера</span>
            </button>
          )}

          <button onClick={() => setSpeakerOn(!speakerOn)} className="flex flex-col items-center gap-2 group">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95"
              style={{
                background: speakerOn ? 'rgba(59,158,255,0.2)' : 'rgba(255,255,255,0.1)',
                border: `1px solid ${speakerOn ? 'rgba(59,158,255,0.3)' : 'rgba(255,255,255,0.15)'}`,
              }}
            >
              <Icon name={speakerOn ? 'Volume2' : 'VolumeX'} size={22} className={speakerOn ? 'text-blue-400' : 'text-white'} />
            </div>
            <span className="text-xs text-white/40">Динамик</span>
          </button>
        </div>

        {/* End call */}
        <div className="flex justify-center">
          <button
            onClick={onEnd}
            className="flex flex-col items-center gap-2 group"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center transition-all group-hover:scale-105 group-active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 8px 24px rgba(239,68,68,0.4)',
              }}
            >
              <Icon name="PhoneOff" size={26} className="text-white" />
            </div>
            <span className="text-xs text-white/40">Завершить</span>
          </button>
        </div>
      </div>
    </div>
  );
}
