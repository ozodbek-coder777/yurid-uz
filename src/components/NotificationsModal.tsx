import React, { useState, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, MessageSquare, Shield, Clock, AlertCircle, FileText, Sparkles, Filter } from 'lucide-react';

export interface SystemNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'case_update' | 'chat_message' | 'verification' | 'payment' | 'dispute' | 'system';
  isRead: boolean;
  createdAt: string;
  linkTab?: string;
}

interface NotificationsModalProps {
  lang: 'uz' | 'ru';
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
  onNavigateTab?: (tabName: string) => void;
}

export default function NotificationsModal({
  lang,
  isOpen,
  onClose,
  currentUser,
  onNavigateTab
}: NotificationsModalProps) {
  const isUz = lang === 'uz';
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const userId = currentUser?.id || currentUser?.uid || currentUser?.email || 'guest';

  // Load notifications from local storage / API
  const loadNotifications = () => {
    try {
      const stored = localStorage.getItem(`notifications_${userId}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        // Sample default welcome notifications
        const defaultNotifs: SystemNotification[] = [
          {
            id: 'notif_welcome',
            userId,
            title: isUz ? "Yurid.uz Portaliga Xush Kelibsiz!" : "Добро пожаловать на Yurid.uz!",
            message: isUz 
              ? "Tizimda rasmiy yuridik maslahat va advokatlik arizalarini yuborishingiz mumkin. Barcha ma'lumotlar maxfiy va xavfsiz saqlanadi." 
              : "Вы можете отправлять официальные заявки на юридическую помощь. Все данные строго конфиденциальны.",
            type: 'system',
            isRead: false,
            createdAt: new Date().toISOString()
          },
          {
            id: 'notif_disclaimer',
            userId,
            title: isUz ? "Xavfsizlik va Maxfiylik eslatmasi" : "Напоминание о безопасности",
            message: isUz 
              ? "Platformadagi AI tahlillari axborot berish maqsadida taqdim etiladi. Shaxsga doir ma'lumotlar O'RQ-547 Qonuniga muvofiq himoyalangan." 
              : "Анализ ИИ носит ознакомительный характер. Ваши данные защищены Законом ЗРУ-547.",
            type: 'verification',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000).toISOString()
          }
        ];
        setNotifications(defaultNotifs);
        localStorage.setItem(`notifications_${userId}`, JSON.stringify(defaultNotifs));
      }
    } catch (e) {
      console.error("Error loading notifications:", e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, userId]);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem(`notifications_${userId}`, JSON.stringify(updated));
  };

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter(n => filter === 'all' || !n.isRead);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const getNotifIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'case_update':
        return <FileText className="w-4 h-4 text-blue-400" />;
      case 'chat_message':
        return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'verification':
        return <Shield className="w-4 h-4 text-amber-400" />;
      case 'payment':
        return <Sparkles className="w-4 h-4 text-cyan-400" />;
      case 'dispute':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Bell className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 max-w-lg w-full space-y-5 relative shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F2937] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-sans font-bold text-white text-base flex items-center gap-2">
                <span>{isUz ? "Bildirishnomalar va Xabarlar" : "Уведомления и Сообщения"}</span>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                    {unreadCount} {isUz ? "yangi" : "новые"}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-400">
                {isUz ? "Arizalar holati, chatlar va xabarnomalar markazi" : "Центр обновлений по заявкам и сообщениям"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl bg-[#161B22] hover:bg-[#1F2937] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter and Action controls */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex bg-[#161B22] p-1 rounded-xl border border-[#1F2937]">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'all' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUz ? "Barchasi" : "Все"} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                filter === 'unread' ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              {isUz ? "O'qilmagan" : "Непрочитанные"} ({unreadCount})
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>{isUz ? "Barchasini o'qilgan qilish" : "Prochitat' vse"}</span>
            </button>
          )}
        </div>

        {/* Notifications List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-gray-500">
              <Bell className="w-8 h-8 mx-auto opacity-30" />
              <p className="text-xs">{isUz ? "Hozircha bildirishnomalar yo'q" : "Уведомлений пока нет"}</p>
            </div>
          ) : (
            filteredNotifs.map((n) => (
              <div
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.linkTab && onNavigateTab) {
                    onNavigateTab(n.linkTab);
                    onClose();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  !n.isRead 
                    ? 'bg-[#161B22] border-amber-500/30 hover:border-amber-500/50' 
                    : 'bg-[#090D14] border-[#1F2937] hover:border-gray-700 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#0D1017] border border-[#1F2937] shrink-0 mt-0.5">
                    {getNotifIcon(n.type)}
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                        {n.title}
                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                        )}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {new Date(n.createdAt).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-300 leading-relaxed">
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-[#1F2937] text-center text-[10px] text-gray-500">
          {isUz ? "Arizangiz yoki habarlaringiz bo'yicha yangi ma'lumotlar avtomatik paydo bo'ladi." : "Обновления поступают автоматически в режиме реального времени."}
        </div>

      </div>
    </div>
  );
}
