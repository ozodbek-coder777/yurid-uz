import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, User, ChevronRight, ArrowLeft, AlertCircle, Bookmark } from 'lucide-react';
import { NewsItem } from '../types';
import { getNews } from '../utils/newsHelper';

interface NewsSectionProps {
  lang: 'uz' | 'ru';
  onReadNewsId?: number; // Optional prop to open a specific news directly
  onClearReadNewsId?: () => void;
}

export default function NewsSection({ lang, onReadNewsId, onClearReadNewsId }: NewsSectionProps) {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Barchasi');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNews, setActiveNews] = useState<NewsItem | null>(null);

  // Load news list on mount and listen to updates
  const loadNews = () => {
    const list = getNews();
    // Sort by date descending (newest first), if same date sort by id descending
    const sorted = [...list].sort((a, b) => {
      const dateA = new Date(a.sana).getTime();
      const dateB = new Date(b.sana).getTime();
      if (dateB !== dateA) return dateB - dateA;
      return b.id - a.id;
    });
    setNewsList(sorted);

    // If an external read request is passed (e.g., from Home Page click or Cabinet click)
    if (onReadNewsId) {
      const article = list.find(n => n.id === onReadNewsId);
      if (article) {
        setActiveNews(article);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    loadNews();
    window.addEventListener('yurid_news_updated', loadNews);
    return () => window.removeEventListener('yurid_news_updated', loadNews);
  }, [onReadNewsId]);

  const handleBackToList = () => {
    setActiveNews(null);
    if (onClearReadNewsId) {
      onClearReadNewsId();
    }
  };

  const categories = ['Barchasi', "Qonun o'zgarishlari", 'Sud amaliyoti', 'Firma yangiliklari', 'Umumiy'];

  // Filter and search logic
  const filteredNews = newsList.filter(item => {
    const matchesCategory = selectedCategory === 'Barchasi' || item.kategoriya === selectedCategory;
    const matchesSearch = item.sarlavha.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.matn.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.muallif.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Recommendation logic: get 3 other news articles (prefer same category, exclude current)
  const getRecommendations = (currentNews: NewsItem) => {
    const otherNews = newsList.filter(item => item.id !== currentNews.id);
    const sameCategory = otherNews.filter(item => item.kategoriya === currentNews.kategoriya);
    
    // Merge and get unique items, prioritizing same category
    const recommended = [...sameCategory, ...otherNews].slice(0, 3);
    return recommended;
  };

  return (
    <div className="space-y-6" id="news-section-root">
      {activeNews ? (
        /* --- SINGLE ARTICLE READ VIEW --- */
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 md:p-8 space-y-6 animate-fade-in max-w-4xl mx-auto shadow-2xl">
          {/* Back button */}
          <button
            onClick={handleBackToList}
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer bg-[#161B22] hover:bg-[#1A1D26] border border-[#1F2937] px-4 py-2 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Orqaga qaytish</span>
          </button>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-600/10 text-blue-400 border border-blue-500/20">
                {activeNews.kategoriya}
              </span>
              {activeNews.muhim && (
                <span className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                  <Bookmark className="w-3.5 h-3.5 fill-amber-400" />
                  Muhim e'lon
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
              {activeNews.sarlavha}
            </h1>

            {/* Author and Date metadata */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 font-medium border-y border-[#1F2937]/50 py-3">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-500" />
                <span>Muallif: <strong className="text-gray-200">{activeNews.muallif}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 font-mono">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Sana: {activeNews.sana}</span>
              </div>
            </div>
          </div>

          {/* Feature Image */}
          {activeNews.rasm && (
            <div className="w-full h-64 md:h-96 rounded-2xl overflow-hidden border border-[#1F2937]">
              <img 
                src={activeNews.rasm} 
                alt={activeNews.sarlavha} 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            </div>
          )}

          {/* Article Body (HTML render) */}
          <div 
            className="prose prose-invert max-w-none text-gray-300 leading-relaxed text-sm md:text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: activeNews.matn }}
          />

          {/* Recommendations Area */}
          <div className="border-t border-[#1F2937] pt-8 space-y-4">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Tavsiya etiladigan boshqa yangiliklar
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {getRecommendations(activeNews).map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    setActiveNews(item);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="bg-[#161B22] border border-[#1F2937] rounded-2xl p-4 space-y-3 cursor-pointer hover:border-blue-500/40 hover:scale-[1.01] transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-600/10 border border-blue-500/10 px-2 py-0.5 rounded">
                      {item.kategoriya}
                    </span>
                    <h4 className="text-xs md:text-sm font-bold text-white line-clamp-2 leading-snug">
                      {item.sarlavha}
                    </h4>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-gray-500 pt-2 border-t border-[#1F2937]/50">
                    <span className="font-mono">{item.sana}</span>
                    <span className="text-blue-400 flex items-center gap-0.5 font-bold hover:underline">
                      O'qish <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* --- ALL ARTICLES LIST VIEW --- */
        <div className="space-y-6">
          {/* Top filter and search bar */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-[#0D1017] p-5 rounded-3xl border border-[#1F2937]">
            {/* Categories pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400 mr-2 shrink-0">
                <Filter className="w-4 h-4 text-blue-500" />
                <span>Kategoriya:</span>
              </div>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-[#161B22] text-gray-400 border border-[#1F2937] hover:text-white hover:bg-[#1A1D26]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative max-w-md w-full">
              <input
                type="text"
                placeholder="Yangiliklarni qidirish (sarlavha yoki matn bo'yicha)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#161B22] border border-[#1F2937] hover:border-gray-700 focus:border-blue-500 focus:outline-none rounded-xl py-2 px-3 pl-10 text-xs text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
              />
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-2.5" />
            </div>
          </div>

          {/* News Cards Grid */}
          {filteredNews.length === 0 ? (
            <div className="text-center py-16 bg-[#0D1017] border border-[#1F2937] rounded-3xl space-y-3">
              <AlertCircle className="w-12 h-12 text-gray-600 mx-auto animate-bounce" />
              <h3 className="text-sm md:text-base font-bold text-white">Hech qanday yangilik topilmadi</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Kiritilgan kalit so'z yoki tanlangan filtr bo'yicha yangilik topilmadi. Boshqa kalit so'zlar bilan urinib ko'ring.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map(item => (
                <div
                  key={item.id}
                  onClick={() => setActiveNews(item)}
                  className={`bg-[#0D1017] border rounded-3xl overflow-hidden cursor-pointer group flex flex-col justify-between hover:scale-[1.01] hover:shadow-xl transition-all ${
                    item.muhim 
                      ? 'border-amber-500/40 shadow-md shadow-amber-500/5' 
                      : 'border-[#1F2937] hover:border-blue-500/40'
                  }`}
                >
                  <div className="space-y-4">
                    {/* News Image */}
                    {item.rasm ? (
                      <div className="w-full h-48 overflow-hidden relative border-b border-[#1F2937]/40">
                        <img 
                          src={item.rasm} 
                          alt={item.sarlavha} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                          <span className="bg-blue-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg backdrop-blur-xs">
                            {item.kategoriya}
                          </span>
                        </div>
                        {item.muhim && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                              <Bookmark className="w-3 h-3 fill-slate-950" />
                              MUHIM
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-[#161B22] flex items-center justify-center border-b border-[#1F2937]/40 relative">
                        <span className="text-xs text-gray-500">Rasm mavjud emas</span>
                        <div className="absolute top-3 left-3">
                          <span className="bg-blue-600/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-lg">
                            {item.kategoriya}
                          </span>
                        </div>
                        {item.muhim && (
                          <div className="absolute top-3 right-3">
                            <span className="bg-amber-500 text-slate-950 font-extrabold text-[9px] px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-md">
                              <Bookmark className="w-3 h-3 fill-slate-950" />
                              MUHIM
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* News Title & preview */}
                    <div className="px-5 space-y-2">
                      <h3 className="text-sm md:text-base font-extrabold text-white group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug">
                        {item.sarlavha}
                      </h3>
                      <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                        {item.matn.replace(/<[^>]*>/g, '') /* Strip HTML tags for preview */}
                      </p>
                    </div>
                  </div>

                  {/* Metadata footer */}
                  <div className="px-5 pb-5 pt-4 mt-4 border-t border-[#1F2937]/40 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-blue-500" />
                      <span className="truncate max-w-[100px] text-gray-300">{item.muallif}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">{item.sana}</span>
                      <span className="text-blue-400 font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                        Batafsil <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
