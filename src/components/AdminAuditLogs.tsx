import React, { useState, useEffect } from 'react';
import { Shield, Search, RefreshCw, Clock, User, FileText, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { AuditLog } from '../types';
import { getAuditLogsFromFirebase, onSnapshotAuditLogs } from '../utils/firebaseHelper';

interface AdminAuditLogsProps {
  lang?: 'uz' | 'ru';
}

export default function AdminAuditLogs({ lang = 'uz' }: AdminAuditLogsProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const loadAuditLogs = async () => {
    setIsLoading(true);
    try {
      let fetchedLogs: AuditLog[] = [];
      try {
        const res = await fetch('/api/audit-logs');
        if (res.ok) {
          fetchedLogs = await res.json();
        }
      } catch (err) {
        console.warn("Backend audit logs fetch error, fallback to Firestore:", err);
      }

      if (!fetchedLogs || fetchedLogs.length === 0) {
        fetchedLogs = await getAuditLogsFromFirebase();
      }

      setLogs(fetchedLogs || []);
    } catch (err) {
      console.error("Error loading audit logs:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
    const unsubscribe = onSnapshotAuditLogs((firebaseLogs) => {
      if (firebaseLogs && firebaseLogs.length > 0) {
        setLogs(firebaseLogs);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      (log.lawyerName || '').toLowerCase().includes(q) ||
      (log.lawyerId || '').toLowerCase().includes(q) ||
      (log.adminEmail || '').toLowerCase().includes(q) ||
      (log.adminId || '').toLowerCase().includes(q) ||
      (log.action || '').toLowerCase().includes(q);

    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesQuery && matchesAction;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'verify_lawyer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Verifikatsiya Tasdiqlandi
          </span>
        );
      case 'reject_lawyer':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> Verifikatsiya Rad Etildi
          </span>
        );
      case 'approve_payment':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3" /> To'lov Tasdiqlandi
          </span>
        );
      case 'reject_payment':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> To'lov Rad Etildi
          </span>
        );
      case 'manual_premium_grant':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1 w-fit">
            <Sparkles className="w-3 h-3" /> Premium Berildi
          </span>
        );
      case 'manual_premium_revoke':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-500/20 text-gray-300 border border-gray-500/30 flex items-center gap-1 w-fit">
            <XCircle className="w-3 h-3" /> Premium Bekor Qilindi
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 w-fit">
            <FileText className="w-3 h-3" /> {action}
          </span>
        );
    }
  };

  return (
    <div className="bg-[#0D1017] p-6 rounded-2xl border border-[#1F2937] space-y-6 text-gray-200 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" />
            <span>{lang === 'uz' ? "Admin Amallari Jurnali (Audit Log)" : "Журнал действий админа (Audit Log)"}</span>
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {lang === 'uz'
              ? "Super admin tomonidan amalga oshirilgan barcha muhim xavfsizlik va moliyaviy qarorlar tarixi (QADAM 5)"
              : "История всех важных финансовых и административных решений, принятых суперадмином"}
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="px-3 py-2 bg-[#161B22] hover:bg-[#1F2937] text-gray-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-[#1F2937]"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{lang === 'uz' ? "Yangilash" : "Обновить"}</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="relative md:col-span-2">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={lang === 'uz' ? "Advokat ismi, ID, admin email yoki amal nomi..." : "Имя адвоката, ID, email админа..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#161B22] border border-[#1F2937] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-[#161B22] border border-[#1F2937] rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          >
            <option value="ALL">{lang === 'uz' ? "Barcha amallar" : "Все действия"}</option>
            <option value="verify_lawyer">Verifikatsiya Tasdiqlandi</option>
            <option value="reject_lawyer">Verifikatsiya Rad Etildi</option>
            <option value="approve_payment">To'lov Tasdiqlandi</option>
            <option value="reject_payment">To'lov Rad Etildi</option>
            <option value="manual_premium_grant">Manual Premium Berildi</option>
            <option value="manual_premium_revoke">Manual Premium Bekor Qilindi</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="overflow-x-auto border border-[#1F2937] rounded-xl bg-[#090D14]">
        <table className="w-full border-collapse text-left text-xs text-gray-300">
          <thead>
            <tr className="border-b border-[#1F2937] bg-[#161B22]">
              <th className="p-4 font-semibold text-gray-400">Vaqt (Sana)</th>
              <th className="p-4 font-semibold text-gray-400">Admin (Kim Bajardi)</th>
              <th className="p-4 font-semibold text-gray-400">Amal (Harakat)</th>
              <th className="p-4 font-semibold text-gray-400">Nishon Advokat</th>
              <th className="p-4 font-semibold text-gray-400">Tafsilotlar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1F2937]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                  {lang === 'uz' ? "Audit loglar topilmadi." : "Записи аудита не найдены."}
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-900/40 transition-colors">
                  <td className="p-4 whitespace-nowrap text-gray-400 font-mono text-[11px]">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-500" />
                      <span>{new Date(log.timestamp).toLocaleString('uz-UZ', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold text-xs shrink-0">
                        A
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs">{log.adminEmail || log.adminId}</div>
                        <div className="text-[10px] text-gray-500 font-mono">ID: {log.adminId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {getActionBadge(log.action)}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-bold text-gray-200">{log.lawyerName}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{log.lawyerId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 max-w-xs">
                    {log.details ? (
                      <pre className="text-[10px] bg-[#161B22] p-2 rounded-lg border border-gray-800 font-mono overflow-x-auto text-gray-300">
                        {JSON.stringify(log.details, null, 1)}
                      </pre>
                    ) : (
                      <span className="text-gray-600 italic">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
