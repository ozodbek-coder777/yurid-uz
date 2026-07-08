import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { Submission } from '../types';

// Helper to format date nicely
export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  } catch {
    return dateStr;
  }
}

// 1. PDF REPORT GENERATOR (Single Submission Summary)
export function generateSubmissionPDF(sub: any, lang: 'uz' | 'ru' = 'uz') {
  const doc = new jsPDF();
  const t = {
    uz: {
      title: "Yuridik Ariza Hisoboti",
      sub_title: "Yurid.uz - Professional Yuridik Tahlil Tizimi",
      doc_id: "Ariza ID:",
      client_info: "Mijoz Ma'lumotlari",
      fullname: "F.I.SH:",
      phone: "Telefon:",
      created_at: "Yuborilgan sana:",
      incident_desc: "Hodisa Tavsifi:",
      injuries: "Tan jarohatlari:",
      fault: "Aybni aniqlash:",
      notes: "Advokat Qaydlar / Izoh:",
      deadline: "Muddati (Deadline):",
      deadline_status: "Muddati statusi:",
      status: "Hozirgi Status:",
      timeline: "Status O'zgarishlari Tarixi",
      sign: "Mas'ul advokat imzosi:",
      date_printed: "Chop etilgan sana:"
    },
    ru: {
      title: "Отчет по юридическому обращению",
      sub_title: "Yurid.uz - Система профессионального юридического анализа",
      doc_id: "ID обращения:",
      client_info: "Информация о клиенте",
      fullname: "Ф.И.О:",
      phone: "Телефон:",
      created_at: "Дата подачи:",
      incident_desc: "Описание происшествия:",
      injuries: "Травмы/Ущерб:",
      fault: "Определение вины:",
      notes: "Заметки адвоката:",
      deadline: "Срок выполнения (Deadline):",
      deadline_status: "Статус срока:",
      status: "Текущий статус:",
      timeline: "История изменений статуса",
      sign: "Подпись ответственного адвоката:",
      date_printed: "Дата печати:"
    }
  }[lang];

  // Header Box
  doc.setFillColor(26, 37, 48); // Dark Slate Blue
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text(t.title, 15, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(t.sub_title, 15, 30);

  // Content styling
  doc.setTextColor(33, 33, 33);
  
  // Quick Metadata block
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`${t.doc_id} #${sub.id}`, 15, 52);
  doc.setFont("helvetica", "normal");
  doc.text(`${t.date_printed} ${formatDate(new Date().toISOString())}`, 140, 52);

  // Decorative border
  doc.setDrawColor(220, 220, 220);
  doc.line(15, 56, 195, 56);

  // Client Info Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(26, 37, 48);
  doc.text(t.client_info, 15, 68);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  doc.setFont("helvetica", "bold");
  doc.text(t.fullname, 15, 76);
  doc.setFont("helvetica", "normal");
  doc.text(sub.fullName || "Noma'lum", 45, 76);

  doc.setFont("helvetica", "bold");
  doc.text(t.phone, 15, 83);
  doc.setFont("helvetica", "normal");
  doc.text(sub.phone || "Noma'lum", 45, 83);

  doc.setFont("helvetica", "bold");
  doc.text(t.created_at, 15, 90);
  doc.setFont("helvetica", "normal");
  doc.text(formatDate(sub.createdAt), 45, 90);

  // Dynamic Status and Deadline Badge
  doc.setFont("helvetica", "bold");
  doc.text(t.status, 120, 76);
  doc.setFont("helvetica", "normal");
  doc.text(sub.status || "YANGI", 155, 76);

  doc.setFont("helvetica", "bold");
  doc.text(t.deadline, 120, 83);
  doc.setFont("helvetica", "normal");
  doc.text(sub.deadline ? sub.deadline : "Kiritilmagan", 155, 83);

  // Line
  doc.line(15, 96, 195, 96);

  // Case details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(26, 37, 48);
  doc.text(lang === 'uz' ? "Ariza Tahlili Tafsilotlari" : "Детали анализа обращения", 15, 108);

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  // Incident Description wrapping
  doc.setFont("helvetica", "bold");
  doc.text(t.incident_desc, 15, 116);
  doc.setFont("helvetica", "normal");
  const descLines = doc.splitTextToSize(sub.incidentDescription || "Yo'q", 150);
  doc.text(descLines, 45, 116);

  const startYInjuries = 116 + (descLines.length * 5) + 3;

  doc.setFont("helvetica", "bold");
  doc.text(t.injuries, 15, startYInjuries);
  doc.setFont("helvetica", "normal");
  const injuryLines = doc.splitTextToSize(sub.injuries || "Ma'lumot yo'q", 150);
  doc.text(injuryLines, 45, startYInjuries);

  const startYFault = startYInjuries + (injuryLines.length * 5) + 3;

  doc.setFont("helvetica", "bold");
  doc.text(t.fault, 15, startYFault);
  doc.setFont("helvetica", "normal");
  const faultLines = doc.splitTextToSize(sub.fault || "Noma'lum", 150);
  doc.text(faultLines, 45, startYFault);

  const startYNotes = startYFault + (faultLines.length * 5) + 5;

  // Lawyer Notes / Comments
  doc.line(15, startYNotes - 2, 195, startYNotes - 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(26, 37, 48);
  doc.text(t.notes, 15, startYNotes + 5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const notesLines = doc.splitTextToSize(sub.notes || "Hozircha izoh kiritilmagan.", 175);
  doc.text(notesLines, 15, startYNotes + 12);

  const startYTimeline = startYNotes + 12 + (notesLines.length * 5) + 8;

  // Status Change Timeline (History log)
  doc.line(15, startYTimeline - 2, 195, startYTimeline - 2);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(26, 37, 48);
  doc.text(t.timeline, 15, startYTimeline + 5);

  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  let currentY = startYTimeline + 12;

  const timelineData = sub.timeline || [
    {
      status: sub.status || "YANGI",
      timestamp: sub.createdAt,
      updatedBy: "Tizim (Mijoz)",
      comment: "Ariza tizimga muvaffaqiyatli topshirildi."
    }
  ];

  timelineData.forEach((item: any, index: number) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.text(`${index + 1}. [${item.status}] - ${formatDate(item.timestamp)}`, 15, currentY);
    doc.setFont("helvetica", "normal");
    doc.text(`Kirituvchi: ${item.updatedBy || 'Advokat'}`, 25, currentY + 5);
    const commLines = doc.splitTextToSize(item.comment || "Izohsiz", 160);
    doc.text(commLines, 25, currentY + 10);
    currentY += 10 + (commLines.length * 4) + 4;
  });

  // Footer / Signature line
  if (currentY > 250) {
    doc.addPage();
    currentY = 30;
  } else {
    currentY = Math.max(currentY + 10, 250);
  }

  doc.setDrawColor(180, 180, 180);
  doc.line(15, currentY, 85, currentY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text(t.sign, 15, currentY + 5);
  doc.setFont("helvetica", "normal");
  doc.text(sub.assignedLawyer || "Yurid.uz Advokati", 15, currentY + 10);

  // Save the PDF file
  doc.save(`Yurid_Hisobot_${sub.id.substring(0, 8)}.pdf`);
}

// 2. EXCEL REPORT EXPORT (List of Submissions or Single Submission)
export function exportSubmissionsToExcel(subs: any[], lang: 'uz' | 'ru' = 'uz') {
  const headers = lang === 'uz' ? [
    'Ariza ID', 'F.I.SH', 'Telefon', 'Status', 'Yaratilgan Sana', 'Muddati (Deadline)', 'Tan Jarohatlari', 'Ayb', 'Hodisa Tavsifi', 'Eslatma / Qaydlar'
  ] : [
    'ID Обращения', 'Ф.И.О', 'Телефон', 'Статус', 'Дата Создания', 'Срок (Deadline)', 'Травмы/Ущерб', 'Вина', 'Описание Происшествия', 'Заметки Адвоката'
  ];

  const dataRows = subs.map(s => [
    s.id,
    s.fullName || 'Noma\'lum',
    s.phone || 'Kiritilmagan',
    s.status || 'YANGI',
    formatDate(s.createdAt),
    s.deadline || 'Kiritilmagan',
    s.injuries || '',
    s.fault || '',
    s.incidentDescription || '',
    s.notes || ''
  ]);

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, lang === 'uz' ? 'Arizalar' : 'Обращения');

  // Export
  XLSX.writeFile(wb, `Yurid_Arizalar_Eksport_${new Date().toISOString().split('T')[0]}.xlsx`);
}
