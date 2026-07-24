import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Search, 
  Filter, 
  Eye, 
  Clock, 
  User, 
  ArrowRight, 
  X, 
  Sparkles, 
  Scale, 
  Briefcase, 
  ShieldAlert, 
  Users, 
  Building2, 
  FileText,
  MessageSquare
} from 'lucide-react';
import { Article, ArticleCategory } from '../types';
import { INITIAL_ARTICLES } from '../data/seedData';
import { getArticlesFromFirebase, incrementArticleViewCountInFirebase, saveArticleToFirebase } from '../utils/firebaseHelper';

interface KnowledgeBaseProps {
  onConnectLawyer: (category?: string, articleTitle?: string) => void;
  lang?: 'uz' | 'ru';
}

const CATEGORIES: { id: 'barchasi' | ArticleCategory; labelUz: string; labelRu: string; icon: any }[] = [
  { id: 'barchasi', labelUz: 'Barchasi', labelRu: 'Все', icon: BookOpen },
  { id: 'oila', labelUz: 'Oila Huquqi', labelRu: 'Семейное', icon: Users },
  { id: 'mehnat', labelUz: 'Mehnat Huquqi', labelRu: 'Трудовое', icon: Briefcase },
  { id: 'jinoyat', labelUz: 'Jinoyat Huquqi', labelRu: 'Уголовное', icon: ShieldAlert },
  { id: 'fuqarolik', labelUz: 'Fuqarolik Huquqi', labelRu: 'Гражданское', icon: Scale },
  { id: 'biznes', labelUz: 'Biznes va Korporativ', labelRu: 'Бизнес', icon: Building2 },
  { id: 'boshqa', labelUz: 'Boshqa Masalalar', labelRu: 'Прочее', icon: FileText },
];

export const KnowledgeBase: React.FC<KnowledgeBaseProps> = ({ onConnectLawyer, lang = 'uz' }) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<'barchasi' | ArticleCategory>('barchasi');
  const [activeArticle, setActiveArticle] = useState<Article | null>(null);

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    setLoading(true);
    try {
      let fbArticles = await getArticlesFromFirebase();
      if (!fbArticles || fbArticles.length === 0) {
        // Fallback to local storage or initial seed
        const local = localStorage.getItem('knowledge_base_articles');
        if (local) {
          fbArticles = JSON.parse(local);
        } else {
          fbArticles = INITIAL_ARTICLES;
          localStorage.setItem('knowledge_base_articles', JSON.stringify(INITIAL_ARTICLES));
          // Seed Firebase in background if empty
          INITIAL_ARTICLES.forEach(art => saveArticleToFirebase(art).catch(() => {}));
        }
      } else {
        localStorage.setItem('knowledge_base_articles', JSON.stringify(fbArticles));
      }
      setArticles(fbArticles);
    } catch (err) {
      console.error("Articles loading error:", err);
      const local = localStorage.getItem('knowledge_base_articles');
      setArticles(local ? JSON.parse(local) : INITIAL_ARTICLES);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenArticle = async (article: Article) => {
    const updated = { ...article, viewCount: (article.viewCount || 0) + 1 };
    setActiveArticle(updated);
    
    // Increment count locally
    setArticles(prev => prev.map(a => a.id === article.id ? updated : a));
    const localList = articles.map(a => a.id === article.id ? updated : a);
    localStorage.setItem('knowledge_base_articles', JSON.stringify(localList));

    // Increment in Firestore
    incrementArticleViewCountInFirebase(article.id, article.viewCount || 0).catch(() => {});
  };

  // Filtering
  const filteredArticles = articles.filter(art => {
    const matchesCategory = selectedCategory === 'barchasi' || art.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      art.title.toLowerCase().includes(query) || 
      art.summary.toLowerCase().includes(query) || 
      art.content.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  const getCategoryLabel = (cat: ArticleCategory) => {
    const found = CATEGORIES.find(c => c.id === cat);
    return lang === 'ru' ? (found?.labelRu || cat) : (found?.labelUz || cat);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0D1117] via-[#161B22] to-[#1F2937] border border-[#30363D] p-6 sm:p-8 shadow-xl">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-bold font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{lang === 'ru' ? 'База Правовых Знаний — Бесплатный доступ' : 'Bepul Huquqiy Bilimlar Bazasi — Ochiq Kirish'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-sans tracking-tight leading-tight">
            {lang === 'ru' 
              ? 'Простые ответы на сложные юридические вопросы' 
              : 'Murakkab yuridik savollarga oddiy va tushunarli javoblar'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed font-sans">
            {lang === 'ru'
              ? 'Разберитесь в своих правах без сложностей и терминов. Статьи подготовлены ведущими юристами Узбекистана.'
              : 'O\'zbekiston qonunchiligi bo\'yicha eng ko\'p uchraydigan huquqiy muammolar, aliment, ajrashish, mehnat shartnomalari va kredit nizolari bo\'yicha tayyor yo\'riqnomalar.'}
          </p>

          {/* Search Bar */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 absolute left-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'ru' ? 'Поиск по статьям, темам, законам...' : 'Mavzu, qonun yoki kalit so\'z bo\'yicha qidiring...'}
                className="w-full bg-[#0D1117]/90 border border-[#30363D] focus:border-cyan-500 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 text-gray-400 hover:text-white text-xs bg-gray-800 p-1 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border ${
                isActive
                  ? 'bg-cyan-500 text-gray-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                  : 'bg-[#161B22] text-gray-400 border-[#30363D] hover:text-white hover:border-gray-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{lang === 'ru' ? cat.labelRu : cat.labelUz}</span>
            </button>
          );
        })}
      </div>

      {/* Articles Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-[#161B22] border border-[#30363D] rounded-2xl p-5 animate-pulse space-y-3">
              <div className="h-4 bg-gray-800 rounded w-1/3" />
              <div className="h-6 bg-gray-800 rounded w-3/4" />
              <div className="h-12 bg-gray-800 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="bg-[#161B22] border border-[#30363D] rounded-3xl p-12 text-center space-y-3">
          <BookOpen className="w-12 h-12 text-gray-600 mx-auto" />
          <h3 className="text-base font-bold text-gray-300">
            {lang === 'ru' ? 'Статьи не найдены' : 'Mavzular bo\'yicha maqola topilmadi'}
          </h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            {lang === 'ru' ? 'Попробуйте изменить запрос или выбрать другую категорию.' : "Qidiruv so'zini o'zgartirib ko'ring yoki bevosita advokatimizga savol yo'llang."}
          </p>
          <button
            onClick={() => onConnectLawyer()}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{lang === 'ru' ? 'Задать вопрос юристу' : 'Advokatga bevosita savol berish'}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredArticles.map((art) => (
            <div
              key={art.id}
              onClick={() => handleOpenArticle(art)}
              className="bg-[#161B22] border border-[#30363D] hover:border-cyan-500/50 rounded-2xl p-5 transition-all cursor-pointer group flex flex-col justify-between space-y-4 hover:shadow-lg hover:shadow-cyan-500/5 relative overflow-hidden"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {getCategoryLabel(art.category)}
                  </span>
                  <div className="flex items-center gap-3 text-gray-400 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" />
                      {art.viewCount || 0}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {art.createdAt ? new Date(art.createdAt).toLocaleDateString('uz-UZ') : 'Yangi'}
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors leading-snug font-sans">
                  {art.title}
                </h3>

                <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 font-sans">
                  {art.summary}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1F2937] flex items-center justify-between">
                <span className="text-[11px] text-gray-500 flex items-center gap-1">
                  <User className="w-3.5 h-3.5" />
                  {art.authorName || 'Yurid.uz Eksperti'}
                </span>
                <span className="text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                  {lang === 'ru' ? 'Читать' : 'To\'liq o\'qish'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Article Detail Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161B22] border border-[#30363D] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl relative">
            
            {/* Header / Close */}
            <div className="flex items-start justify-between border-b border-[#30363D] pb-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono">
                    {getCategoryLabel(activeArticle.category)}
                  </span>
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" /> {activeArticle.viewCount || 1} ko'rildi
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white font-sans leading-snug">
                  {activeArticle.title}
                </h2>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="p-2 rounded-xl bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition-all cursor-pointer shrink-0 ml-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Author & Date info */}
            <div className="flex items-center justify-between text-xs text-gray-400 bg-[#0D1117] p-3 rounded-2xl border border-[#1F2937]">
              <span className="flex items-center gap-1.5 font-medium text-gray-300">
                <User className="w-4 h-4 text-cyan-400" />
                Muallif: {activeArticle.authorName || 'Yurid.uz Eksperti'}
              </span>
              <span className="flex items-center gap-1 font-mono text-[11px]">
                <Clock className="w-3.5 h-3.5 text-gray-500" />
                {activeArticle.createdAt ? new Date(activeArticle.createdAt).toLocaleDateString('uz-UZ') : ''}
              </span>
            </div>

            {/* Markdown Content */}
            <div className="text-sm text-gray-200 leading-relaxed font-sans space-y-4 whitespace-pre-line border-b border-[#30363D] pb-6">
              {activeArticle.content}
            </div>

            {/* Conversion CTA Button - MODUL 2 requirement */}
            <div className="bg-gradient-to-r from-cyan-950/40 via-[#161B22] to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-5 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-cyan-400 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Ushbu mavzu bo'yicha xususiy yordam kerakmi?</span>
              </div>
              <p className="text-xs text-gray-300 max-w-lg mx-auto">
                Huquqlaringizni himoya qilish va hujjatlarni to'g'ri rasmiylashtirish uchun tajribali advokatimiz bilan bevosita bog'laning.
              </p>
              <button
                onClick={() => {
                  const cat = activeArticle.category;
                  const title = activeArticle.title;
                  setActiveArticle(null);
                  onConnectLawyer(cat, title);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-gray-950 font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/25 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto uppercase tracking-wider"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Bu masala bo'yicha advokat bilan bog'lanish</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
