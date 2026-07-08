import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Circle, User } from 'lucide-react';
import { getChatRooms, sendChatMessage, markRoomMessagesAsRead, ChatRoom } from '../utils/chatHelper';

interface LawyerChatsProps {
  currentUser: any;
  lang: 'uz' | 'ru';
}

export default function LawyerChats({ currentUser, lang }: LawyerChatsProps) {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const lawyerId = currentUser?.id || 'l_karimov';
  const lawyerName = currentUser?.name || 'Advokat';

  const loadRooms = () => {
    const allRooms = getChatRooms();
    // If admin, show all chats. If individual lawyer, show only their chats.
    const filtered = currentUser?.role === 'admin' 
      ? allRooms 
      : allRooms.filter(r => r.lawyerId === lawyerId);
    setRooms(filtered);
  };

  useEffect(() => {
    loadRooms();
    
    // Listen for updates
    window.addEventListener('yurid_chats_updated', loadRooms);
    return () => {
      window.removeEventListener('yurid_chats_updated', loadRooms);
    };
  }, [lawyerId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedClientId, rooms]);

  const activeRoom = rooms.find(r => r.clientId === selectedClientId);
  const messages = activeRoom ? activeRoom.messages : [];

  // Mark messages as read when viewed by the lawyer
  if (selectedClientId && activeRoom) {
    markRoomMessagesAsRead(selectedClientId, activeRoom.lawyerId, 'lawyer');
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedClientId || !activeRoom) return;

    sendChatMessage(
      selectedClientId,
      activeRoom.clientName,
      activeRoom.lawyerId,
      activeRoom.lawyerName,
      'lawyer',
      messageInput
    );

    setMessageInput('');
    loadRooms();
  };

  const t = {
    uz: {
      title: "Mijozlar bilan Chat xabarlari",
      desc: "Mijozlardan kelib tushgan yuridik savollar va ularga javoblar",
      select_client: "Mijozni tanlang",
      online: "Onlayn",
      type_placeholder: "Javob xabaringizni yozing...",
      no_messages: "Suhbatni boshlash uchun xabar yozing.",
      no_rooms: "Hozircha hech qaysi mijoz siz bilan chat boshlamagan."
    },
    ru: {
      title: "Сообщения клиентов в чате",
      desc: "Юридические вопросы от клиентов и ответы на них",
      select_client: "Выберите клиента",
      online: "Онлайн",
      type_placeholder: "Введите текст вашего ответа...",
      no_messages: "Введите сообщение, чтобы начать диалог.",
      no_rooms: "Пока никто из клиентов не начал с вами чат."
    }
  }[lang];

  return (
    <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl overflow-hidden h-[70vh] flex flex-col shadow-lg">
      {/* Header */}
      <div className="bg-[#161B22] border-b border-[#1F2937] px-6 py-4 shrink-0">
        <h3 className="font-sans font-bold text-white text-base">{t.title}</h3>
        <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
      </div>

      {rooms.length === 0 ? (
        <div className="flex-1 flex flex-col justify-center items-center text-center p-8 space-y-3">
          <MessageSquare className="w-12 h-12 text-gray-700" />
          <h4 className="text-sm font-bold text-gray-400">{lang === 'uz' ? "Suhbatlar mavjud emas" : "Нет доступных диалогов"}</h4>
          <p className="text-xs text-gray-500 max-w-sm">
            {t.no_rooms}
          </p>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Clients list */}
          <div className="w-1/3 border-r border-[#1F2937] flex flex-col bg-[#0A0C10] overflow-y-auto">
            <div className="p-3 border-b border-[#1F2937]/50">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">{t.select_client}</span>
            </div>

            <div className="flex-1 divide-y divide-[#1F2937]/30">
              {rooms.map(r => {
                const unreadCount = r.messages.filter(m => m.sender === 'client' && !m.read).length;
                const lastMsg = r.messages.length > 0 ? r.messages[r.messages.length - 1] : null;

                return (
                  <button
                    key={r.clientId}
                    onClick={() => setSelectedClientId(r.clientId)}
                    className={`w-full p-4 flex gap-3 text-left transition-all hover:bg-gray-800/20 items-start cursor-pointer ${
                      selectedClientId === r.clientId ? 'bg-[#161B22]/60' : ''
                    }`}
                  >
                    <div className="shrink-0 relative">
                      <div className="w-9 h-9 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                        <User className="w-4.5 h-4.5" />
                      </div>
                      <Circle className="w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 rounded-full fill-emerald-500 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <h4 className="text-xs font-bold text-white truncate">{r.clientName}</h4>
                        {unreadCount > 0 && (
                          <span className="bg-rose-500 text-white font-extrabold text-[8px] h-4 w-4 rounded-full flex items-center justify-center tracking-tight shrink-0 animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                      {currentUser?.role === 'admin' && (
                        <p className="text-[9px] text-blue-400 font-mono truncate">{r.lawyerName}</p>
                      )}
                      {lastMsg && (
                        <p className="text-[10px] text-gray-400 truncate mt-1">
                          {lastMsg.sender === 'lawyer' ? 'Siz: ' : ''}{lastMsg.text}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Messaging Feed */}
          <div className="flex-1 flex flex-col bg-[#0D1017]">
            {selectedClientId && activeRoom ? (
              <>
                {/* Active Client Header */}
                <div className="px-5 py-3 border-b border-[#1F2937]/50 bg-[#161B22]/30 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center">
                      <User className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{activeRoom.clientName}</h4>
                      <p className="text-[9px] text-gray-500 font-medium">ID: {activeRoom.clientId}</p>
                    </div>
                  </div>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col justify-center items-center text-center p-8">
                      <p className="text-xs text-gray-500">{t.no_messages}</p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isSelf = m.sender === 'lawyer';
                      const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      
                      return (
                        <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${
                            isSelf 
                              ? 'bg-blue-600 text-white rounded-tr-none' 
                              : 'bg-[#161B22] border border-[#1F2937] text-gray-100 rounded-tl-none'
                          }`}>
                            <p className="text-xs leading-relaxed break-words">{m.text}</p>
                            <div className="flex items-center justify-end">
                              <span className={`text-[8px] font-mono select-none ${isSelf ? 'text-blue-200' : 'text-gray-500'}`}>
                                {timeStr}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Box */}
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[#1F2937]/50 bg-[#161B22]/10 shrink-0 flex gap-2">
                  <input
                    type="text"
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    placeholder={t.type_placeholder}
                    className="flex-1 bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={!messageInput.trim()}
                    className="w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-2">
                <MessageSquare className="w-10 h-10 text-gray-700" />
                <h4 className="text-xs font-bold text-gray-400">{t.select_client}</h4>
                <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                  Muloqotni boshlash yoki javob berish uchun chap tomondagi ro'yxatdan mijozni tanlang.
                </p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
