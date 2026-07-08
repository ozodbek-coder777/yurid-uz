export interface BlacklistItem {
  id: string;
  ism: string;
  telefon: string;
  sabab: string; // "Yolg'on xabar", "Soxta ma'lumot", "Qoidabuzarlik", "Boshqa"
  sana: string;
  holat: 'faol' | 'no-faol';
  admin_izoh: string;
  restorationReason?: string;
}

export const getBlacklistedUser = (identifier: string): BlacklistItem | null => {
  if (!identifier) return null;
  const listRaw = localStorage.getItem('blacklist_users');
  if (!listRaw) return null;
  try {
    const list = JSON.parse(listRaw);
    if (!Array.isArray(list)) return null;
    
    // Normalize phone input: extract digits
    const cleanIdDigits = identifier.replace(/\D/g, '');
    const cleanIdText = identifier.trim().toLowerCase();

    return list.find((item: BlacklistItem) => {
      if (item.holat !== 'faol') return false;
      
      const cleanPhoneDigits = item.telefon.replace(/\D/g, '');
      const cleanIsm = item.ism.trim().toLowerCase();
      
      // Match phone digits (e.g. 998901234567 matches 901234567 or vice versa)
      if (cleanPhoneDigits && cleanIdDigits) {
        if (cleanPhoneDigits.includes(cleanIdDigits) || cleanIdDigits.includes(cleanPhoneDigits)) {
          return true;
        }
      }
      
      // Match name exactly or partially
      if (cleanIsm && (cleanIdText === cleanIsm || cleanIdText.includes(cleanIsm) || cleanIsm.includes(cleanIdText))) {
        return true;
      }
      
      return false;
    }) || null;
  } catch (e) {
    return null;
  }
};

export const checkAndAutoBlacklist = (fullName: string, phone: string, submissions: any[]): BlacklistItem | null => {
  if (!phone) return null;
  const cleanPhoneDigits = phone.replace(/\D/g, '');
  
  // Count rejected submissions for this user phone
  const rejectedCount = submissions.filter((s: any) => {
    const sPhoneDigits = (s.phone || '').replace(/\D/g, '');
    return sPhoneDigits && sPhoneDigits === cleanPhoneDigits && s.status === 'RAD_ETILGAN';
  }).length;

  if (rejectedCount >= 3) {
    // Check if already in active blacklist
    const isAlreadyBlacklisted = getBlacklistedUser(phone);
    if (!isAlreadyBlacklisted) {
      const blacklistRaw = localStorage.getItem('blacklist_users') || '[]';
      try {
        const list = JSON.parse(blacklistRaw);
        const newItem: BlacklistItem = {
          id: 'auto_' + Math.random().toString(36).substring(2, 9),
          ism: fullName || 'Tizim tomonidan aniqlangan foydalanuvchi',
          telefon: phone,
          sabab: "Yolg'on xabar",
          sana: new Date().toISOString().split('T')[0],
          holat: 'faol',
          admin_izoh: "Tizim tomonidan avtomatik bloklandi: 3 marta yoki undan ko'p rad etilgan/yolg'on arizalar yuborilgan."
        };
        list.unshift(newItem);
        localStorage.setItem('blacklist_users', JSON.stringify(list));
        return newItem;
      } catch (e) {
        console.error("Auto blacklist error", e);
      }
    }
  }
  return null;
};
