import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, UserX, UserCheck, Plus, Search, Filter, Calendar, 
  Trash2, RefreshCw, CheckCircle, AlertCircle, Edit, Info
} from 'lucide-react';
import { BlacklistItem } from '../utils/blacklist';

interface AdminBlacklistProps {
  lang: 'uz' | 'ru';
}

export default function AdminBlacklist({ lang }: AdminBlacklistProps) {
  // Blacklist items state
  const [blacklist, setBlacklist] = useState<BlacklistItem[]>(() => {
    const saved = localStorage.getItem('blacklist_users');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse blacklist_users", e);
      }
    }
    // Initialize with a mock blacklisted user if empty
    const mockList: BlacklistItem[] = [
      {
        id: 'mock_bl_1',
        ism: 'Sirojiddin G\'ofurov',
        telefon: '+998 90 444 33 22',
        sabab: 'Yolg\'on xabar',
        sana: '2026-06-25',
        holat: 'faol',
        admin_izoh: 'Bir necha marta mavjud bo\'lmagan avtohalokat bo\'yicha ariza yubordi.'
      },
      {
        id: 'mock_bl_2',
        ism: 'Shavkat Jumayev',
        telefon: '+998 90 111 22 33',
        sabab: 'Soxta ma\'lumot',
        sana: '2026-06-28',
        holat: 'no-faol',
        admin_izoh: 'Soxta pasport rasmini yukladi.',
        restorationReason: 'Kechirim so\'radi va to\'g\'ri hujjatlarni taqdim etdi.'
      }
    ];
    localStorage.setItem('blacklist_users', JSON.stringify(mockList));
    return mockList;
  });

  // Save changes
  useEffect(() => {
    localStorage.setItem('blacklist_users', JSON.stringify(blacklist));
  }, [blacklist]);

  // Form states to add new blacklist item
  const [showAddForm, setShowAddForm] = useState(false);
  const [newIsm, setNewIsm] = useState('');
  const [newTelefon, setNewTelefon] = useState('');
  const [newSabab, setNewSabab] = useState<'Yolg\'on xabar' | 'Soxta ma\'lumot' | 'Qoidabuzarlik' | 'Boshqa'>('Yolg\'on xabar');
  const [newIzoh, setNewIzoh] = useState('');
  const [formError, setFormError] = useState('');

  // Restoration / Removal modal states
  const [restoringItem, setRestoringItem] = useState<BlacklistItem | null>(null);
  const [restorationReasonText, setRestorationReasonText] = useState('');

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterReason, setFilterReason] = useState('Barchasi');
  const [filterStatus, setFilterStatus] = useState('Barchasi'); // 'Barchasi' | 'faol' | 'no-faol'

  // Submit adding to blacklist
  const handleAddToBlacklist = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!newIsm.trim() || !newTelefon.trim() || !newIzoh.trim()) {
      setFormError("Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    // Verify duplication
    const cleanNewPhone = newTelefon.replace(/\D/g, '');
    const alreadyExists = blacklist.some(item => 
      item.holat === 'faol' && item.telefon.replace(/\D/g, '') === cleanNewPhone
    );

    if (alreadyExists) {
      setFormError("Ushbu telefon raqami allaqachon faol qora ro'yxatda mavjud!");
      return;
    }

    const newItem: BlacklistItem = {
      id: 'bl_' + Math.random().toString(36).substring(2, 9),
      ism: newIsm.trim(),
      telefon: newTelefon.trim(),
      sabab: newSabab,
      sana: new Date().toISOString().split('T')[0],
      holat: 'faol',
      admin_izoh: newIzoh.trim()
    };

    setBlacklist([newItem, ...blacklist]);
    setNewIsm('');
    setNewTelefon('');
    setNewSabab('Yolg\'on xabar');
    setNewIzoh('');
    setShowAddForm(false);
  };

  // Submit restoring a blacklisted user
  const handleRestoreUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoringItem || !restorationReasonText.trim()) return;

    setBlacklist(prev => prev.map(item => {
      if (item.id === restoringItem.id) {
        return {
          ...item,
          holat: 'no-faol',
          restorationReason: restorationReasonText.trim()
        };
      }
      return item;
    }));

    setRestoringItem(null);
    setRestorationReasonText('');
  };

  // Delete completely from database (hard delete)
  const handleDeleteHard = (id: string) => {
    if (!window.confirm("Ushbu ma'lumotni qora ro'yxat bazasidan butunlay o'chirib tashlamoqchimisiz?")) {
      return;
    }
    setBlacklist(prev => prev.filter(item => item.id !== id));
  };

  // Filtered blacklist
  const filteredList = blacklist.filter(item => {
    // Search filter
    const matchesSearch = item.ism.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.telefon.replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''));
    
    // Reason filter
    const matchesReason = filterReason === 'Barchasi' || item.sabab === filterReason;

    // Status filter
    const matchesStatus = filterStatus === 'Barchasi' || item.holat === filterStatus;

    return matchesSearch && matchesReason && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* HEADER SECTION WITH ACTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0D1017] p-5 rounded-2xl border border-[#1F2937]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <UserX className="w-5 h-5 text-rose-500" />
            <span>Tizim Qora Ro'yxati (Blacklist)</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            Yolg'on ma'lumot jo'natgan, soxta arizalar yuborgan yoki qoidalarni buzgan foydalanuvchilar ustidan nazorat.
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 shadow-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Foydalanuvchi qo'shish</span>
        </button>
      </div>

      {/* ADD BLACKLIST FORM MODAL/DRAWER */}
      {showAddForm && (
        <div className="bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937] space-y-4 animate-fade-in">
          <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-500 animate-pulse" />
            <span>Yangi Qoidabuzarni Qora Ro'yxatga Qo'shish</span>
          </h4>

          {formError && (
            <div className="bg-rose-950/40 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleAddToBlacklist} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Foydalanuvchi ismi *</label>
              <input
                type="text"
                required
                placeholder="Abdulla Karimov"
                value={newIsm}
                onChange={(e) => setNewIsm(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Telefon raqami *</label>
              <input
                type="text"
                required
                placeholder="+998 90 123 45 67"
                value={newTelefon}
                onChange={(e) => setNewTelefon(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Bloklash sababi *</label>
              <select
                value={newSabab}
                onChange={(e) => setNewSabab(e.target.value as any)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 cursor-pointer"
              >
                <option value="Yolg'on xabar">Yolg'on xabar</option>
                <option value="Soxta ma'lumot">Soxta ma'lumot</option>
                <option value="Qoidabuzarlik">Qoidabuzarlik</option>
                <option value="Boshqa">Boshqa</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Admin izohi / Batafsil *</label>
              <input
                type="text"
                required
                placeholder="Nega bloklanayotganining tafsiloti"
                value={newIzoh}
                onChange={(e) => setNewIzoh(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
              />
            </div>

            <div className="md:col-span-4 flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
              >
                Bloklash (Qora ro'yxatga)
              </button>
            </div>
          </form>
        </div>
      )}

      {/* RESTORE POPUP MODAL */}
      {restoringItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#0D1017] border border-[#1F2937] p-6 rounded-2xl max-w-md w-full space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center gap-2.5 text-emerald-400">
              <UserCheck className="w-6 h-6" />
              <h4 className="text-base font-bold text-white">Qora ro'yxatdan chiqarish</h4>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              Siz <strong>{restoringItem.ism}</strong> ({restoringItem.telefon}) foydalanuvchini faol blokdan chiqarmoqchisiz. Iltimos, sababini kiriting:
            </p>

            <form onSubmit={handleRestoreUser} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Tiklash sababi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Kechirim so'radi / Jarima to'ladi / Tuzatdi"
                  value={restorationReasonText}
                  onChange={(e) => setRestorationReasonText(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setRestoringItem(null)}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg"
                >
                  Blokdan chiqarish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTERS & SEARCH CONTAINER */}
      <div className="bg-[#0D1017] p-5 rounded-2xl border border-[#1F2937] grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        
        {/* Search */}
        <div className="relative md:col-span-2">
          <input
            type="text"
            placeholder="Ism yoki telefon raqami bo'yicha qidiruv..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 pl-10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
        </div>

        {/* Reason Filter */}
        <div className="relative">
          <select
            value={filterReason}
            onChange={(e) => setFilterReason(e.target.value)}
            className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="Barchasi">Barcha Sabablar</option>
            <option value="Yolg'on xabar">Yolg'on xabar</option>
            <option value="Soxta ma'lumot">Soxta ma'lumot</option>
            <option value="Qoidabuzarlik">Qoidabuzarlik</option>
            <option value="Boshqa">Boshqa</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none cursor-pointer"
          >
            <option value="Barchasi">Barcha Holatlar</option>
            <option value="faol">Faol Bloklanganlar</option>
            <option value="no-faol">Blokdan chiqarilganlar</option>
          </select>
        </div>

      </div>

      {/* TABLE/LIST OF BLACKLISTED USERS */}
      <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#161B22] border-b border-[#1F2937] text-gray-400">
                <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Foydalanuvchi</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Sana</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Blok sababi</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Tafsilotlar & Admin Izohi</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px]">Holati</th>
                <th className="p-4 font-bold uppercase tracking-wider text-[10px] text-right">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2937]/50">
              {filteredList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-gray-500 italic">
                    Qora ro'yxatda birorta ham mos foydalanuvchi topilmadi.
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-800/10 transition-colors">
                    <td className="p-4">
                      <div className="font-semibold text-white">{item.ism}</div>
                      <div className="text-[10px] text-gray-500 font-mono mt-0.5">{item.telefon}</div>
                    </td>
                    <td className="p-4 text-gray-400 whitespace-nowrap">
                      {item.sana}
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                        item.sabab === 'Yolg\'on xabar' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        item.sabab === 'Soxta ma\'lumot' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                        item.sabab === 'Qoidabuzarlik' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}>
                        {item.sabab}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs">
                      <p className="text-gray-300 leading-normal text-[11px]">{item.admin_izoh}</p>
                      {item.restorationReason && (
                        <p className="text-emerald-400 text-[10px] mt-1 italic flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          <span>Tiklash sababi: {item.restorationReason}</span>
                        </p>
                      )}
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                        item.holat === 'faol' ? 'text-rose-400' : 'text-gray-500'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.holat === 'faol' ? 'bg-rose-500 animate-pulse' : 'bg-gray-700'}`}></span>
                        <span>{item.holat === 'faol' ? 'Faol Blokda' : 'Blokdan chiqarilgan'}</span>
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex gap-2 justify-end">
                        {item.holat === 'faol' ? (
                          <button
                            onClick={() => setRestoringItem(item)}
                            className="bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Blokdan chiqarish"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            <span>Tiklash</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              if (window.confirm("Ushbu foydalanuvchini qayta bloklamoqchimisiz?")) {
                                setBlacklist(prev => prev.map(bl => bl.id === item.id ? { ...bl, holat: 'faol' } : bl));
                              }
                            }}
                            className="bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/20 text-rose-400 text-[10px] font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                            title="Qayta bloklash"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>Qayta bloklash</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteHard(item.id)}
                          className="bg-gray-800 hover:bg-red-950/30 text-gray-500 hover:text-red-400 p-1.5 rounded-lg transition-all cursor-pointer border border-[#1F2937]"
                          title="Butunlay o'chirish"
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
      </div>

    </div>
  );
}
