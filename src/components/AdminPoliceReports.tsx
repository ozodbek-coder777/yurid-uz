import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Search, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle2, 
  FileText, 
  Users, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Info,
  Trash2
} from 'lucide-react';
import { PoliceReport } from '../types';

interface AdminPoliceReportsProps {
  lang: 'uz' | 'ru';
}

export default function AdminPoliceReports({ lang }: AdminPoliceReportsProps) {
  const [reports, setReports] = useState<PoliceReport[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReport, setSelectedReport] = useState<PoliceReport | null>(null);

  // Load reports
  useEffect(() => {
    const saved = localStorage.getItem('police_reports_list');
    if (saved) {
      try {
        setReports(JSON.parse(saved));
      } catch (e) {
        setReports([]);
      }
    }
  }, []);

  // Save changes
  const updateReportStatus = (id: string, newStatus: string) => {
    const updated = reports.map(r => r.id === id ? { ...r, status: newStatus as any } : r);
    setReports(updated);
    localStorage.setItem('police_reports_list', JSON.stringify(updated));
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport({ ...selectedReport, status: newStatus as any });
    }
  };

  const deleteReport = (id: string) => {
    const confirmDelete = window.confirm(
      lang === 'uz' 
        ? "Ushbu tezkor xabarni o'chirib tashlamoqchimisiz? Bu amalni ortga qaytarib bo'lmaydi!" 
        : "Вы действительно хотите удалить это сообщение? Это действие нельзя отменить!"
    );
    if (!confirmDelete) return;

    const updated = reports.filter(r => r.id !== id);
    setReports(updated);
    localStorage.setItem('police_reports_list', JSON.stringify(updated));
    if (selectedReport && selectedReport.id === id) {
      setSelectedReport(null);
    }
  };

  // Filter reports
  const filtered = reports.filter(r => 
    r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.phone.includes(searchTerm)
  );

  const t = {
    uz: {
      title: "Ichki Ishlar & Prokuratura Xabarlari",
      subtitle: "Fuqarolar tomonidan yuborilgan barcha tezkor xabarlar ro'yxati (Maxfiy)",
      search: "Ism yoki tavsif bo'yicha qidirish...",
      empty: "Hech qanday xabar topilmadi.",
      table_name: "Arizachi",
      table_type: "Turi",
      table_org: "Qabul qiluvchi",
      table_status: "Holati",
      table_date: "Sana",
      details: "Tafsilotlar",
      ai_analysis: "AI Huquqbuzarlik Tahlili",
      broken_law: "Aniqlangan modda:",
      liability: "Sanksiya / Javobgarlik:",
      recommended: "Tavsiya etilgan idora:",
      attachments: "Ilova qilingan fayl:",
      witnesses: "Guvohlar ro'yxati:",
      status_update: "Xabar holatini yangilash",
    },
    ru: {
      title: "Сообщения в МВД и Прокуратуру",
      subtitle: "Список всех срочных сообщений от граждан (Конфиденциально)",
      search: "Поиск по имени или описанию...",
      empty: "Сообщения не найдены.",
      table_name: "Заявитель",
      table_type: "Тип",
      table_org: "Получатель",
      table_status: "Статус",
      table_date: "Дата",
      details: "Подробности",
      ai_analysis: "Юридический анализ ИИ",
      broken_law: "Обнаруженная статья:",
      liability: "Санкция / Ответственность:",
      recommended: "Рекомендуемый орган:",
      attachments: "Прикрепленный файл:",
      witnesses: "Список свидетелей:",
      status_update: "Обновить статус сообщения",
    }
  }[lang];

  return (
    <div className="space-y-6 animate-fade-in text-gray-200">
      
      {/* Header */}
      <div>
        <h3 className="text-xl font-sans font-bold text-white flex items-center gap-2">
          <Shield className="w-5.5 h-5.5 text-red-500" />
          <span>{t.title}</span>
        </h3>
        <p className="text-xs text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Reports list */}
        <div className="xl:col-span-7 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.search}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-hidden focus:ring-1 focus:ring-amber-500"
            />
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3.5" />
          </div>

          {/* List items */}
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-xs text-gray-500">
              {t.empty}
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {filtered.map((rep) => (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    selectedReport?.id === rep.id 
                      ? 'bg-slate-800/60 border-amber-500/40' 
                      : 'bg-slate-950/40 border-slate-900 hover:border-slate-800/60'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] bg-red-500/10 text-red-400 font-bold border border-red-500/20 rounded-md px-2 py-0.5 uppercase tracking-wide">
                        {rep.reportType}
                      </span>
                      <h4 className="font-sans font-bold text-white text-xs mt-1.5">{rep.fullName}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">{rep.phone}</p>
                    </div>

                    <div className="text-right space-y-1">
                      <span className="text-[9px] text-gray-400 block font-mono">
                        {rep.dateTime.substring(0, 16)}
                      </span>
                      <span className="text-[10px] bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20 rounded-full px-2.5 py-0.5 inline-block">
                        {rep.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed italic">
                    "{rep.description}"
                  </p>

                  <div className="flex justify-between items-center text-[10px] text-gray-500 pt-2 border-t border-slate-900/40">
                    <span>Organ: <strong className="text-gray-300">{rep.organization}</strong></span>
                    <span className="text-amber-500 hover:text-amber-400 flex items-center gap-0.5">
                      {t.details} <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Selected Details Drawer / Panel */}
        <div className="xl:col-span-5">
          {selectedReport ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6 animate-fade-in">
              
              {/* Header */}
              <div className="border-b border-slate-800 pb-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs bg-red-500/10 text-red-400 font-bold border border-red-500/20 px-2.5 py-0.5 rounded-md uppercase">
                    {selectedReport.reportType}
                  </span>
                  <span className="text-[11px] font-mono text-gray-500">#{selectedReport.id.split('_')[1]}</span>
                </div>
                <h4 className="text-base font-sans font-bold text-white">{selectedReport.fullName}</h4>
                <p className="text-xs text-gray-400 font-mono">{selectedReport.phone}</p>
              </div>

              {/* Main parameters */}
              <div className="space-y-3 text-xs text-gray-300">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block tracking-wider">Voqea joyi:</span>
                    <span className="font-semibold">{selectedReport.address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-gray-500 uppercase block tracking-wider">Sana va vaqt:</span>
                    <span className="font-semibold">{selectedReport.dateTime}</span>
                  </div>
                </div>

                {selectedReport.suspectInfo && (
                  <div className="flex items-start gap-2 bg-slate-950/40 p-2.5 border border-slate-900 rounded-lg">
                    <User className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block tracking-wider">Shubhali shaxs:</span>
                      <span className="text-white font-medium">{selectedReport.suspectInfo}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">Batafsil tavsif:</span>
                <p className="text-xs text-gray-300 bg-slate-950/60 p-3.5 border border-slate-900 rounded-xl leading-relaxed whitespace-pre-wrap">
                  {selectedReport.description}
                </p>
              </div>

              {/* Attachment */}
              {selectedReport.attachmentUrl && (
                <div className="flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 text-xs">
                  <span className="text-gray-400">{t.attachments}</span>
                  <a 
                    href={selectedReport.attachmentUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold"
                  >
                    Faylni ko'rish
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {/* Witnesses List */}
              {selectedReport.witnesses && (
                <div className="space-y-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{t.witnesses}</span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedReport.witnesses.map((wit, i) => (
                      <div key={i} className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900 text-xs">
                        <span className="font-medium text-white flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-gray-500" />
                          {wit.name}
                        </span>
                        <span className="font-mono text-gray-400">{wit.phone}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Analysis Card */}
              {selectedReport.aiAnalysis && (
                <div className="bg-gradient-to-br from-amber-500/10 to-red-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                  <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                    {t.ai_analysis}
                  </span>

                  <div className="space-y-2 text-[11px] leading-relaxed">
                    <p className="text-gray-400">
                      <strong>{t.broken_law}</strong> <span className="text-white font-medium">{selectedReport.aiAnalysis.brokenLaw}</span>
                    </p>
                    <p className="text-gray-400">
                      <strong>{t.liability}</strong> <span className="text-gray-300">{selectedReport.aiAnalysis.liability}</span>
                    </p>
                    <p className="text-gray-400">
                      <strong>{t.recommended}</strong> <span className="text-amber-300 font-medium">{selectedReport.aiAnalysis.recommendedAuthority}</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Status Update Actions */}
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <span className="text-[10px] text-gray-500 uppercase tracking-wider block">{t.status_update}</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { status: 'Yuborilgan', label: lang === 'uz' ? 'Yuborilgan' : 'Отправлено' },
                    { status: 'O\'rganilmoqda', label: lang === 'uz' ? 'O\'rganilmoqda' : 'Изучается' },
                    { status: 'Yo\'naltirildi', label: lang === 'uz' ? 'Yo\'naltirildi' : 'Направлено' },
                    { status: 'Yakunlandi', label: lang === 'uz' ? 'Yakunlandi' : 'Завершено' }
                  ].map(btn => (
                    <button
                      key={btn.status}
                      onClick={() => updateReportStatus(selectedReport.id, btn.status)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center ${
                        selectedReport.status === btn.status 
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-500' 
                          : 'bg-slate-950 border-slate-900 text-gray-400 hover:text-white hover:bg-slate-900'
                      }`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Delete Action */}
              <div className="pt-4 border-t border-slate-800">
                <button
                  onClick={() => deleteReport(selectedReport.id)}
                  className="w-full py-2.5 px-4 bg-red-600/15 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {lang === 'uz' ? "Xabarni butunlay o'chirish" : "Удалить сообщение навсегда"}
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
              <Info className="w-8 h-8 text-slate-700" />
              <span>Batafsil ma'lumotlarni ko'rish va statusni yangilash uchun chap tomondagi xabarlardan birini tanlang.</span>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
