import React, { useEffect, useRef, useState } from 'react';
import Chart from 'chart.js/auto';
import { BarChart3, PieChart, ClipboardList, CheckCircle2, Clock, Users, Star, MessageSquare } from 'lucide-react';
import { Submission, LawyerDetails } from '../types';

interface PersonalStatsProps {
  role: 'client' | 'lawyer' | 'admin';
  userPhoneOrEmail?: string; // used for filtering client data
  lawyerId?: string; // used for filtering lawyer data
  lang: 'uz' | 'ru';
}

export default function PersonalStats({ role, userPhoneOrEmail, lawyerId, lang }: PersonalStatsProps) {
  const barChartRef = useRef<HTMLCanvasElement | null>(null);
  const pieChartRef = useRef<HTMLCanvasElement | null>(null);
  const barChartInst = useRef<Chart | null>(null);
  const pieChartInst = useRef<Chart | null>(null);

  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    completed: 0,
    clientsOrAdvocates: 0,
    rating: 5.0,
    lastFive: [] as Submission[]
  });

  useEffect(() => {
    // 1. Fetch submissions from localStorage submissions_list
    const loadStatsData = async () => {
      try {
        let allSubmissions: Submission[] = [];
        const savedList = localStorage.getItem('submissions_list');
        if (savedList) {
          allSubmissions = JSON.parse(savedList);
        } else {
          const savedSubmissions = localStorage.getItem('submissions');
          if (savedSubmissions) {
            allSubmissions = JSON.parse(savedSubmissions);
          }
        }

        // Filter submissions based on role
        let userSubs: Submission[] = [];
        if (role === 'client') {
          // Client: filter by email or phone
          const cleanUser = (userPhoneOrEmail || '').toLowerCase().trim();
          userSubs = allSubmissions.filter(s => {
            const cleanSubPhone = (s.phone || '').replace(/\D/g, '');
            const cleanUserPhone = cleanUser.replace(/\D/g, '');
            return (cleanUser && s.phone && s.phone.toLowerCase() === cleanUser) ||
                   (cleanUserPhone && cleanSubPhone === cleanUserPhone) ||
                   (s.fullName && s.fullName.toLowerCase() === cleanUser);
          });
        } else if (role === 'lawyer') {
          // Lawyer: filter by assignedLawyer
          userSubs = allSubmissions.filter(s => s.assignedLawyer === lawyerId);
        } else {
          // Admin: see all
          userSubs = allSubmissions;
        }

        // Calculations
        const total = userSubs.length;
        const active = userSubs.filter(s => s.status === 'YANGI' || s.status === "KO'RIB_CHIQILMOQDA").length;
        const completed = userSubs.filter(s => s.status === 'QABUL_QILINGAN' || s.status === 'RAD_ETILGAN').length;

        // Custom 4th Card
        let clientsOrAdvocates = 0;
        let rating = 5.0;

        if (role === 'client') {
          // Count unique advocates contacted
          const advocateIds = new Set<string>();
          userSubs.forEach(s => {
            if (s.assignedLawyer) advocateIds.add(s.assignedLawyer);
          });
          // Also check direct connections
          const connectionsRaw = localStorage.getItem('user_lawyer_connections');
          if (connectionsRaw) {
            try {
              const connections = JSON.parse(connectionsRaw);
              if (Array.isArray(connections)) {
                connections.forEach((conn: any) => {
                  if (conn.userPhone === userPhoneOrEmail || conn.userEmail === userPhoneOrEmail) {
                    advocateIds.add(conn.lawyerId);
                  }
                });
              }
            } catch (e) {}
          }
          clientsOrAdvocates = advocateIds.size;
        } else {
          // Advocate/Admin: count unique clients or get rating
          const clientNames = new Set<string>();
          userSubs.forEach(s => {
            if (s.fullName) clientNames.add(s.fullName.toLowerCase().trim());
          });
          clientsOrAdvocates = clientNames.size;

          // Get rating of lawyer
          const lawyersRaw = localStorage.getItem('lawyers_list');
          if (lawyersRaw) {
            try {
              const lawyers: LawyerDetails[] = JSON.parse(lawyersRaw);
              const me = lawyers.find(l => l.id === lawyerId || l.email === lawyerId);
              if (me) {
                rating = me.rating || 5.0;
                // If client count is preset in lawyers database, we can also add it
                if (me.clientCount && role === 'lawyer') {
                  clientsOrAdvocates = me.clientCount;
                }
              }
            } catch (e) {}
          }
        }

        // Get last 5 submissions
        const lastFive = [...userSubs]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5);

        setStats({
          total,
          active,
          completed,
          clientsOrAdvocates,
          rating,
          lastFive
        });

        // 2. Prepare Chart Data for last 6 months
        const monthNamesUz = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
        const monthNamesRu = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];
        const months = lang === 'ru' ? monthNamesRu : monthNamesUz;

        const last6MonthsLabels: string[] = [];
        const last6MonthsCounts: number[] = [0, 0, 0, 0, 0, 0];

        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          last6MonthsLabels.push(months[d.getMonth()]);
        }

        userSubs.forEach(s => {
          const sDate = new Date(s.createdAt);
          for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            if (sDate.getMonth() === d.getMonth() && sDate.getFullYear() === d.getFullYear()) {
              last6MonthsCounts[5 - i]++;
            }
          }
        });

        // 3. Status Distribution Chart Data
        const statusCounts = {
          yangi: userSubs.filter(s => s.status === 'YANGI').length,
          o_rganilmoqda: userSubs.filter(s => s.status === "KO'RIB_CHIQILMOQDA").length,
          tasdiqlangan: userSubs.filter(s => s.status === 'QABUL_QILINGAN').length,
          rad_etilgan: userSubs.filter(s => s.status === 'RAD_ETILGAN').length,
        };

        // --- RENDER CHARTS USING CHART.JS ---
        if (barChartRef.current) {
          if (barChartInst.current) barChartInst.current.destroy();
          barChartInst.current = new Chart(barChartRef.current, {
            type: 'bar',
            data: {
              labels: last6MonthsLabels,
              datasets: [{
                label: lang === 'ru' ? 'Обращения' : 'Arizalar soni',
                data: last6MonthsCounts,
                backgroundColor: 'rgba(59, 130, 246, 0.65)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 6,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: '#9ca3af', stepSize: 1 },
                  grid: { color: 'rgba(31, 41, 55, 0.4)' }
                },
                x: {
                  ticks: { color: '#9ca3af' },
                  grid: { display: false }
                }
              }
            }
          });
        }

        if (pieChartRef.current) {
          if (pieChartInst.current) pieChartInst.current.destroy();
          
          const hasData = Object.values(statusCounts).some(v => v > 0);
          const pieLabels = lang === 'ru'
            ? ['Новые', 'На рассмотрении', 'Принятые', 'Отклоненные']
            : ['Yangi', "Ko'rib chiqilmoqda", 'Qabul qilingan', 'Rad etilgan'];

          pieChartInst.current = new Chart(pieChartRef.current, {
            type: 'doughnut',
            data: {
              labels: pieLabels,
              datasets: [{
                data: hasData 
                  ? [statusCounts.yangi, statusCounts.o_rganilmoqda, statusCounts.tasdiqlangan, statusCounts.rad_etilgan] 
                  : [1, 0, 0, 0], // Empty state placeholder
                backgroundColor: hasData 
                  ? [
                      'rgba(59, 130, 246, 0.8)',   // blue
                      'rgba(245, 158, 11, 0.8)',   // amber
                      'rgba(16, 185, 129, 0.8)',   // emerald
                      'rgba(239, 68, 68, 0.8)'     // rose
                    ]
                  : ['rgba(75, 85, 99, 0.3)', 'transparent', 'transparent', 'transparent'],
                borderColor: '#0D1017',
                borderWidth: 2,
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#9ca3af', boxWidth: 12, font: { size: 10 } }
                }
              },
              cutout: '65%'
            }
          });
        }

      } catch (err) {
        console.error("Error generating stats", err);
      }
    };

    loadStatsData();

    return () => {
      if (barChartInst.current) barChartInst.current.destroy();
      if (pieChartInst.current) pieChartInst.current.destroy();
    };
  }, [role, userPhoneOrEmail, lawyerId, lang]);

  return (
    <div className="space-y-6" id="personal-statistics-root">
      
      {/* 4 STATS CARDS ROW */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Jami */}
        <div className="bg-[#11141B] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {lang === 'ru' ? '📊 Всего заявок' : '📊 Jami arizalar'}
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-blue-400 font-mono">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
            <ClipboardList className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Faol */}
        <div className="bg-[#11141B] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {lang === 'ru' ? '📋 Активные' : '📋 Faol arizalar'}
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-amber-400 font-mono">{stats.active}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
            <Clock className="w-5 h-5 animate-pulse" />
          </div>
        </div>

        {/* Card 3: Tugal */}
        <div className="bg-[#11141B] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {lang === 'ru' ? '✅ Завершено' : '✅ Tugallangan'}
            </span>
            <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-mono">{stats.completed}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Specific by Role */}
        <div className="bg-[#11141B] border border-[#1F2937] rounded-2xl p-4 md:p-5 flex items-center justify-between shadow-sm">
          {role === 'client' ? (
            <>
              <div className="space-y-1">
                <span className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  👤 Advokatlar
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-purple-400 font-mono">{stats.clientsOrAdvocates}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-1">
                <span className="text-[10px] md:text-xs text-gray-400 font-semibold uppercase tracking-wider">
                  {role === 'admin' ? '👤 Jami mijozlar' : '👤 Mening mijozlarim'}
                </span>
                <p className="text-2xl md:text-3xl font-extrabold text-purple-400 font-mono">{stats.clientsOrAdvocates}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="w-5 h-5" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 2 CHARTS SIDE-BY-SIDE GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart */}
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 md:p-6 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 className="w-4.5 h-4.5 text-blue-400" />
            <span>{lang === 'ru' ? '📈 Ежемесячные обращения' : '📈 Oylik arizalar soni (Oxirgi 6 oy)'}</span>
          </h4>
          <div className="h-64 relative">
            <canvas ref={barChartRef} />
          </div>
        </div>

        {/* Chart 2: Pie/Doughnut Chart */}
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 md:p-6 space-y-4">
          <h4 className="text-sm font-bold text-white flex items-center gap-2">
            <PieChart className="w-4.5 h-4.5 text-amber-400" />
            <span>{lang === 'ru' ? '🥧 Распределение по статусам' : '🥧 Holat bo\'yicha taqsimot (Doiraviy diagramma)'}</span>
          </h4>
          <div className="h-64 relative">
            <canvas ref={pieChartRef} />
          </div>
        </div>
      </div>

      {/* CLIENT SPECIFIC: RECENT SUBMISSIONS HISTORY (Last 5) */}
      {role === 'client' && (
        <div className="bg-[#0D1017] border border-[#1F2937] rounded-2xl p-5 md:p-6 space-y-4">
          <h4 className="text-sm font-bold text-white">Mening so'nggi 5 ta arizam va holatlari</h4>
          
          {stats.lastFive.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Hozircha biron bir yuridik ariza topshirmagansiz.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.lastFive.map(sub => {
                const getStatusText = (st: string) => {
                  if (st === 'YANGI') return 'Yangi';
                  if (st === "KO'RIB_CHIQILMOQDA") return "Ko'rib chiqilmoqda";
                  if (st === 'QABUL_QILINGAN') return 'Qabul qilingan';
                  return 'Rad etilgan';
                };

                const getStatusColor = (st: string) => {
                  if (st === 'YANGI') return 'bg-blue-600/10 text-blue-400 border-blue-500/20';
                  if (st === "KO'RIB_CHIQILMOQDA") return 'bg-amber-600/10 text-amber-400 border-amber-500/20';
                  if (st === 'QABUL_QILINGAN') return 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20';
                  return 'bg-rose-600/10 text-rose-400 border-rose-500/20';
                };

                return (
                  <div key={sub.id} className="bg-[#161B22] border border-[#1F2937] p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-white">#ID-{sub.id.substring(0,6)} • {sub.fullName}</p>
                      <p className="text-[10px] text-gray-400 font-mono">Topshirilgan vaqt: {new Date(sub.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full border text-[10px] font-bold ${getStatusColor(sub.status)}`}>
                      {getStatusText(sub.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
