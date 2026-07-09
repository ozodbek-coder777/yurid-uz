import { Submission } from '../types';

// Use environment variables if present, otherwise default to user's specified values
const rawUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://cxnrwnzdrldtlsttgwar.supabase.co';
const rawKey = (import.meta as any).env?.VITE_SUPABASE_KEY || 'sb_publishable__11zRqPvb8fGBDsKq5QTqA_VPFC4rGi';

// Clean leading/trailing quotes if they were loaded literally from .env file
const SUPABASE_URL = rawUrl.replace(/^["']|["']$/g, '').trim();
const SUPABASE_KEY = rawKey.replace(/^["']|["']$/g, '').trim();

console.log("Supabase sozlamalari yuklandi:", {
  url: SUPABASE_URL,
  keyLength: SUPABASE_KEY.length,
  keyPreview: SUPABASE_KEY.substring(0, 10) + "..." + SUPABASE_KEY.substring(SUPABASE_KEY.length - 5)
});

/**
 * 1. Arizalarni Supabase ga saqlaydigan funksiya
 */
export async function saveApplicationToSupabase(submission: Submission): Promise<boolean> {
  try {
    const payload = {
      ...submission,
      sana: submission.createdAt || new Date().toISOString()
    };

    console.log("Supabase-ga ariza saqlanmoqda...", payload.id);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Supabase xatosi (Ariza saqlanmadi):", response.status, errText);
      return false;
    }

    console.log("Ariza Supabase-ga muvaffaqiyatli saqlandi!");
    return true;
  } catch (error) {
    console.error("Supabase API ulana olmadi:", error);
    return false;
  }
}

/**
 * 2. Barcha arizalarni Supabase dan oladigan funksiya
 */
export async function getApplicationsFromSupabase(): Promise<Submission[]> {
  try {
    console.log("Supabase-dan arizalar yuklanmoqda...");
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?order=sana.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Supabase xatosi (Arizalarni yuklab bo'lmadi):", response.status, errText);
      // Fallback: localStorage
      return JSON.parse(localStorage.getItem('submissions_list') || '[]');
    }

    const data = await response.json();
    if (Array.isArray(data)) {
      console.log(`Supabase-dan ${data.length}ta ariza olindi.`);
      // Sync to local storage
      localStorage.setItem('submissions_list', JSON.stringify(data));
      return data;
    }
    return [];
  } catch (error) {
    console.error("Supabase-dan ma'lumot olishda xatolik:", error);
    return JSON.parse(localStorage.getItem('submissions_list') || '[]');
  }
}

/**
 * 3. Ariza holatini yangilaydigan funksiya
 */
export async function updateApplicationInSupabase(id: string, updates: Partial<Submission>): Promise<boolean> {
  try {
    console.log(`Supabase-da ariza yangilanmoqda: ${id}`, updates);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      },
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Supabase xatosi (Arizani yangilab bo'lmadi):", response.status, errText);
      return false;
    }

    console.log("Ariza Supabase-da muvaffaqiyatli yangilandi!");
    return true;
  } catch (error) {
    console.error("Supabase-da arizani yangilashda xatolik:", error);
    return false;
  }
}

/**
 * Arizani Supabase dan o'chirish funksiyasi (Opsional)
 */
export async function deleteApplicationFromSupabase(id: string): Promise<boolean> {
  try {
    console.log(`Supabase-dan ariza o'chirilmoqda: ${id}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.warn("Supabase-dan o'chirishda xatolik:", response.status, errText);
      return false;
    }

    console.log("Ariza Supabase-dan muvaffaqiyatli o'chirildi!");
    return true;
  } catch (error) {
    console.error("Supabase-dan o'chirishda xatolik:", error);
    return false;
  }
}
