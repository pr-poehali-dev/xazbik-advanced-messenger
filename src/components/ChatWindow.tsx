import { useState, useRef, useEffect, useCallback } from 'react';
import { User, Chat, Message, formatTime, formatDuration } from '@/lib/store';
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
  x: number;
  y: number;
  msg: Message | null;
}

const EMOJIS = [
  '😀','😃','😄','😁','😆','😅','🤣','😂','🙂','😊',
  '😇','🥰','😍','🤩','😘','😗','😚','😋','😛','😜',
  '🤪','😝','🤑','🤗','🤭','🤫','🤔','🤐','😶','😏',
  '😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷',
  '🤒','🤕','🤢','🤮','🥵','🥶','🥴','😵','🤯','🤠',
  '🥳','🥸','😎','🤓','🧐','😕','😟','🙁','😮','😯',
  '😲','😳','🥺','😦','😧','😨','😰','😥','😢','😭',
  '😱','😖','😣','😞','😓','😩','😫','🥱','😤','😡',
  '😠','🤬','😈','👿','💀','💩','🤡','👻','👽','👾',
  '🤖','😺','😸','😹','😻','😼','😽','🙀','😿','😾',
  '👍','👎','👊','✊','🤛','🤜','👏','🙌','👐','🤝',
  '🙏','💪','❤️','🧡','💛','💚','💙','💜','🖤','🤍',
  '💯','💥','💫','⭐','🌟','✨','🔥','💋','🎉','🎊',
];

export default function ChatWindow({
  chat,
  currentUser,
  users,
  messages,
  onSendMessage,
  onDeleteMessage,
  onEditMessage,
  onPinMessage,
  onBack,
  onCallVoice,
  onCallVideo,
  onChatInfo,
}: ChatWindowProps) {
  const [text, setText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    msg: null,
  });
  const [selectedMsgs, setSelectedMsgs] = useState<Set<string>>(new Set());
  const [deletingMsgs, setDeletingMsgs] = useState<Set<string>>(new Set());
  const [pinnedMsg, setPinnedMsg] = useState<Message | null>(null);
  const [typingEffect, setTypingEffect] = useState(false);

  // Recording state
  const [recordingType, setRecordingType] = useState<'voice' | 'video' | null>(null);
  const [recordLocked, setRecordLocked] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);

  // Emoji picker
  const [showEmoji, setShowEmoji] = useState(false);
  const [emojiTab, setEmojiTab] = useState<'emoji' | 'sticker' | 'gif'>('emoji');

  // Header 3-dot menu
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Voice playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const holdYRef = useRef<number>(0);
  const lockRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const emojiRef = useRef<HTMLDivElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);

  const isRecording = recordingType !== null;

  const getUserById = (id: string) => users.find((u) => u.id === id);

  const getChatPartner = () => {
    if (chat.type === 'private') {
      const other = chat.members.find((m) => m !== currentUser.id);
      return other ? getUserById(other) : null;
    }
    return null;
  };

  const partner = getChatPartner();

  // Filter out deleted messages completely
  const visibleMessages = messages.filter((m) => !m.deleted);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [visibleMessages.length]);

  useEffect(() => {
    const pinned = messages.find((m) => m.pinned && !m.deleted);
    setPinnedMsg(pinned || null);
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    messages.forEach((msg) => {
      if (msg.senderId !== currentUser.id && !msg.readAt) {
        msg.readAt = Date.now();
      }
    });
  }, [messages, currentUser.id]);

  // Close emoji panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showEmoji]);

  // Close header menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (headerMenuRef.current && !headerMenuRef.current.contains(e.target as Node)) {
        setShowHeaderMenu(false);
      }
    };
    if (showHeaderMenu) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showHeaderMenu]);

  // ---- SEND ----
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

    if (partner && chat.type === 'private') {
      setTypingEffect(true);
      setTimeout(() => setTypingEffect(false), 2000 + Math.random() * 2000);
    }
  };

  // ---- EMOJI ----
  const insertEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    inputRef.current?.focus();
  };

  // ---- RECORDING ----
  const startRecording = useCallback(async (mode: 'voice' | 'video') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: mode === 'video',
      });
      const mr = new MediaRecorder(stream);
      recordChunksRef.current = [];
      mr.ondataavailable = (e) => recordChunksRef.current.push(e.data);
      mr.start(100);
      mediaRecorderRef.current = mr;
      setRecordingType(mode);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(
        () => setRecordSeconds((s) => s + 1),
        1000
      );
    } catch {
      alert('Нет доступа к микрофону');
    }
  }, []);

  const stopRecording = useCallback(
    (send: boolean) => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      const mr = mediaRecorderRef.current;
      const mode = recordingType;
      if (!mr || !mode) return;
      mr.onstop = () => {
        if (send) {
          const blob = new Blob(recordChunksRef.current, {
            type: mode === 'video' ? 'video/webm' : 'audio/webm',
          });
          const url = URL.createObjectURL(blob);
          onSendMessage({
            chatId: chat.id,
            senderId: currentUser.id,
            type: mode === 'video' ? 'video' : 'voice',
            voiceUrl: mode === 'voice' ? url : undefined,
            videoUrl: mode === 'video' ? url : undefined,
            duration: recordSeconds,
          });
        }
        mr.stream.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current = null;
      };
      mr.stop();
      setRecordingType(null);
      setRecordLocked(false);
      lockRef.current = false;
      setRecordSeconds(0);
    },
    [chat.id, currentUser.id, recordingType, onSendMessage, recordSeconds]
  );

  const handleRecordPointerDown = (e: React.PointerEvent, mode: 'voice' | 'video') => {
    holdYRef.current = e.clientY;
    lockRef.current = false;
    const timer = setTimeout(() => {
      startRecording(mode);
    }, 150);
    (e.currentTarget as HTMLElement).dataset.holdTimer = String(
      timer as unknown as number
    );
  };

  const handleRecordPointerMove = (e: React.PointerEvent) => {
    if (!isRecording || lockRef.current) return;
    const deltaY = holdYRef.current - e.clientY;
    if (deltaY > 60) {
      lockRef.current = true;
      setRecordLocked(true);
    }
  };

  const handleRecordPointerUp = () => {
    if (!isRecording) return;
    if (!lockRef.current) {
      stopRecording(true);
    }
  };

  // ---- DELETE WITH ANIMATION ----
  const triggerDelete = (msgId: string, forAll: boolean) => {
    setDeletingMsgs((prev) => {
      const n = new Set(prev);
      n.add(msgId);
      return n;
    });
    setTimeout(() => {
      onDeleteMessage(msgId, forAll);
      setDeletingMsgs((prev) => {
        const n = new Set(prev);
        n.delete(msgId);
        return n;
      });
    }, 600);
  };

  const triggerDeleteSelected = () => {
    selectedMsgs.forEach((id) => triggerDelete(id, false));
    setSelectedMsgs(new Set());
  };

  // ---- CONTEXT MENU ----
  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, msg });
  };

  const closeContextMenu = () =>
    setContextMenu({ x: 0, y: 0, msg: null });

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
    setSelectedMsgs((prev) => {
      const n = new Set(prev);
      n.add(id);
      return n;
    });
    closeContextMenu();
  };

  const handleDeleteFromContext = (forAll: boolean) => {
    if (contextMenu.msg) triggerDelete(contextMenu.msg.id, forAll);
    closeContextMenu();
  };

  // ---- AUDIO PLAYBACK ----
  const playAudio = (url: string, msgId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (playingAudioId === msgId) {
      setPlayingAudioId(null);
      return;
    }
    const audio = new Audio(url);
    audio.onended = () => {
      setPlayingAudioId(null);
      audioRef.current = null;
    };
    audio.play();
    audioRef.current = audio;
    setPlayingAudioId(msgId);
  };

  // ---- HELPERS ----
  const isMe = (msg: Message) => msg.senderId === currentUser.id;
  const getReplyMsg = (id: string) => messages.find((m) => m.id === id);

  // ---- RENDER MESSAGE CONTENT ----
  const renderMessageContent = (msg: Message) => {
    if (msg.type === 'voice') {
      const isPlaying = playingAudioId === msg.id;
      return (
        <div className="flex items-center gap-3 min-w-[160px]">
          <button
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(59,158,255,0.3)' }}
            onClick={(e) => {
              e.stopPropagation();
              if (msg.voiceUrl) playAudio(msg.voiceUrl, msg.id);
            }}
          >
            <Icon
              name={isPlaying ? 'Pause' : 'Play'}
              size={16}
              className="text-white"
            />
          </button>
          <div className="flex-1">
            <div className="flex gap-0.5 items-end h-5">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="voice-bar"
                  style={{
                    height: `${Math.random() * 16 + 4}px`,
                    animationDelay: `${i * 40}ms`,
                    opacity: isPlaying ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
            <p className="text-xs text-white/40 mt-1">
              {formatDuration(msg.duration || 0)}
            </p>
          </div>
          <Icon name="Mic" size={14} className="text-white/40" />
        </div>
      );
    }
    if (msg.type === 'video') {
      return (
        <div
          className="relative rounded-xl overflow-hidden"
          style={{ width: 200, height: 200 }}
        >
          <video src={msg.videoUrl} className="w-full h-full object-cover" controls />
          <p className="absolute bottom-2 right-2 text-xs text-white bg-black/50 px-1.5 py-0.5 rounded-full">
            {formatDuration(msg.duration || 0)}
          </p>
        </div>
      );
    }
    if (msg.type === 'sticker') {
      return <span className="text-5xl">{msg.stickerEmoji}</span>;
    }
    if (msg.type === 'image') {
      return (
        <div className="rounded-xl overflow-hidden" style={{ maxWidth: 260 }}>
          <img src={msg.imageUrl} alt="" className="w-full h-auto" />
        </div>
      );
    }
    return (
      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
    );
  };

  // ========================================
  // RENDER
  // ========================================
  return (
    <div
      className="flex flex-col h-full relative"
      onClick={() => {
        closeContextMenu();
        setShowHeaderMenu(false);
      }}
    >
      {/* ====== HEADER ====== */}
      <div
        className="flex items-center gap-3 px-4 py-3 flex-shrink-0"
        style={{
          background: 'rgba(10,14,26,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90 md:hidden"
        >
          <Icon name="ArrowLeft" size={20} className="text-white/80" />
        </button>

        {/* Clickable name/avatar area -> onChatInfo */}
        <button
          onClick={onChatInfo}
          className="flex items-center gap-3 flex-1 min-w-0"
        >
          <Avatar
            name={partner?.displayName || chat.name}
            avatar={partner?.avatar || chat.avatar}
            size={40}
            online={partner?.online}
          />
          <div className="min-w-0 text-left">
            <p className="font-semibold text-white text-sm truncate">
              {partner?.displayName || chat.name}
            </p>
            <p
              className="text-xs"
              style={{
                color: partner?.online ? '#22c55e' : 'rgba(255,255,255,0.4)',
              }}
            >
              {typingEffect ? (
                <span className="flex items-center gap-1">
                  <span>печатает</span>
                  <span className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="inline-block w-1 h-1 rounded-full bg-green-400 animate-typing-dot"
                        style={{ animationDelay: `${i * 0.2}s` }}
                      />
                    ))}
                  </span>
                </span>
              ) : partner?.online ? (
                'в сети'
              ) : (
                'был(а) недавно'
              )}
            </p>
          </div>
        </button>

        <div className="flex gap-1">
          <button
            onClick={onCallVoice}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
          >
            <Icon name="Phone" size={18} className="text-white/80" />
          </button>
          <button
            onClick={onCallVideo}
            className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
          >
            <Icon name="Video" size={18} className="text-white/80" />
          </button>

          {/* Three dots menu */}
          <div className="relative" ref={headerMenuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowHeaderMenu((v) => !v);
              }}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-white/10 active:scale-90"
            >
              <Icon name="MoreVertical" size={18} className="text-white/80" />
            </button>

            {showHeaderMenu && (
              <div
                className="absolute right-0 top-12 rounded-2xl overflow-hidden animate-context-menu z-50"
                style={{
                  background: 'rgba(12,17,35,0.96)',
                  backdropFilter: 'blur(32px)',
                  WebkitBackdropFilter: 'blur(32px)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                  minWidth: 200,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={() => setShowHeaderMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/85 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(255,255,255,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <span className="text-base">🔍</span>
                  Поиск
                </button>
                <div
                  style={{
                    height: 1,
                    background: 'rgba(255,255,255,0.07)',
                  }}
                />
                <button
                  onClick={() => {
                    setShowHeaderMenu(false);
                    onChatInfo();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <span className="text-base">🗑</span>
                  Удалить переписку
                </button>
                <button
                  onClick={() => setShowHeaderMenu(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <span className="text-base">🚫</span>
                  Заблокировать
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====== PINNED MESSAGE BANNER ====== */}
      {pinnedMsg && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-fade-in cursor-pointer"
          style={{
            background: 'rgba(59,158,255,0.1)',
            borderBottom: '1px solid rgba(59,158,255,0.15)',
          }}
        >
          <Icon name="Pin" size={14} className="text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-blue-400 font-medium">
              Закреплённое сообщение
            </p>
            <p className="text-xs text-white/60 truncate">{pinnedMsg.text}</p>
          </div>
        </div>
      )}

      {/* ====== MESSAGES LIST ====== */}
      <div
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1"
        style={{
          background: chat.wallpaper
            ? `url(${chat.wallpaper}) center/cover`
            : undefined,
        }}
      >
        {visibleMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
            <div className="text-5xl">👋</div>
            <p className="text-sm">Начните общение!</p>
          </div>
        )}

        {visibleMessages.map((msg, i) => {
          const mine = isMe(msg);
          const replyMsg = msg.replyToId ? getReplyMsg(msg.replyToId) : null;
          const sender = getUserById(msg.senderId);
          const showAvatar =
            !mine &&
            (i === 0 || visibleMessages[i - 1].senderId !== msg.senderId);
          const isSelected = selectedMsgs.has(msg.id);
          const isDeleting = deletingMsgs.has(msg.id);

          return (
            <div
              key={msg.id}
              className={`flex ${mine ? 'justify-end' : 'justify-start'} ${
                mine ? 'animate-msg-out' : 'animate-msg-in'
              } group`}
              style={{
                animationDelay: '0ms',
                ...(isDeleting
                  ? {
                      transition:
                        'all 0.5s cubic-bezier(0.4, 0, 1, 1)',
                      transform:
                        'scale(0.3) translateY(-40px) rotate(15deg)',
                      opacity: 0,
                      filter: 'blur(8px)',
                    }
                  : {}),
              }}
            >
              {!mine && (
                <div className="w-8 flex-shrink-0 mr-2 mt-auto">
                  {showAvatar && (
                    <Avatar
                      name={sender?.displayName || '?'}
                      avatar={sender?.avatar}
                      size={32}
                    />
                  )}
                </div>
              )}

              <div
                className={`max-w-[75%] relative ${
                  isSelected ? 'ring-2 ring-blue-400 rounded-2xl' : ''
                }`}
                onContextMenu={(e) => handleContextMenu(e, msg)}
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedMsgs.size > 0) {
                    setSelectedMsgs((prev) => {
                      const n = new Set(prev);
                      if (n.has(msg.id)) n.delete(msg.id);
                      else n.add(msg.id);
                      return n;
                    });
                  }
                }}
              >
                {/* Reply preview */}
                {replyMsg && (
                  <div
                    className={`mb-1 px-3 py-2 rounded-xl text-xs ${
                      mine ? 'ml-auto' : ''
                    }`}
                    style={{
                      background: 'rgba(59,158,255,0.15)',
                      borderLeft: '3px solid #3b9eff',
                      maxWidth: '100%',
                    }}
                  >
                    <p className="text-blue-400 font-medium">
                      {getUserById(replyMsg.senderId)?.displayName}
                    </p>
                    <p className="text-white/60 truncate">
                      {replyMsg.text || '🎤 Голосовое'}
                    </p>
                  </div>
                )}

                <div
                  className={`px-4 py-2.5 rounded-2xl cursor-pointer transition-all duration-100 hover:brightness-110 ${
                    mine
                      ? 'msg-bubble-out rounded-br-sm'
                      : 'msg-bubble-in rounded-bl-sm'
                  }`}
                >
                  {!mine && chat.type !== 'private' && (
                    <p className="text-xs font-semibold text-blue-400 mb-1">
                      {sender?.displayName}
                    </p>
                  )}

                  <div className="text-white">
                    {renderMessageContent(msg)}
                  </div>

                  <div
                    className={`flex items-center gap-1 mt-1 ${
                      mine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.editedAt && (
                      <span className="text-[10px] text-white/30">изм.</span>
                    )}
                    <span className="text-[10px] text-white/35">
                      {formatTime(msg.timestamp)}
                    </span>
                    {mine && (
                      <span
                        className="text-[10px]"
                        style={{
                          color: msg.readAt
                            ? '#3b9eff'
                            : 'rgba(255,255,255,0.4)',
                        }}
                      >
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

      {/* ====== SELECTED MESSAGES BAR ====== */}
      {selectedMsgs.size > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2 animate-slide-up"
          style={{
            background: 'rgba(59,158,255,0.15)',
            borderTop: '1px solid rgba(59,158,255,0.2)',
          }}
        >
          <span className="text-sm text-white/80">
            Выбрано: {selectedMsgs.size}
          </span>
          <div className="flex gap-2">
            <button
              onClick={triggerDeleteSelected}
              className="px-3 py-1.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Удалить
            </button>
            <button
              onClick={() => {}}
              className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Переслать
            </button>
            <button
              onClick={() => setSelectedMsgs(new Set())}
              className="px-3 py-1.5 rounded-xl text-xs text-white/70 hover:bg-white/10 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* ====== REPLY BAR ====== */}
      {replyTo && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-slide-up"
          style={{
            background: 'rgba(59,158,255,0.08)',
            borderTop: '1px solid rgba(59,158,255,0.15)',
          }}
        >
          <Icon
            name="Reply"
            size={16}
            className="text-blue-400 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-blue-400 font-medium">Ответ</p>
            <p className="text-xs text-white/60 truncate">
              {replyTo.text || '🎤 Голосовое'}
            </p>
          </div>
          <button onClick={() => setReplyTo(null)}>
            <Icon
              name="X"
              size={16}
              className="text-white/40 hover:text-white/70"
            />
          </button>
        </div>
      )}

      {/* ====== EDIT BAR ====== */}
      {editingId && (
        <div
          className="flex items-center gap-3 px-4 py-2 animate-slide-up"
          style={{
            background: 'rgba(255,200,59,0.08)',
            borderTop: '1px solid rgba(255,200,59,0.15)',
          }}
        >
          <Icon
            name="Pencil"
            size={16}
            className="text-yellow-400 flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-xs text-yellow-400 font-medium">
              Редактирование
            </p>
          </div>
          <button
            onClick={() => {
              setEditingId(null);
              setText('');
            }}
          >
            <Icon
              name="X"
              size={16}
              className="text-white/40 hover:text-white/70"
            />
          </button>
        </div>
      )}

      {/* ====== RECORDING UI ====== */}
      {isRecording && (
        <div
          className="flex items-center gap-4 px-4 py-3 animate-slide-up"
          style={{
            background: 'rgba(239,68,68,0.1)',
            borderTop: '1px solid rgba(239,68,68,0.2)',
          }}
        >
          <div className="animate-recording w-3 h-3 rounded-full bg-red-500" />
          <span className="text-red-400 text-sm font-medium">
            {recordingType === 'video' ? '📹' : '🎤'}{' '}
            {formatDuration(recordSeconds)}
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
            <span className="text-white/40 text-xs ml-auto">
              ↑ Сдвиньте вверх для блокировки
            </span>
          )}
        </div>
      )}

      {/* ====== INPUT AREA ====== */}
      <div
        className="flex items-end gap-2 px-3 py-3 flex-shrink-0 relative"
        style={{
          background: 'rgba(10,14,26,0.9)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {/* Voice record button */}
        <div className="relative">
          {isRecording && recordingType === 'voice' && !recordLocked && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in">
              <Icon name="Lock" size={20} className="text-blue-400" />
              <div
                className="w-px h-8"
                style={{
                  background:
                    'linear-gradient(to bottom, #3b9eff, transparent)',
                }}
              />
            </div>
          )}
          <button
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              isRecording && recordingType === 'voice'
                ? 'animate-recording'
                : 'hover:bg-white/10 active:scale-90'
            }`}
            style={{
              background:
                isRecording && recordingType === 'voice'
                  ? 'rgba(239,68,68,0.3)'
                  : 'transparent',
              boxShadow:
                isRecording && recordingType === 'voice'
                  ? '0 4px 12px rgba(239,68,68,0.3)'
                  : 'none',
            }}
            onPointerDown={(e) => handleRecordPointerDown(e, 'voice')}
            onPointerMove={handleRecordPointerMove}
            onPointerUp={handleRecordPointerUp}
            onPointerLeave={handleRecordPointerUp}
          >
            <Icon name="Mic" size={18} className="text-white/80" />
          </button>
        </div>

        {/* Video record button */}
        <div className="relative">
          {isRecording && recordingType === 'video' && !recordLocked && (
            <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 animate-fade-in">
              <Icon name="Lock" size={20} className="text-blue-400" />
              <div
                className="w-px h-8"
                style={{
                  background:
                    'linear-gradient(to bottom, #3b9eff, transparent)',
                }}
              />
            </div>
          )}
          <button
            className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all ${
              isRecording && recordingType === 'video'
                ? 'animate-recording'
                : 'hover:bg-white/10 active:scale-90'
            }`}
            style={{
              background:
                isRecording && recordingType === 'video'
                  ? 'rgba(239,68,68,0.3)'
                  : 'transparent',
              boxShadow:
                isRecording && recordingType === 'video'
                  ? '0 4px 12px rgba(239,68,68,0.3)'
                  : 'none',
            }}
            onPointerDown={(e) => handleRecordPointerDown(e, 'video')}
            onPointerMove={handleRecordPointerMove}
            onPointerUp={handleRecordPointerUp}
            onPointerLeave={handleRecordPointerUp}
          >
            <Icon name="Video" size={18} className="text-white/80" />
          </button>
        </div>

        {/* Emoji button + panel */}
        <div className="relative" ref={emojiRef}>
          <button
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:bg-white/10 active:scale-90"
            onClick={(e) => {
              e.stopPropagation();
              setShowEmoji((v) => !v);
            }}
          >
            <span className="text-xl">😊</span>
          </button>

          {showEmoji && (
            <div
              className="absolute bottom-14 left-0 rounded-2xl overflow-hidden animate-scale-in z-50"
              style={{
                background: 'rgba(12,17,35,0.96)',
                backdropFilter: 'blur(32px)',
                WebkitBackdropFilter: 'blur(32px)',
                border: '1px solid rgba(255,255,255,0.12)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6)',
                width: 320,
                maxHeight: 360,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Tabs */}
              <div
                className="flex border-b"
                style={{ borderColor: 'rgba(255,255,255,0.08)' }}
              >
                {(
                  [
                    { key: 'emoji' as const, label: 'Смайлики' },
                    { key: 'sticker' as const, label: 'Стикеры' },
                    { key: 'gif' as const, label: 'GIF' },
                  ]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setEmojiTab(tab.key)}
                    className="flex-1 py-2.5 text-xs font-semibold transition-colors"
                    style={{
                      color:
                        emojiTab === tab.key
                          ? '#3b9eff'
                          : 'rgba(255,255,255,0.4)',
                      borderBottom:
                        emojiTab === tab.key
                          ? '2px solid #3b9eff'
                          : '2px solid transparent',
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div
                className="p-3 overflow-y-auto"
                style={{ maxHeight: 300 }}
              >
                {emojiTab === 'emoji' && (
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJIS.map((emoji, i) => (
                      <button
                        key={i}
                        onClick={() => insertEmoji(emoji)}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-xl hover:bg-white/10 transition-colors active:scale-90"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                {emojiTab === 'sticker' && (
                  <div className="flex items-center justify-center h-40 text-white/30 text-sm">
                    Скоро...
                  </div>
                )}
                {emojiTab === 'gif' && (
                  <div className="flex items-center justify-center h-40 text-white/30 text-sm">
                    Скоро...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Text input */}
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            className="glass-input w-full py-2.5 px-4 text-sm resize-none"
            placeholder="Сообщение..."
            rows={1}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height =
                Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            style={{ maxHeight: 120, overflowY: 'auto' }}
          />
        </div>

        {/* Send button (only when text present) */}
        {text.trim() && (
          <button
            onClick={handleSend}
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-90 animate-scale-in"
            style={{
              background: 'linear-gradient(135deg, #3b9eff, #2563eb)',
              boxShadow: '0 4px 12px rgba(59,158,255,0.35)',
            }}
          >
            <Icon name="Send" size={18} className="text-white" />
          </button>
        )}
      </div>

      {/* ====== CONTEXT MENU ====== */}
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
            onClick={(e) => e.stopPropagation()}
          >
            {[
              {
                icon: 'Reply',
                label: 'Ответить',
                action: handleReply,
                hide: false,
              },
              {
                icon: 'Copy',
                label: 'Копировать',
                action: handleCopy,
                hide: contextMenu.msg.type !== 'text',
              },
              {
                icon: 'Pencil',
                label: 'Редактировать',
                action: handleEdit,
                hide:
                  !isMe(contextMenu.msg) ||
                  contextMenu.msg.type !== 'text',
              },
              {
                icon: 'Forward',
                label: 'Переслать',
                action: handleForward,
                hide: false,
              },
              {
                icon: 'Pin',
                label: contextMenu.msg.pinned
                  ? 'Открепить'
                  : 'Закрепить',
                action: handlePin,
                hide: false,
              },
              {
                icon: 'CheckSquare',
                label: 'Выделить',
                action: handleSelect,
                hide: false,
              },
            ]
              .filter((item) => !item.hide)
              .map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-white/85 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(255,255,255,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <Icon
                    name={item.icon}
                    size={16}
                    className="text-blue-400"
                  />
                  {item.label}
                </button>
              ))}
            <div
              style={{
                height: 1,
                background: 'rgba(255,255,255,0.07)',
              }}
            />
            {isMe(contextMenu.msg) ? (
              <>
                <button
                  onClick={() => handleDeleteFromContext(false)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <Icon name="Trash2" size={16} />
                  Удалить у себя
                </button>
                <button
                  onClick={() => handleDeleteFromContext(true)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors"
                  onMouseEnter={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'rgba(239,68,68,0.08)')
                  }
                  onMouseLeave={(e) =>
                    ((e.currentTarget as HTMLElement).style.background =
                      'transparent')
                  }
                >
                  <Icon name="Trash2" size={16} />
                  Удалить у всех
                </button>
              </>
            ) : (
              <button
                onClick={() => handleDeleteFromContext(false)}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 transition-colors"
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    'rgba(239,68,68,0.08)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLElement).style.background =
                    'transparent')
                }
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
