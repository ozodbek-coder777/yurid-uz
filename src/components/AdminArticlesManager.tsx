import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit3, Trash2, Save, X, Eye, Sparkles } from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { INITIAL_ARTICLES } from '../data/seedData';
import { getArticlesFromFirebase, saveArticleToFirebase, deleteArticleFromFirebase } from '../utils/firebaseHelper';

interface AdminArticlesManagerProps {
  lang?: 'uz' | 'ru';
}

export const AdminArticlesManager: React.FC<AdminArticlesManagerProps> = ({ lang = 'uz' }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      let data = await getArticlesFromFirebase();
      if (!data || data.length === 0) {
        const local = localStorage.getItem('knowledge_base_articles');
        data = local ? JSON.parse(local) : INITIAL_ARTICLES;
      }
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingArticle({
      id: 'art_' + Date.now(),
      title: '',
      category: 'fuqarolik',
      summary: '',
      content: '',
      authorId: null,
      authorName: 'Yurid.uz Advokati',
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (art: Article) => {
    setEditingArticle(art);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Haqiqatdan ham ushbu maqolani o'chirmoqchimisiz?")) return;
    const updated = articles.filter(a => a.id !== id);
    setArticles(updated);
    localStorage.setItem('knowledge_base_articles', JSON.stringify(updated));
    await deleteArticleFromFirebase(id);
    alert("Maqola o'chirildi!");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingArticle || !editingArticle.title.trim() || !editingArticle.content.trim()) {
      alert("Iltimos, sarlavha va kontentni kiriting!");
      return;
    }

    const now = new Date().toISOString();
    const updatedArt: Article = {
      ...editingArticle,
      updatedAt: now,
      createdAt: editingArticle.createdAt || now
    };

    const exists = articles.some(a => a.id === updatedArt.id);
    let newList: Article[];
    if (exists) {
      newList = articles.map(a => a.id === updatedArt.id ? updatedArt : a);
    } else {
      newList = [updatedArt, ...articles];
    }

    setArticles(newList);
    localStorage.setItem('knowledge_base_articles', JSON.stringify(newList));
    
    // Save to Firestore
    await saveArticleToFirebase(updatedArt);
    
    setIsFormOpen(false);
    setEditingArticle(null);
    alert("Maqola muvaffaqiyatli saqlandi!");
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#161B22] border border-[#30363D] p-5 rounded-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-sans">
              {lang === 'ru' ? 'Управление Базой Знаний (FAQ)' : 'Bilimlar Bazasi va Maqolalar Boshqaruvi'}
            </h3>
            <p className="text-xs text-gray-400 font-sans">
              {lang === 'ru' ? 'Создавайте и редактируйте статьи для повышения SEO и конверсии' : 'Foydalanuvchilar va SEO uchun ochiq yuridik maqolalarni boshqaring'}
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md shadow-cyan-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi Maqola Yaratish</span>
        </button>
      </div>

      {/* Article List Table */}
      {loading ? (
        <div className="text-center py-10 text-gray-400 text-xs">Yuklanmoqda...</div>
      ) : (
        <div className="bg-[#161B22] border border-[#30363D] rounded-3xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-[#0D1117] text-gray-400 border-b border-[#30363D] font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="p-4">Sarlavha</th>
                  <th className="p-4">Kategoriya</th>
                  <th className="p-4">Ko'rishlar</th>
                  <th className="p-4">Sana</th>
                  <th className="p-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F2937]">
                {articles.map((art) => (
                  <tr key={art.id} className="hover:bg-[#1C2128]/50 transition-colors">
                    <td className="p-4 font-bold text-white font-sans max-w-xs truncate">
                      {art.title}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                        {art.category}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-400">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-gray-500" />
                        {art.viewCount || 0}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-gray-400 text-[11px]">
                      {art.createdAt ? new Date(art.createdAt).toLocaleDateString('uz-UZ') : ''}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(art)}
                          className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-500/30 transition-all cursor-pointer"
                          title="Tahrirlash"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(art.id)}
                          className="p-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
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
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161B22] border border-[#30363D] rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl relative">
            
            <div className="flex items-center justify-between border-b border-[#30363D] pb-3">
              <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-cyan-400" />
                <span>{editingArticle.id.startsWith('art_') && !articles.some(a => a.id === editingArticle.id) ? "Yangi Maqola Qo'shish" : "Maqolani Tahrirlash"}</span>
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="p-1 text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 font-mono uppercase">Maqola Sarlavhasi *</label>
                <input
                  type="text"
                  required
                  value={editingArticle.title}
                  onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                  placeholder="Masalan: Ajrashishda mol-mulk qanday bo'linadi?"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 font-mono uppercase">Kategoriya</label>
                  <select
                    value={editingArticle.category}
                    onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value as ArticleCategory })}
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  >
                    <option value="oila">Oila Huquqi</option>
                    <option value="mehnat">Mehnat Huquqi</option>
                    <option value="jinoyat">Jinoyat Huquqi</option>
                    <option value="fuqarolik">Fuqarolik Huquqi</option>
                    <option value="biznes">Biznes / Korporativ</option>
                    <option value="boshqa">Boshqa</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-300 font-mono uppercase">Muallif nomi</label>
                  <input
                    type="text"
                    value={editingArticle.authorName || ''}
                    onChange={(e) => setEditingArticle({ ...editingArticle, authorName: e.target.value })}
                    placeholder="Advokat F.I.Sh"
                    className="w-full bg-[#0D1117] border border-[#30363D] focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 font-mono uppercase">Qisqa Tavsif (Summary) *</label>
                <textarea
                  required
                  rows={2}
                  value={editingArticle.summary}
                  onChange={(e) => setEditingArticle({ ...editingArticle, summary: e.target.value })}
                  placeholder="Ro'yxatda va kartochkada ko'rinadigan qisqa 1-2 jumla tavsif"
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-300 font-mono uppercase">To'liq Matn (Markdown formatida) *</label>
                <textarea
                  required
                  rows={8}
                  value={editingArticle.content}
                  onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                  placeholder="### Sarlavha&#10;&#10;To'liq tushuntirish matni va qonunchilik bandlari..."
                  className="w-full bg-[#0D1117] border border-[#30363D] focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-gray-300 font-bold text-xs rounded-xl hover:bg-gray-700"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>Saqlash</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
