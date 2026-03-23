import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Chat, Message, generateId, formatTime, formatDuration } from '@/lib/store';
import Avatar from './Avatar';
import Icon from '@/components/ui/icon';

interface ChatWindowProps {
  chat: Chat;
  currentUser: User;
  users: User[];
  messages: Message[];
  onSendMessage: (msg: Omit<Message, 'id' | 'timestamp'>) => void;
  onDeleteMessage: (msgId: string, forAll: boolean) => void;
  onEditMessage: (msgId: string, text: string) => void;
  onPinMessage: (msgId: string) => void;
  onBack: () => void;
  onCallVoice: () => void;
  onCallVideo: () => void;
  onChatInfo: () => void;
}

interface ContextMenuState {
  x: number; y: number;
  msg: Message | null;
}

export default function ChatWindow({
  chat, currentUser, users, messages,
  onSendMessage, onDeleteMessage, onEditMessage, onPinMessage,
  onBack, onCallVoice, onCallVideo, onChatInfo
}: ChatWindowProps) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({ x: 0, y: 0, msg: null });
  const [isRecording, setIsRecording] = useState(false);
  const [recordLocked, setRecordLocked] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [showVoiceHint, setShowVoiceHint] = useState(false);
  const [micMode, setMicMode] = useState<'voice' | 'video'>('voice');
  const [showMicOptions, setShowMicOptions] = useState(false);
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [typingEffect, setTypingEffect] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const holdStartRef = useRef<number>(0);
  const holdYRef = useRef<number>(0);
  const lockRef = useRef(false);

  const getUserById = (id: string) => users.find(u => u.id === id);

  const getChatPartner = () => {
    if (chat.type === 'private') {
      const other = chat.members.find(m => m !== currentUser.id);
      return other ? getUserById(other) : null;
    }
    return null;
  };

  const partner = getChatPartner();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    const pinned = messages.find(m => m.pinned && !m.deleted);
    setPinnedMsg(pinned || null);
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    messages.forEach(msg => {
      if (msg.senderId !== currentUser.id && !msg.readAt) {
        msg.readAt = Date.now();
      }
    });
  }, [messages, currentUser.id]);

  const handleSend = () => {
    const t = text.trim();
    if (!t) return;
    if (editingId) {
      onEditMessage(editingId, t);
      setEditingId(null);
    } else {
      onSendMessage({
        chatId: chat.id,
        senderId: currentUser.id,
        text: t,
        type: 'text',
        replyToId: replyTo?.id,
      });
    }
    setText('');
    setReplyTo(null);

    // Simulate typing reply after 1-2s for demo
    if (partner && chat.type === 'private') {
      setTypingEffect(true);
      setTimeout(() => setTypingEffect(false), 2000 + Math.random() * 2000);
    }
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: micMode === 'video' });
      const mr = new MediaRecorder(stream);
      recordChunksRef.current = [];
      mr.ondataavailable = e => recordChunksRef.current.push(e.data);
      mr.start(100);
      mediaRecorderRef.current = mr;
      setIsRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds(s => s + 1), 1000);
    } catch {
      alert('Нет доступа к микрофону');
    }
  }, [micMode]);

  const stopRecording = useCallback((send: boolean) => {
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.onstop = () => {
      if (send) {
        const blob = new Blob(recordChunksRef.current, { type: micMode === 'video' ? 'video/webm' : 'audio/webm' });
        const url = URL.createObjectURL(blob);
        onSendMessage({
          chatId: chat.id,
          senderId: currentUser.id,
          type: micMode === 'video' ? 'video' : 'voice',
          voiceUrl: micMode === 'voice' ? url : undefined,
          videoUrl: micMode === 'video' ? url : undefined,
          duration: recordSeconds,
        });
      }
      mr.stream.getTracks().forEach(t => t.stop());
      mediaRecorderRef.current = null;
    };
    mr.stop();
    setIsRecording(false);
    setRecordLocked(false);
    lockRef.current = false;
    setRecordSeconds(0);
  }, [chat.id, currentUser.id, micMode, onSendMessage, recordSeconds]);

  const handleMicPointerDown = (e: React.PointerEvent) => {
    holdStartRef.current = Date.now();
    holdYRef.current = e.clientY;
    lockRef.current = false;
    const timer = setTimeout(() => {
      startRecording();
    }, 150);
    (e.currentTarget as HTMLElement).dataset.holdTimer = String(timer as unknown as number);
  };

  const handleMicPointerMove = (e: React.PointerEvent) => {
    if (!isRecording || lockRef.current) return;
    const deltaY = holdYRef.current - e.clientY;
    if (deltaY > 60) {
      lockRef.current = true;
      setRecordLocked(true);
    }
  };

  const handleMicPointerUp = () => {
    if (!isRecording) {
      if (!recordLocked) {
        setShowMicOptions(v => !v);
      }
      return;
    }
    if (!lockRef.current) {
      stopRecording(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const closeContextMenu = () => setContextMenu({ x: 0, y: 0, msg: null });

  const handleCopy = () => {
    if (contextMenu.msg?.text) navigator.clipboard.writeText(contextMenu.msg.text);
    closeContextMenu();
  };

  const handleReply = () => {
    setReplyTo(contextMenu.msg);
    closeContextMenu();
    inputRef.current?.focus();
  };

  const handleEdit = () => {
    const msg = contextMenu.msg;
    if (!msg?.text) return;
    setText(msg.text);
    setEditingId(msg.id);
    closeContextMenu();
    inputRef.current?.focus();
  };

  const handleForward = () => {
    closeContextMenu();
  };

  const handlePin = () => {
    if (contextMenu.msg) onPinMessage(contextMenu.msg.id);
    closeContextMenu();
  };

  const handleSelect = () => {
    const id = contextMenu.msg?.id;
    if (!id) return;
    setSelectedMsgs(prev => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    closeContextMenu();
  };

  const handleDelete = (forAll: boolean) => {
    if (contextMenu.msg) onDeleteMessage(contextMenu.msg.id, forAll);
    closeContextMenu();
  };

  const isMe = (msg: Message) => msg.senderId === currentUser.id;

  const getReplyMsg = (id: string) => messages.find(m => m.id === id);

  const renderMessageContent = (msg: Message) => {
    if (msg.deleted) {
      return <span className="italic text-white/30 text-sm">Сообщение удалено</span>;
    }
    if (msg.type === 'voice') {
      return (
        <div className="flex items-center gap-3 min-w-[160px]">
          <button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(59,158,255,0.3)' }}>
            <Icon name="Play" size={16} className="text-white" />
          </button>
          <div className="flex-1">
            <div className="flex gap-0.5 items-end h-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div key={i} className="voice-bar" style={{ height: `${Math.random() * 16 + 4}px`, animationDelay: `${i * 40}ms` }} />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-1">{formatDuration(msg.duration || 0)}</p>
          </div>
          <Icon name="Mic" size={14} className="text-white/40" />
        </div>
      );
    }
    if (msg.type === 'video') {
      return (
        <div className="relative rounded-xl overflow-hidden" style={{ width: 200, height: 200 }}>
          <video src={msg.videoUrl} className="w-full h-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.3)' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
              <Icon name="Play" size={20} className="text-white" />
            </div>
          </div>
          <p className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded-full">{formatDuration(msg.duration || 0)}</p>
        </div>
      );
    }
    if (msg.type === 'sticker') {
      return <span className="text-5xl">{msg.stickerEmoji}</span>;
    }
    return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>;
  };

  return (
    <div className="flex flex-col h-full relative" onClick={closeContextMenu}>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button onClick={onBack} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 md:hidden">
          <Icon name="ArrowLeft" size={20} className="text-white/80" />
        </button>

        <button onClick={onChatInfo} className="flex items-center gap-3 flex-1 min-w-0">
          <Avatar
            name={partner?.displayName || chat.name}
            avatar={partner?.avatar || chat.avatar}
            size={40}
            online={partner?.online}
          />
          <div className="min-w-0">
            <p className="font-semibold text-white text-sm truncate">{partner?.displayName || chat.name}</p>
            <p className="text-xs" style={{ color: partner?.online ? '#22c55e' : 'rgba(255,255,255,0.4)' }}>
              {typingEffect ? (
                <span className="flex items-center gap-1">
                  <span>печатает</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map(i => (
                      <span key={i} className="inline-block w-1 h-1 rounded-full bg-green-400 animate-typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                    ))}
                  </span>
                </span>
              ) : partner?.online ? 'в сети' : 'был(а) недавно'}
            </p>
          </div>
        </button>

        <div className="flex gap-1">
          <button onClick={onCallVoice} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90">
            <Icon name="Phone" size={18} className="text-white/80" />
          </button>
          <button onClick={onCallVideo} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90">
            <Icon name="Video" size={18} className="text-white/80" />
          </button>
          <button onClick={onChatInfo} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90">
            <Icon name="MoreVertical" size={18} className="text-white/80" />
          </button>
        </div>
      </div>

      {/* Pinned message */}
      {pinnedMsg && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-fade-in cursor-pointer"
          style={{ background: 'rgba(59,158,255,0.1)', borderBottom: '1px solid rgba(59,158,255,0.15)' }}
          onClick={() => {}}
        >
          <Icon name="Pin" size={14} className="text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-blue-400 font-medium">Закреплённое сообщение</p>
            <p className="text-xs text-white/60 truncate">{pinnedMsg.text}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{ background: chat.wallpaper ? `url(${chat.wallpaper}) center/cover` : undefined }}
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
            <div className="text-5xl">👋</div>
            <p className="text-sm">Начните общение!</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const mine = isMe(msg);
          const replyMsg = msg.replyToId ? getReplyMsg(msg.replyToId) : null;
          const sender = getUserById(msg.senderId);
          const showAvatar = !mine && (i === 0 || messages[i - 1].senderId !== msg.senderId);
          const isSelected = selectedMsgs.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} animate-msg-${mine ? 'out' : 'in'} group`}
              style={{ animationDelay: '0ms' }}
            >
              {!mine && (
                <div className="w-8 flex-shrink-0 mr-2 mt-auto">
                  {showAvatar && <Avatar name={sender?.displayName || '?'} avatar={sender?.avatar} size={32} />}
                </div>
              )}

              <div
                className={`max-w-[75%] relative ${isSelected ? 'ring-2 ring-blue-400 rounded-2xl' : ''}`}
                onContextMenu={e => handleContextMenu(e, msg)}
                onClick={e => {
                  e.stopPropagation();
                  if (selectedMsgs.size > 0) {
                    setSelectedMsgs(prev => {
                      const n = new Set(prev);
                      if (n.has(msg.id)) n.delete(msg.id); else n.add(msg.id);
                      return n;
                    });
                  }
                }}
              >
                {/* Reply preview */}
                {replyMsg && (
                  <div
                    className={`mb-1 px-3 py-2 rounded-xl text-xs ${mine ? 'ml-auto' : ''}`}
                    style={{
                      background: 'rgba(59,158,255,0.15)',
                      borderLeft: '3px solid #3b9eff',
                      maxWidth: '100%',
                    }}
                  >
                    <p className="text-blue-400 font-medium">{getUserById(replyMsg.senderId)?.displayName}</p>
                    <p className="text-white/60 truncate">{replyMsg.text || '🎤 Голосовое'}</p>
                  </div>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-100 hover:brightness-110 ${
                    mine ? 'msg-bubble-out rounded-br-sm' : 'msg-bubble-in rounded-bl-sm'
                  }`}
                >
                  {!mine && chat.type !== 'private' && (
                    <p className="text-xs font-semibold text-blue-400 mb-1">{sender?.displayName}</p>
                  )}

                  <div className="text-white">{renderMessageContent(msg)}</div>

                  <div className={`flex items-center gap-1 mt-1 ${mine ? 'justify-end' : 'justify-start'}`}>
                    {msg.editedAt && (
                      <span className="text-[10px] text-white/30">изм.</span>
                    )}
                    <span className="text-[10px] text-white/35">{formatTime(msg.timestamp)}</span>
                    {mine && !msg.deleted && (
                      <span className="text-[10px]" style={{ color: msg.readAt ? '#3b9eff' : 'rgba(255,255,255,0.4)' }}>
                        {msg.readAt ? '✓✓' : '✓'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected messages bar */}
      {selectedMsgs.size > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2 animate-slide-up"
          style={{ background: 'rgba(59,158,255,0.15)', borderTop: '1px solid rgba(59,158,255,0.2)' }}
        >
          <span className="text-sm text-white/80">Выбрано: {selectedMsgs.size}</span>
          <div className="flex gap-2">
            <button onClick={() => {}} className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/10">Переслать</button>
            <button onClick={() => setSelectedMsgs(new Set())} className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/10">Отмена</button>
          </div>
        </div>
      )}

      {/* Reply bar */}
      {replyTo && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-slide-up"
          style={{ background: 'rgba(59,158,255,0.08)', borderTop: '1px solid rgba(59,158,255,0.15)' }}
        >
          <Icon name="Reply" size={16} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400 font-medium">Ответ</p>
            <p className="text-xs text-white/60 truncate">{replyTo.text || '🎤 Голосовое'}</p>
          </div>
          <button onClick={() => setReplyTo(null)}>
            <Icon name="X" size={16} className="text-white/40 hover:text-white/70" />
          </button>
        </div>
      )}

      {/* Edit bar */}
      {editingId && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-slide-up"
          style={{ background: 'rgba(255,200,59,0.08)', borderTop: '1px solid rgba(255,200,59,0.15)' }}
        >
          <Icon name="Pencil" size={16} className="text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-yellow-400 font-medium">Редактирование</p>
          </div>
          <button onClick={() => { setEditingId(null); setText(''); }}>
            <Icon name="X" size={16} className="text-white/40 hover:text-white/70" />
          </button>
        </div>
      )}

      {/* Recording UI */}
      {isRecording && (
        <div
          className="flex items-center gap-4 px-4 py-3 animate-slide-up"
          style={{ background: 'rgba(239,68,68,0.1)', borderTop: '1px solid rgba(239,68,68,0.2)' }}
        >
          <div className="animate-recording w-3 h-3 rounded-full bg-red-500" />
          <span className="text-red-400 text-sm font-medium">
            {micMode === 'video' ? '📹' : '🎤'} {formatDuration(recordSeconds)}
          </span>
          {recordLocked ? (
            <div className="flex gap-2 ml-auto">
              <button
                onClick={() => stopRecording(false)}
                className="px-3 py-1.5 rounded-xl text-xs text-white/60 hover:bg-white/10"
              >
                Отмена
              </button>
              <button
                onClick={() => stopRecording(true)}
                className="px-4 py-1.5 rounded-xl text-xs text-white font-medium"
                style={{ background: '#3b9eff' }}
              >
                Отправить
              </button>
            </div>
          ) : (
            <span className="text-white/40 text-xs ml-auto">↑ Сдвиньте вверх для блокировки</span>
          )}
        </div>
      )}

      {/* Input area */}
      <div
        className="flex items-end gap-2 px-3 py-3 flex-shrink-0"
        style={{
          background: 'rgba(10,14,26,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Emoji / sticker button */}
        <button
          className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10 active:scale-90"
        >
          <span className="text-xl">😊</span>
        </button>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            className="glass-input w-full py-2.5 px-4 text-sm resize-none"
            placeholder="Сообщение..."
            rows={1}
            value={text}
            onChange={e => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ maxHeight: 120, overflowY: 'auto' }}
          />
        </div>

        {/* Send / Mic button */}
        {text.trim() ? (
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-90 animate-scale-in"
            style={{ background: 'linear-gradient(135deg, #3b9eff, #2563eb)', boxShadow: '0 4px 12px rgba(59,158,255,0.35)' }}
          >
            <Icon name="Send" size={18} className="text-white" />
          </button>
        ) : (
          <div className="relative">
            {/* Lock indicator when recording */}
            {isRecording && !recordLocked && (
              <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in">
                <Icon name="Lock" size={20} className="text-blue-400" />
                <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, #3b9eff, transparent)' }} />
              </div>
            )}

            <button
              className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all active:scale-90 ${isRecording ? 'animate-recording' : 'hover:scale-105'}`}
              style={{
                background: isRecording
                  ? 'rgba(239,68,68,0.3)'
                  : 'linear-gradient(135deg, #3b9eff, #2563eb)',
                boxShadow: isRecording
                  ? '0 4px 12px rgba(239,68,68,0.3)'
                  : '0 4px 12px rgba(59,158,255,0.35)',
              }}
              onPointerDown={handleMicPointerDown}
              onPointerMove={handleMicPointerMove}
              onPointerUp={handleMicPointerUp}
              onPointerLeave={handleMicPointerUp}
            >
              <Icon name={micMode === 'video' ? 'Video' : 'Mic'} size={18} className="text-white" />
            </button>

            {/* Mic options popup */}
            {showMicOptions && !isRecording && (
              <div
                className="absolute bottom-14 right-0 rounded-2xl overflow-hidden animate-context-menu"
                style={{
                  background: 'rgba(15,20,40,0.95)',
                  backdropFilter: 'blur(24px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  minWidth: 180,
                }}
                onClick={e => e.stopPropagation()}
              >
                <button
                  onClick={() => { setMicMode('voice'); setShowMicOptions(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/08 transition-colors"
                  style={{ color: micMode === 'voice' ? '#3b9eff' : 'rgba(255,255,255,0.8)' }}
                >
                  <Icon name="Mic" size={16} />
                  Голосовое сообщение
                </button>
                <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
                <button
                  onClick={() => { setMicMode('video'); setShowMicOptions(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-white/08 transition-colors"
                  style={{ color: micMode === 'video' ? '#3b9eff' : 'rgba(255,255,255,0.8)' }}
                >
                  <Icon name="Video" size={16} />
                  Видео кружок
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Context menu */}
      {contextMenu.msg && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 rounded-2xl overflow-hidden animate-context-menu"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 200),
              top: Math.min(contextMenu.y, window.innerHeight - 340),
              background: 'rgba(12,17,35,0.96)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
              minWidth: 180,
            }}
            onClick={e => e.stopPropagation()}
          >
            {[
              { icon: 'Reply', label: 'Ответить', action: handleReply },
              { icon: 'Copy', label: 'Копировать', action: handleCopy, hide: contextMenu.msg.type !== 'text' },
              { icon: 'Pencil', label: 'Редактировать', action: handleEdit, hide: !isMe(contextMenu.msg) || contextMenu.msg.type !== 'text' },
              { icon: 'Forward', label: 'Переслать', action: handleForward },
              { icon: 'Pin', label: contextMenu.msg.pinned ? 'Открепить' : 'Закрепить', action: handlePin },
              { icon: 'CheckSquare', label: 'Выделить', action: handleSelect },
            ].filter(item => !item.hide).map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/85 transition-colors"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <Icon name={item.icon} size={16} className="text-blue-400" />
                {item.label}
              </button>
            ))}
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)' }} />
            {isMe(contextMenu.msg) ? (
              <>
                <button
                  onClick={() => handleDelete(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Icon name="Trash2" size={16} />
                  Удалить у себя
                </button>
                <button
                  onClick={() => handleDelete(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors"
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                >
                  <Icon name="Trash2" size={16} />
                  Удалить у всех
                </button>
              </>
            ) : (
              <button
                onClick={() => handleDelete(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
              >
                <Icon name="Trash2" size={16} />
                Удалить
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
