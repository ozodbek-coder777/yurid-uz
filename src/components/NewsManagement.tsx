import React, { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, Bookmark, Save, X, Calendar, User, FileText, Globe, AlertCircle, ImageIcon } from 'lucide-react';
import { NewsItem } from '../types';
import { getNews, saveNews, addNews, updateNews, deleteNews } from '../utils/newsHelper';

interface NewsManagementProps {
  lang: 'uz' | 'ru';
}

export default function NewsManagement({ lang }: NewsManagementProps) {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);

  // Form states
  const [sarlavha, setSarlavha] = useState('');
  const [kategoriya, setKategoriya] = useState<NewsItem['kategoriya']>("Qonun o'zgarishlari");
  const [matn, setMatn] = useState('');
  const [rasm, setRasm] = useState('');
  const [muallif, setMuallif] = useState('');
  const [sana, setSana] = useState('');
  const [muhim, setMuhim] = useState(false);

  const loadNews = () => {
    setNewsList(getNews().sort((a, b) => new Date(b.sana).getTime() - new Date(a.sana).getTime()));
  };

  useEffect(() => {
    loadNews();
    window.addEventListener('yurid_news_updated', loadNews);
    return () => window.removeEventListener('yurid_news_updated', loadNews);
  }, []);

  const handleOpenAddForm = () => {
    setEditingNews(null);
    setSarlavha('');
    setKategoriya("Qonun o'zgarishlari");
    setMatn('');
    setRasm('');
    setMuallif('Super Admin');
    setSana(new Date().toISOString().split('T')[0]);
    setMuhim(false);
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (item: NewsItem) => {
    setEditingNews(item);
    setSarlavha(item.sarlavha);
    setKategoriya(item.kategoriya);
    setMatn(item.matn);
    setRasm(item.rasm);
    setMuallif(item.muallif);
    setSana(item.sana);
    setMuhim(item.muhim);
    setIsFormOpen(true);
  };

  const handleDeleteNews = (id: number) => {
    if (window.confirm(lang === 'ru' ? "Вы действительно хотите удалить эту новость?" : "Haqiqatan ham ushbu yangilikni o'chirmoqchimisiz?")) {
      deleteNews(id);
      loadNews();
    }
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sarlavha.trim() || !matn.trim() || !muallif.trim() || !sana) {
      alert(lang === 'ru' ? "Пожалуйста, заполните все обязательные поля!" : "Iltimos, barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    const itemData = {
      sarlavha: sarlavha.trim(),
      kategoriya,
      matn: matn.trim(),
      rasm: rasm.trim(),
      muallif: muallif.trim(),
      sana,
      muhim
    };

    if (editingNews) {
      updateNews({
        ...itemData,
        id: editingNews.id
      });
      alert(lang === 'ru' ? "Новость успешно отредактирована!" : "Yangilik muvaffaqiyatli tahrirlandi!");
    } else {
      addNews(itemData);
      alert(lang === 'ru' ? "Новость успешно опубликована!" : "Yangi yangilik muvaffaqiyatli chop etildi!");
    }

    setIsFormOpen(false);
    loadNews();
  };

  return (
    <div className="space-y-6" id="news-management-root">
      
      {/* HEADER SECTION WITH CREATE BUTTON */}
      {!isFormOpen && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D1017] p-6 rounded-3xl border border-[#1F2937]">
          <div>
            <h3 className="text-lg font-bold text-white">Yangiliklar va e'lonlar boshqaruvi</h3>
            <p className="text-xs text-gray-400">Saytga yangiliklar qo'shing, tahrirlang yoki o'chiring</p>
          </div>
          
          <button
            onClick={handleOpenAddForm}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:shadow-blue-500/20"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Yangi yangilik qo'shish</span>
          </button>
        </div>
      )}

      {/* ADD / EDIT FORM MODAL CONTAINER */}
      {isFormOpen && (
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in max-w-3xl mx-auto shadow-2xl">
          <div className="flex items-center justify-between border-b border-[#1F2937]/50 pb-4">
            <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <span>{editingNews ? "Yangilikni tahrirlash" : "Yangi yangilik qo'shish"}</span>
            </h3>
            <button
              onClick={() => setIsFormOpen(false)}
              className="text-gray-400 hover:text-white p-1 rounded-lg bg-[#161B22] border border-[#1F2937]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSaveSubmit} className="space-y-4 text-xs md:text-sm">
            {/* Title field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400">Yangilik sarlavhasi *</label>
              <input
                type="text"
                required
                value={sarlavha}
                onChange={(e) => setSarlavha(e.target.value)}
                placeholder="Mehnat kodeksiga kiritilgan yangi moddalar..."
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Category, Author, and Date fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Kategoriya *</label>
                <select
                  value={kategoriya}
                  onChange={(e) => setKategoriya(e.target.value as NewsItem['kategoriya'])}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Qonun o'zgarishlari">Qonun o'zgarishlari</option>
                  <option value="Sud amaliyoti">Sud amaliyoti</option>
                  <option value="Firma yangiliklari">Firma yangiliklari</option>
                  <option value="Umumiy">Umumiy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Muallif *</label>
                <input
                  type="text"
                  required
                  value={muallif}
                  onChange={(e) => setMuallif(e.target.value)}
                  placeholder="Ism Familiya"
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-400">Sana *</label>
                <input
                  type="date"
                  required
                  value={sana}
                  onChange={(e) => setSana(e.target.value)}
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                />
              </div>
            </div>

            {/* Photo URL previewer */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-xs font-semibold text-gray-400">Rasm manzili (havola / URL)</label>
                <input
                  type="url"
                  value={rasm}
                  onChange={(e) => setRasm(e.target.value)}
                  placeholder="https://images.unsplash.com/... (yoki bo'sh qoldiring)"
                  className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
              {/* Photo preview container */}
              <div className="bg-[#161B22] border border-[#1F2937] rounded-xl p-2 h-[38px] flex items-center justify-center text-[10px] text-gray-500">
                {rasm ? (
                  <img src={rasm} alt="Preview" className="h-full w-full object-contain rounded" referrerPolicy="no-referrer" />
                ) : (
                  <span className="flex items-center gap-1"><ImageIcon className="w-3.5 h-3.5" /> Rasm yo'q</span>
                )}
              </div>
            </div>

            {/* Muhim e'lon checkbox */}
            <div className="flex items-center gap-2.5 bg-[#161B22] p-3.5 rounded-xl border border-[#1F2937]">
              <input
                type="checkbox"
                id="is-important-checkbox"
                checked={muhim}
                onChange={(e) => setMuhim(e.target.checked)}
                className="w-4.5 h-4.5 accent-blue-600 rounded cursor-pointer"
              />
              <label htmlFor="is-important-checkbox" className="text-xs font-bold text-amber-400 cursor-pointer flex items-center gap-1.5 select-none">
                <Bookmark className={`w-4 h-4 ${muhim ? 'fill-amber-400 text-amber-400' : 'text-gray-500'}`} />
                <span>Muhim e'lon sifatida belgilash (kabinet va ro'yxatda alohida belgilanadi)</span>
              </label>
            </div>

            {/* HTML text area editor */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-400 block">Yangilik matni (HTML kodidan foydalanish mumkin) *</label>
              <textarea
                required
                rows={10}
                value={matn}
                onChange={(e) => setMatn(e.target.value)}
                placeholder="<p>Bu yerga batafsil matn yoziladi...</p><p>Yangi xatboshilarni p teglari bilan ajrating...</p>"
                className="w-full bg-[#161B22] border border-[#1F2937] rounded-xl p-4 text-xs text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Form actions */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="bg-gray-800 hover:bg-gray-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Chop etish / Saqlash</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* LIST OF NEWS TABLE / CARDS */}
      {!isFormOpen && (
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl overflow-hidden shadow-md">
          {newsList.length === 0 ? (
            <div className="text-center py-12 text-gray-500 font-medium space-y-2">
              <AlertCircle className="w-10 h-10 text-gray-600 mx-auto" />
              <p>Tizimda hozircha birorta ham yangilik qo'shilmagan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-[#1F2937] text-gray-400 bg-[#161B22]/55">
                    <th className="py-3 px-4 font-semibold">Mavzu / Sarlavha</th>
                    <th className="py-3 px-4 font-semibold">Kategoriya</th>
                    <th className="py-3 px-4 font-semibold">Muallif va Sana</th>
                    <th className="py-3 px-4 font-semibold text-right">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1F2937]/50">
                  {newsList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-all">
                      <td className="py-4 px-4 max-w-md">
                        <div className="flex items-center gap-2">
                          {item.muhim && (
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Muhim
                            </span>
                          )}
                          <p className="font-bold text-white truncate">{item.sarlavha}</p>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {item.kategoriya}
                        </span>
                      </td>
                      <td className="py-4 px-4 space-y-0.5">
                        <div className="flex items-center gap-1 text-[11px] text-gray-300">
                          <User className="w-3 h-3 text-blue-500" />
                          <span>{item.muallif}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-gray-500 font-mono">
                          <Calendar className="w-3 h-3" />
                          <span>{item.sana}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditForm(item)}
                            className="p-1.5 bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 rounded-lg transition-all cursor-pointer"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="p-1.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 rounded-lg transition-all cursor-pointer"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
