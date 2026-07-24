import React, { useState, useEffect } from 'react';
import { Scale, RefreshCw, Search, CheckCircle2, XCircle, Clock, MessageSquare, AlertCircle, Shield } from 'lucide-react';
import { DisputeReport } from './DisputeModal';

interface AdminDisputesProps {
  lang?: 'uz' | 'ru';
}

export default function AdminDisputes({ lang = 'uz' }: AdminDisputesProps) {
  const isUz = lang === 'uz';

  const [disputes, setDisputes] = useState<DisputeReport[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<DisputeReport | null>(null);
  const [resolutionInput, setResolutionInput] = useState('');
  const [actionError, setActionError] = useState('');

  const loadDisputes = async () => {
    setIsLoading(true);
    try {
      let fetched: DisputeReport[] = [];
      try {
        const res = await fetch('/api/disputes');
        if (res.ok) {
          fetched = await res.json();
        }
      } catch (err) {
        console.warn("Backend disputes fetch error, fallback to local:", err);
      }

      if (!fetched || fetched.length === 0) {
        fetched = JSON.parse(localStorage.getItem('disputes_list') || '[]');
      }

      setDisputes(fetched);
    } catch (err) {
      console.error("Error loading disputes:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const handleUpdateStatus = async (status: 'resolved' | 'dismissed') => {
    if (!selectedDispute) return;
    if (!resolutionInput.trim()) {
      setActionError(isUz ? "Iltimos, ma'muriyat xulosasini/izohini kiritishingiz shart!" : "Введите заключение администрации!");
      return;
    }

    try {
      const updatedList = disputes.map(d => {
        if (d.id === selectedDispute.id) {
          return {
            ...d,
            status,
            adminResolution: resolutionInput.trim(),
            resolvedAt: new Date().toISOString()
          };
        }
        return d;
      });

      setDisputes(updatedList);
      localStorage.setItem('disputes_list', JSON.stringify(updatedList));

      // Try API update
      fetch(`/api/disputes/${selectedDispute.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminResolution: resolutionInput.trim()
        })
      }).catch(() => {});

      setSelectedDispute(null);
      setResolutionInput('');
      setActionError('');
      alert(isUz ? "Nizo holati va ma'muriyat xulosasi saqlandi!" : "Решение по спору успешно сохранено!");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredDisputes = disputes.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      (d.subject || '').toLowerCase().includes(q) ||
      (d.reporterName || '').toLowerCase().includes(q) ||
      (d.targetLawyerName || '').toLowerCase().includes(q) ||
      (d.reason || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937] space-y-6 text-gray-200 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-rose-400" />
            <span>{isUz ? "Shikoyatlar va Nizolar Boshqaruvi" : "Управление Жалобами и Спорами"}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {isUz
              ? "Mijoz va advokatlar o'rtasida tushgan e'tirozlarni xolis ko'rib chiqish va rasmiy hal etish bo'limi (QADAM 5)"
              : "Рассмотрение претензий и принятие административных решений"}
          </p>
        </div>

        <button
          onClick={loadDisputes}
          className="px-3 py-2 bg-[#161B22] hover:bg-[#1F2937] text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 border border-[#1F2937] cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isUz ? "Yangilash" : "Обновить"}</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder={isUz ? "Shikoyat mavzusi, mijoz ismi yoki advokat bo'yicha qidirish..." : "Поиск по теме, имени или адвокату..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-[#161B22] border border-[#1F2937] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
        />
      </div>

      {/* Disputes list */}
      <div className="grid grid-cols-1 gap-4">
        {filteredDisputes.length === 0 ? (
          <div className="p-8 text-center bg-[#090D14] border border-[#1F2937] rounded-xl text-gray-500 text-xs">
            {isUz ? "Hozircha kelib tushgan shikoyat va nizolar yo'q." : "Жалобы не найдены."}
          </div>
        ) : (
          filteredDisputes.map(d => (
            <div key={d.id} className="p-5 bg-[#090D14] border border-[#1F2937] rounded-2xl space-y-3 hover:border-gray-700 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1F2937] pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{d.subject}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      d.status === 'resolved' 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : d.status === 'dismissed'
                        ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}>
                      {d.status === 'resolved' ? (isUz ? 'Hal Etildi' : 'Решено') : d.status === 'dismissed' ? (isUz ? 'Rad Etildi' : 'Отклонено') : (isUz ? 'Ko\'rib Chiqilmoqda' : 'В обработке')}
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 flex items-center gap-3">
                    <span>Murojaatchi: <strong className="text-gray-200">{d.reporterName}</strong> ({d.reporterRole})</span>
                    <span>•</span>
                    <span>Advokat: <strong className="text-amber-400">{d.targetLawyerName || 'Aytilmagan'}</strong></span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(d.createdAt).toLocaleString('uz-UZ')}</span>
                </div>
              </div>

              <div className="bg-[#161B22] p-3 rounded-xl border border-[#1F2937] text-xs text-gray-300 leading-relaxed">
                <strong>E'tiroz mazmuni:</strong> "{d.reason}"
              </div>

              {d.adminResolution && (
                <div className="bg-emerald-950/20 p-3 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 leading-relaxed">
                  <strong>Ma'muriyat xulosasi:</strong> {d.adminResolution}
                </div>
              )}

              {d.status === 'pending' && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => {
                      setSelectedDispute(d);
                      setResolutionInput('');
                      setActionError('');
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    {isUz ? "Nizoni Hal Qilish / Qaror Chiqarish" : "Принять решение по спору"}
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Resolution modal */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#0D1017] border border-[#1F2937] rounded-3xl p-6 max-w-lg w-full space-y-4">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>{isUz ? "Ma'muriyat Qarorini Shakllantirish" : "Формирование решения"}</span>
            </h4>

            {actionError && (
              <div className="p-3 bg-rose-950/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-1 text-xs">
              <label className="text-gray-300 font-semibold">{isUz ? "Rasmiy xulosa va tushuntirish" : "Официальное заключение"}</label>
              <textarea
                value={resolutionInput}
                onChange={(e) => setResolutionInput(e.target.value)}
                placeholder={isUz ? "Masalan: Advokat bilan muloqot qilindi, xizmat ko'rsatish davom ettiriladi yoki to'lov qaytarilishi ta'minlanadi..." : "Например: Разбирательство проведено..."}
                className="w-full min-h-[110px] bg-[#161B22] border border-[#1F2937] rounded-xl px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedDispute(null)}
                className="px-4 py-2 bg-[#161B22] hover:bg-[#1F2937] text-gray-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isUz ? "Bekor qilish" : "Отмена"}
              </button>
              <button
                onClick={() => handleUpdateStatus('dismissed')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
              >
                {isUz ? "Shikoyatni Rad Etish" : "Отклонить"}
              </button>
              <button
                onClick={() => handleUpdateStatus('resolved')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold cursor-pointer shadow-md"
              >
                {isUz ? "Nizoni Hal Etish (Tasdiqlash)" : "Удовлетворить"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
