import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Circle, User, ShieldCheck } from 'lucide-react';
import { getOrCreateChatRoom, sendChatMessage, markRoomMessagesAsRead, getChatRooms, getLawyerSimReply, ChatRoom } from '../utils/chatHelper';

interface ClientChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'uz' | 'ru';
}

export default function ClientChatModal({ isOpen, onClose, lang }: ClientChatModalProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  
  // Guest login form if not logged in
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isGuestSubmitted, setIsGuestSubmitted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get list of lawyers
  const [lawyers, setLawyers] = useState<any[]>([]);

  useEffect(() => {
    // Read lawyers list from localStorage
    const saved = localStorage.getItem('lawyers_list');
    if (saved) {
      try {
        setLawyers(JSON.parse(saved).filter((l: any) => l.id !== 'admin'));
      } catch (e) {
        console.error(e);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    // Check logged in user
    const savedUser = localStorage.getItem('logged_in_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setCurrentUser(u);
        setIsGuestSubmitted(true);
      } catch (e) {
        console.error(e);
      }
    } else {
      setCurrentUser(null);
      setIsGuestSubmitted(false);
    }
  }, [isOpen]);

  const activeUserId = currentUser ? currentUser.id : 'guest_user';
  const activeUserName = currentUser ? currentUser.ism : guestName || 'Mehmon';

  // Load chat rooms for this client
  const loadRooms = () => {
    if (!isGuestSubmitted) return;
    const allRooms = getChatRooms();
    const clientRooms = allRooms.filter(r => r.clientId === activeUserId);
    setRooms(clientRooms);
  };

  useEffect(() => {
    loadRooms();
    
    // Add event listener for updates
    window.addEventListener('yurid_chats_updated', loadRooms);
    return () => {
      window.removeEventListener('yurid_chats_updated', loadRooms);
    };
  }, [activeUserId, isGuestSubmitted]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [selectedLawyerId, rooms]);

  if (!isOpen) return null;

  // Find active room messages
  const activeRoom = rooms.find(r => r.lawyerId === selectedLawyerId);
  const messages = activeRoom ? activeRoom.messages : [];

  // Mark messages as read when opening a room
  if (selectedLawyerId) {
    markRoomMessagesAsRead(activeUserId, selectedLawyerId, 'client');
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedLawyerId) return;

    const selectedLawyer = lawyers.find(l => l.id === selectedLawyerId);
    const lawyerName = selectedLawyer ? selectedLawyer.name : 'Advokat';

    // 1. Send Client Message
    sendChatMessage(
      activeUserId,
      activeUserName,
      selectedLawyerId,
      lawyerName,
      'client',
      messageInput
    );

    const clientMsg = messageInput;
    setMessageInput('');
    loadRooms();

    // 2. Simulate Lawyer Auto-reply if the lawyer isn't replying in real-time
    // (Wait 3 seconds and send auto-response)
    setTimeout(() => {
      const autoReplyText = getLawyerSimReply(selectedLawyerId, clientMsg, lang);
      sendChatMessage(
        activeUserId,
        activeUserName,
        selectedLawyerId,
        lawyerName,
        'lawyer',
        autoReplyText
      );
      loadRooms();
    }, 2500);
  };

  const t = {
    uz: {
      title: "Advokatlar bilan Chat",
      subtitle: "Savollaringizni to'g'ridan-to'g'ri mutaxassisga yo'llang",
      guest_title: "Xabar Yo'llash",
      guest_desc: "Advokatlar bilan muloqot qilish uchun ism va telefon raqamingizni kiriting:",
      name_label: "Ismingiz",
      phone_label: "Telefon raqamingiz",
      btn_start: "Suhbatni Boshlash",
      select_lawyer: "Advokatni tanlang",
      online: "Onlayn",
      offline: "Offline",
      type_placeholder: "Xabaringizni yozing...",
      no_messages: "Suhbatni boshlash uchun birinchi xabarni yozing."
    },
    ru: {
      title: "Чат с адвокатами",
      subtitle: "Задайте свои вопросы напрямую специалисту",
      guest_title: "Отправить сообщение",
      guest_desc: "Введите имя и номер телефона, чтобы начать общение с адвокатами:",
      name_label: "Ваше имя",
      phone_label: "Номер телефона",
      btn_start: "Начать чат",
      select_lawyer: "Выберите адвоката",
      online: "Онлайн",
      offline: "Офлайн",
      type_placeholder: "Введите ваше сообщение...",
      no_messages: "Напишите первое сообщение, чтобы начать диалог."
    }
  }[lang];

  // Helper to determine lawyer status dynamically
  const isLawyerOnline = (id: string) => {
    // Alisher Karimov & Dilora Saidova are Online, others offline for simulation realism
    return id === 'l_karimov' || id === 'l_saidova';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#0D1017] border border-[#1F2937] w-full max-w-3xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-fade-in">
        
        {/* Header */}
        <div className="bg-[#161B22] border-b border-[#1F2937] px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-white text-sm">{t.title}</h3>
              <p className="text-[10px] text-gray-400">{t.subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800/50 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Guest Setup Screen if not logged in & no guest info */}
        {!isGuestSubmitted ? (
          <div className="flex-1 p-8 flex items-center justify-center">
            <div className="max-w-md w-full bg-[#161B22] border border-[#1F2937] p-6 rounded-2xl space-y-4">
              <div className="text-center space-y-2">
                <h4 className="text-sm font-bold text-white">{t.guest_title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{t.guest_desc}</p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                if (guestName.trim() && guestPhone.trim()) {
                  setIsGuestSubmitted(true);
                  loadRooms();
                }
              }} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">{t.name_label}</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Karimov Alisher"
                    className="w-full bg-[#0D1017] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-gray-400">{t.phone_label}</label>
                  <input
                    type="text"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-[#0D1017] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {t.btn_start}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Main Chat Layout split into Sidebar & Messaging view */
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar with Lawyers list */}
            <div className="w-1/3 border-r border-[#1F2937] flex flex-col bg-[#0A0C10] overflow-y-auto">
              <div className="p-3 border-b border-[#1F2937]/50">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">{t.select_lawyer}</span>
              </div>
              
              <div className="flex-1 divide-y divide-[#1F2937]/30">
                {lawyers.map(l => {
                  const isOnline = isLawyerOnline(l.id);
                  const room = rooms.find(r => r.lawyerId === l.id);
                  const unreadCount = room ? room.messages.filter(m => m.sender === 'lawyer' && !m.read).length : 0;
                  const lastMessage = room && room.messages.length > 0 ? room.messages[room.messages.length - 1] : null;

                  return (
                    <button
                      key={l.id}
                      onClick={() => setSelectedLawyerId(l.id)}
                      className={`w-full p-4 flex gap-3 text-left transition-all hover:bg-gray-800/20 items-start cursor-pointer ${
                        selectedLawyerId === l.id ? 'bg-[#161B22]/60' : ''
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-9 h-9 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
                          <User className="w-4.5 h-4.5" />
                        </div>
                        <Circle className={`w-2.5 h-2.5 absolute -bottom-0.5 -right-0.5 rounded-full ${
                          isOnline ? 'fill-emerald-500 text-emerald-500' : 'fill-gray-600 text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-1">
                          <h4 className="text-xs font-bold text-white truncate">{l.name}</h4>
                          {unreadCount > 0 && (
                            <span className="bg-blue-600 text-white font-extrabold text-[8px] h-4 w-4 rounded-full flex items-center justify-center tracking-tight shrink-0">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">{l.specialization}</p>
                        {lastMessage && (
                          <p className="text-[10px] text-gray-400 truncate mt-1 italic">
                            {lastMessage.sender === 'client' ? 'Siz: ' : ''}{lastMessage.text}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message Pane */}
            <div className="flex-1 flex flex-col bg-[#0D1017]">
              {selectedLawyerId ? (
                <>
                  {/* Active Lawyer Header */}
                  {(() => {
                    const l = lawyers.find(item => item.id === selectedLawyerId);
                    const isOnline = isLawyerOnline(selectedLawyerId);
                    return (
                      <div className="px-5 py-3.5 border-b border-[#1F2937]/50 bg-[#161B22]/30 flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-2.5">
                          <div className="relative">
                            <div className="w-8 h-8 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-lg flex items-center justify-center">
                              <User className="w-4.5 h-4.5" />
                            </div>
                            <div className={`w-2 h-2 rounded-full absolute -bottom-0.5 -right-0.5 border border-[#0D1017] ${
                              isOnline ? 'bg-emerald-500' : 'bg-gray-600'
                            }`} />
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-white leading-tight">{l?.name}</h4>
                            <p className="text-[9px] text-gray-500 font-medium">
                              {isOnline ? t.online : t.offline} • {l?.specialization}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[9px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md font-mono">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>Advokat Tasdiqlangan</span>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Messages Feed */}
                  <div className="flex-1 p-5 overflow-y-auto space-y-4 scrollbar-thin">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col justify-center items-center text-center p-8 space-y-2">
                        <MessageSquare className="w-8 h-8 text-gray-600 animate-pulse" />
                        <p className="text-xs text-gray-500">{t.no_messages}</p>
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isSelf = m.sender === 'client';
                        const timeStr = new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        
                        return (
                          <div key={m.id} className={`flex ${isSelf ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm space-y-1 ${
                              isSelf 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-[#161B22] border border-[#1F2937] text-gray-100 rounded-tl-none'
                            }`}>
                              <p className="text-xs leading-relaxed break-words">{m.text}</p>
                              <div className="flex items-center justify-end gap-1.5">
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

                  {/* Message Input Box */}
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
                  <h4 className="text-xs font-bold text-gray-400">{t.select_lawyer}</h4>
                  <p className="text-[10px] text-gray-500 max-w-xs leading-relaxed">
                    Chap tomondagi ro'yxatdan kerakli advokatni tanlab suhbatni boshlang.
                  </p>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
