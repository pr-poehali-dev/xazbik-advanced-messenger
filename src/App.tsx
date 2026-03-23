import { useState, useEffect, useCallback } from 'react';
import {
  AppState, User, Chat, Message,
  loadState, saveState, generateId
} from '@/lib/store';
import { WALLPAPER_BG } from '@/components/SettingsPanel';

import Auth from '@/components/Auth';
import Sidebar from '@/components/Sidebar';
import ChatWindow from '@/components/ChatWindow';
import ProfilePanel from '@/components/ProfilePanel';
import MenuDrawer from '@/components/MenuDrawer';
import SearchModal from '@/components/SearchModal';
import NewChatModal from '@/components/NewChatModal';
import CallModal from '@/components/CallModal';
import SettingsPanel from '@/components/SettingsPanel';

type RightPanel = 'chat' | 'profile' | 'settings' | null;
type NewChatMode = 'chat' | 'group' | 'channel' | null;

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [newChatMode, setNewChatMode] = useState<NewChatMode>(null);
  const [callState, setCallState] = useState<{ type: 'voice' | 'video'; partner: User } | null>(null);
  const [isMobileChat, setIsMobileChat] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => updater(prev));
  }, []);

  const handleAuth = (user: User) => {
    updateState(prev => {
      const exists = prev.users.find(u => u.id === user.id);
      const users = exists
        ? prev.users.map(u => u.id === user.id ? { ...u, online: true } : u)
        : [...prev.users, user];

      const hasSaved = prev.chats.find(c => c.type === 'saved' && c.members.includes(user.id));
      const chats = hasSaved ? prev.chats : [
        ...prev.chats,
        {
          id: generateId(),
          type: 'saved' as const,
          name: 'Избранное',
          members: [user.id],
          unread: 0,
        }
      ];

      return { ...prev, users, chats, currentUser: user };
    });
  };

  const handleLogout = () => {
    updateState(prev => ({
      ...prev,
      currentUser: null,
      users: prev.users.map(u => u.id === prev.currentUser?.id ? { ...u, online: false } : u),
    }));
    setActiveChatId(null);
    setRightPanel(null);
    setIsMobileChat(false);
  };

  const getMessages = (chatId: string): Message[] => state.messages[chatId] || [];

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    setRightPanel('chat');
    setIsMobileChat(true);
    updateState(prev => ({
      ...prev,
      chats: prev.chats.map(c => c.id === chatId ? { ...c, unread: 0 } : c),
    }));
  };

  const handleSendMessage = useCallback((chatId: string, msg: Omit<Message, 'id' | 'timestamp'>) => {
    const newMsg: Message = { ...msg, id: generateId(), timestamp: Date.now() };

    updateState(prev => {
      const msgs = [...(prev.messages[chatId] || []), newMsg];
      const chats = prev.chats.map(c => c.id === chatId ? { ...c, lastMessage: newMsg, unread: 0 } : c);
      return { ...prev, messages: { ...prev.messages, [chatId]: msgs }, chats };
    });

    // Auto reply simulation
    setState(prev => {
      const chat = prev.chats.find(c => c.id === chatId);
      const cu = prev.currentUser;
      if (!chat || !cu || chat.type !== 'private') return prev;
      const otherId = chat.members.find(m => m !== cu.id);
      const other = prev.users.find(u => u.id === otherId);
      if (!other) return prev;

      setTimeout(() => {
        const replies = ['Понял!', 'Окей 👍', 'Хорошо!', 'Да!', 'Отлично!', '😊', 'Спасибо!', 'Понял, спасибо!'];
        const replyMsg: Message = {
          id: generateId(),
          chatId,
          senderId: other.id,
          text: replies[Math.floor(Math.random() * replies.length)],
          type: 'text',
          timestamp: Date.now(),
        };
        setState(p => {
          const msgs2 = [...(p.messages[chatId] || []), replyMsg];
          const chats2 = p.chats.map(c =>
            c.id === chatId ? { ...c, lastMessage: replyMsg, unread: activeChatId === chatId ? 0 : c.unread + 1 } : c
          );
          return { ...p, messages: { ...p.messages, [chatId]: msgs2 }, chats: chats2 };
        });
      }, 1500 + Math.random() * 2000);

      return prev;
    });
  }, [updateState, activeChatId]);

  const handleDeleteMessage = (chatId: string, msgId: string, forAll: boolean) => {
    updateState(prev => {
      const msgs = (prev.messages[chatId] || []).map(m =>
        m.id === msgId ? { ...m, deleted: true, deletedForAll: forAll, text: undefined } : m
      );
      const lastMsg = [...msgs].reverse().find(m => !m.deleted);
      const chats = prev.chats.map(c => c.id === chatId ? { ...c, lastMessage: lastMsg } : c);
      return { ...prev, messages: { ...prev.messages, [chatId]: msgs }, chats };
    });
  };

  const handleEditMessage = (chatId: string, msgId: string, text: string) => {
    updateState(prev => {
      const msgs = (prev.messages[chatId] || []).map(m =>
        m.id === msgId ? { ...m, text, editedAt: Date.now() } : m
      );
      const lastMsg = [...msgs].reverse().find(m => !m.deleted);
      const chats = prev.chats.map(c => c.id === chatId ? { ...c, lastMessage: lastMsg } : c);
      return { ...prev, messages: { ...prev.messages, [chatId]: msgs }, chats };
    });
  };

  const handlePinMessage = (chatId: string, msgId: string) => {
    updateState(prev => {
      const msgs = (prev.messages[chatId] || []).map(m =>
        m.chatId === chatId ? { ...m, pinned: m.id === msgId ? !m.pinned : false } : m
      );
      return { ...prev, messages: { ...prev.messages, [chatId]: msgs } };
    });
  };

  const handleCreateChat = (chat: Chat) => {
    updateState(prev => {
      if (chat.type === 'private') {
        const existing = prev.chats.find(c =>
          c.type === 'private' &&
          c.members.includes(chat.members[0]) &&
          c.members.includes(chat.members[1])
        );
        if (existing) {
          setActiveChatId(existing.id);
          setRightPanel('chat');
          setNewChatMode(null);
          setIsMobileChat(true);
          return prev;
        }
      }
      setActiveChatId(chat.id);
      setRightPanel('chat');
      setNewChatMode(null);
      setIsMobileChat(true);
      return { ...prev, chats: [...prev.chats, chat] };
    });
  };

  const handleSelectUserFromSearch = (user: User) => {
    setShowSearch(false);
    const cu = state.currentUser!;
    const existing = state.chats.find(c =>
      c.type === 'private' && c.members.includes(cu.id) && c.members.includes(user.id)
    );
    if (existing) {
      handleSelectChat(existing.id);
    } else {
      handleCreateChat({
        id: generateId(),
        type: 'private',
        name: user.displayName,
        members: [cu.id, user.id],
        unread: 0,
      });
    }
  };

  const handleSaveProfile = (updated: User) => {
    updateState(prev => ({
      ...prev,
      currentUser: updated,
      users: prev.users.map(u => u.id === updated.id ? updated : u),
    }));
  };

  const handleSavedMessages = () => {
    const cu = state.currentUser;
    if (!cu) return;
    const saved = state.chats.find(c => c.type === 'saved' && c.members.includes(cu.id));
    if (saved) handleSelectChat(saved.id);
  };

  const currentUser = state.currentUser;
  const activeChat = state.chats.find(c => c.id === activeChatId) || null;
  const wallpapercss = WALLPAPER_BG[state.wallpaper] || '';
  const userChats = currentUser ? state.chats.filter(c => c.members.includes(currentUser.id)) : [];

  if (!currentUser) {
    return <Auth onAuth={handleAuth} users={state.users} />;
  }

  return (
    <div
      className="fixed inset-0 flex overflow-hidden"
      style={{
        background: wallpapercss || '#0a0e1a',
        backgroundImage: wallpapercss
          ? wallpapercss
          : 'radial-gradient(ellipse at 20% 20%, rgba(59,158,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.10) 0%, transparent 50%)',
      }}
    >
      {/* Sidebar */}
      <div
        className={`flex-shrink-0 transition-all duration-300 ${isMobileChat ? 'hidden md:flex md:w-80' : 'flex'}`}
        style={{ width: 'clamp(280px, 30vw, 380px)' }}
      >
        <div className="w-full">
          <Sidebar
            currentUser={currentUser}
            chats={userChats}
            users={state.users}
            folders={state.folders}
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onOpenMenu={() => setShowMenu(true)}
            onNewChat={() => setNewChatMode('chat')}
            onNewGroup={() => setNewChatMode('group')}
            onNewChannel={() => setNewChatMode('channel')}
            onOpenProfile={() => { setRightPanel('profile'); setIsMobileChat(false); }}
            onOpenSearch={() => setShowSearch(true)}
          />
        </div>
      </div>

      {/* Divider */}
      <div className="hidden md:block w-px flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />

      {/* Main area */}
      <div className={`flex-1 flex flex-col min-w-0 ${!isMobileChat ? 'hidden md:flex' : 'flex'}`}>
        {rightPanel === 'chat' && activeChat ? (
          <ChatWindow
            key={activeChat.id}
            chat={activeChat}
            currentUser={currentUser}
            users={state.users}
            messages={getMessages(activeChat.id)}
            onSendMessage={msg => handleSendMessage(activeChat.id, msg)}
            onDeleteMessage={(id, forAll) => handleDeleteMessage(activeChat.id, id, forAll)}
            onEditMessage={(id, text) => handleEditMessage(activeChat.id, id, text)}
            onPinMessage={id => handlePinMessage(activeChat.id, id)}
            onBack={() => { setIsMobileChat(false); setRightPanel(null); }}
            onCallVoice={() => {
              const partner = state.users.find(u => activeChat.members.includes(u.id) && u.id !== currentUser.id);
              if (partner) setCallState({ type: 'voice', partner });
            }}
            onCallVideo={() => {
              const partner = state.users.find(u => activeChat.members.includes(u.id) && u.id !== currentUser.id);
              if (partner) setCallState({ type: 'video', partner });
            }}
            onChatInfo={() => {}}
          />
        ) : rightPanel === 'profile' ? (
          <ProfilePanel
            currentUser={currentUser}
            onSave={handleSaveProfile}
            onClose={() => setRightPanel(null)}
            onLogout={handleLogout}
          />
        ) : rightPanel === 'settings' ? (
          <SettingsPanel
            accentColor={state.accentColor}
            wallpaper={state.wallpaper}
            onChangeAccent={color => updateState(prev => ({ ...prev, accentColor: color }))}
            onChangeWallpaper={wp => updateState(prev => ({ ...prev, wallpaper: wp }))}
            onClose={() => setRightPanel(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 select-none">
            <div
              className="w-24 h-24 rounded-3xl flex items-center justify-center text-4xl animate-bounce-in"
              style={{ background: 'rgba(59,158,255,0.08)', border: '1px solid rgba(59,158,255,0.12)' }}
            >
              ✈️
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-xl" style={{ color: 'rgba(255,255,255,0.3)' }}>XazbikGram</p>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.18)' }}>Выберите чат для начала общения</p>
            </div>
          </div>
        )}
      </div>

      {/* Overlays */}
      <MenuDrawer
        currentUser={currentUser}
        visible={showMenu}
        onClose={() => setShowMenu(false)}
        onProfile={() => { setRightPanel('profile'); setIsMobileChat(false); }}
        onNewGroup={() => setNewChatMode('group')}
        onNewChannel={() => setNewChatMode('channel')}
        onContacts={() => setShowSearch(true)}
        onCalls={() => {}}
        onSaved={handleSavedMessages}
        onSettings={() => { setRightPanel('settings'); setIsMobileChat(false); }}
      />

      {showSearch && (
        <SearchModal
          users={state.users}
          chats={userChats}
          currentUser={currentUser}
          onSelectUser={handleSelectUserFromSearch}
          onSelectChat={id => { setShowSearch(false); handleSelectChat(id); }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {newChatMode && (
        <NewChatModal
          mode={newChatMode}
          users={state.users}
          currentUser={currentUser}
          onCreateChat={handleCreateChat}
          onClose={() => setNewChatMode(null)}
        />
      )}

      {callState && (
        <CallModal
          callType={callState.type}
          caller={currentUser}
          callee={callState.partner}
          onEnd={() => setCallState(null)}
        />
      )}
    </div>
  );
}
