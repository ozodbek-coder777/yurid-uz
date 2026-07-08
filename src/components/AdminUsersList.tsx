import React, { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, X, Check, Mail, Phone, MapPin, Lock, Calendar, Users } from 'lucide-react';

interface RegisteredUser {
  id: string;
  ism: string;
  telefon: string;
  email: string;
  manzil: string;
  parol: string;
  rasm: string | null;
  sana?: string;
}

interface AdminUsersListProps {
  lang: 'uz' | 'ru';
}

export default function AdminUsersList({ lang }: AdminUsersListProps) {
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<RegisteredUser | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Load users from localStorage
  const loadUsers = () => {
    const raw = localStorage.getItem('user_profiles');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setUsers(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse user_profiles', e);
      }
    }
    // Set some defaults if empty so there is data to manage
    const defaultUsers: RegisteredUser[] = [
      {
        id: 'u_client1',
        ism: 'Sardor Rahimov',
        telefon: '+998 93 456 12 34',
        email: 'sardor@mail.uz',
        manzil: 'Toshkent sh., Chilonzor tumani',
        parol: 'user123',
        rasm: null,
        sana: '2026-06-15'
      },
      {
        id: 'u_client2',
        ism: 'Madina Umarova',
        telefon: '+998 90 987 65 43',
        email: 'madina@gmail.com',
        manzil: 'Samarqand sh., Dahbed ko\'chasi',
        parol: 'madina99',
        rasm: null,
        sana: '2026-06-20'
      }
    ];
    localStorage.setItem('user_profiles', JSON.stringify(defaultUsers));
    setUsers(defaultUsers);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered users
  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.ism || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.telefon || '').toLowerCase().includes(q) ||
      (u.manzil || '').toLowerCase().includes(q)
    );
  });

  const handleDelete = (id: string) => {
    const confirmMsg = lang === 'uz' 
      ? "Haqiqatan ham ushbu foydalanuvchini tizimdan butunlay o'chirmoqchimisiz? Ushbu amal ortga qaytarilmaydi!" 
      : "Вы действительно хотите полностью удалить этого пользователя из системы? Это действие необратимо!";
    
    if (!window.confirm(confirmMsg)) return;

    const updated = users.filter(u => u.id !== id);
    setUsers(updated);
    localStorage.setItem('user_profiles', JSON.stringify(updated));

    // If deleted user was currently logged in, they will be logged out dynamically next time they load
    alert(lang === 'uz' ? "Foydalanuvchi muvaffaqiyatli o'chirildi!" : "Пользователь успешно удален!");
  };

  const handleEditClick = (user: RegisteredUser) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editingUser.ism.trim() || !editingUser.email.trim()) {
      alert(lang === 'uz' ? "Ism va elektron pochta maydonlari to'ldirilishi shart!" : "Поля Имя и Email обязательны для заполнения!");
      return;
    }

    const updated = users.map(u => u.id === editingUser.id ? editingUser : u);
    setUsers(updated);
    localStorage.setItem('user_profiles', JSON.stringify(updated));
    setShowEditModal(false);
    setEditingUser(null);
    alert(lang === 'uz' ? "Foydalanuvchi ma'lumotlari yangilandi!" : "Данные пользователя успешно обновлены!");
  };

  return (
    <div id="admin-users-list-section" className="bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937] space-y-6 text-gray-200 animate-fade-in">
      {/* Header and Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>{lang === 'uz' ? "Mijozlar va Foydalanuvchilarni Boshqarish" : "Управление клиентами и пользователями"}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'uz' 
              ? "Tizimda ro'yxatdan o'tgan barcha mijozlar bazasini ko'rish, tahrirlash va o'chirish" 
              : "Просмотр, редактирование и удаление базы всех зарегистрированных клиентов в системе"}
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'uz' ? "Ism, email yoki telefon..." : "Имя, email или телефон..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#161B22] border border-[#1F2937] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Users Count Banner */}
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs">
        <span className="flex h-2 w-2 rounded-full bg-blue-500"></span>
        <span className="text-gray-400">
          {lang === 'uz' 
            ? `Jami ro'yxatdan o'tgan foydalanuvchilar soni: ` 
            : `Всего зарегистрированных пользователей: `}
          <strong className="text-blue-400 font-mono text-sm">{filteredUsers.length}</strong>
        </span>
      </div>

      {/* Users Table */}
      <div className="overflow-x-auto border border-[#1F2937] rounded-xl bg-[#090D14]">
        <table className="w-full border-collapse text-left text-xs text-gray-300">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#161B22]">
              <th className="p-4 font-semibold text-gray-400">{lang === 'uz' ? "Mijoz (Foydalanuvchi)" : "Клиент (Пользователь)"}</th>
              <th className="p-4 font-semibold text-gray-400">{lang === 'uz' ? "Aloqa ma'lumotlari" : "Контактные данные"}</th>
              <th className="p-4 font-semibold text-gray-400">{lang === 'uz' ? "Manzil" : "Адрес"}</th>
              <th className="p-4 font-semibold text-gray-400">{lang === 'uz' ? "Ro'yxatdan o'tgan" : "Зарегистрирован"}</th>
              <th className="p-4 font-semibold text-gray-400 text-center">{lang === 'uz' ? "Amallar" : "Действия"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {lang === 'uz' ? "Foydalanuvchilar topilmadi." : "Пользователи не найдены."}
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600/20 to-teal-500/20 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-sm uppercase">
                        {u.ism ? u.ism.substring(0, 2) : 'MI'}
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{u.ism}</div>
                        <div className="text-[10px] text-gray-500 font-mono mt-0.5">ID: {u.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 space-y-1">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Mail className="w-3.5 h-3.5 text-gray-500" />
                      <span>{u.email}</span>
                    </div>
                    {u.telefon && (
                      <div className="flex items-center gap-1.5 text-gray-400 font-mono">
                        <Phone className="w-3.5 h-3.5 text-gray-500" />
                        <span>{u.telefon}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Lock className="w-3.5 h-3.5 text-gray-500" />
                      <span className="bg-[#161B22] px-1.5 py-0.5 rounded border border-gray-800 font-mono text-[10px] text-teal-400">
                        {u.parol}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.manzil ? (
                      <div className="flex items-center gap-1.5 text-gray-400 max-w-xs truncate" title={u.manzil}>
                        <MapPin className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span>{u.manzil}</span>
                      </div>
                    ) : (
                      <span className="text-gray-600 italic">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-gray-400 font-mono text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{u.sana || '2026-07-01'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        onClick={() => handleEditClick(u)}
                        className="p-1.5 bg-blue-500/10 hover:bg-blue-500 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        title={lang === 'uz' ? "Tahrirlash" : "Редактировать"}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="p-1.5 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-600 text-red-400 hover:text-white rounded-lg transition-all cursor-pointer"
                        title={lang === 'uz' ? "O'chirish" : "Удалить"}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-[#1F2937] bg-[#161B22]">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-400" />
                <span>{lang === 'uz' ? "Mijoz ma'lumotlarini tahrirlash" : "Редактирование данных клиента"}</span>
              </h4>
              <button 
                onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">{lang === 'uz' ? "Foydalanuvchi ismi" : "Имя пользователя"}</label>
                <input
                  type="text"
                  value={editingUser.ism}
                  onChange={(e) => setEditingUser({ ...editingUser, ism: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">Elektron pochta (Email)</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">{lang === 'uz' ? "Telefon raqami" : "Номер телефона"}</label>
                <input
                  type="text"
                  value={editingUser.telefon}
                  onChange={(e) => setEditingUser({ ...editingUser, telefon: e.target.value })}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">{lang === 'uz' ? "Kirish paroli" : "Пароль входа"}</label>
                <input
                  type="text"
                  value={editingUser.parol}
                  onChange={(e) => setEditingUser({ ...editingUser, parol: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-400">{lang === 'uz' ? "Yashash manzili" : "Адрес проживания"}</label>
                <input
                  type="text"
                  value={editingUser.manzil}
                  onChange={(e) => setEditingUser({ ...editingUser, manzil: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#1F2937] text-xs text-white bg-[#161B22] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end items-center gap-3 pt-4 border-t border-[#1F2937]">
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setEditingUser(null); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {lang === 'uz' ? "Bekor qilish" : "Отмена"}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{lang === 'uz' ? "Saqlash" : "Сохранить"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
