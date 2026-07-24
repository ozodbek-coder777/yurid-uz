import { saveApplicationToFirebase } from './firebaseHelper';

export function determineCategory(description: string): string {
  const text = description.toLowerCase();
  if (
    text.includes('avto') || text.includes('avariya') || text.includes('mashina') || text.includes('traktor') || text.includes('dtp') ||
    text.includes('mehnat') || text.includes('ishdan bo\'shat') || text.includes('ishga') || text.includes('rabot') || text.includes('uvoln')
  ) {
    return 'Avtohalokat, Mehnat';
  }
  if (
    text.includes('oila') || text.includes('ajrim') || text.includes('er-xotin') || text.includes('farzand') || text.includes('aliment') ||
    text.includes('jinoyat') || text.includes('pichoq') || text.includes('o\'g\'ri') || text.includes('ugri') || text.includes('sudlan') ||
    text.includes('militsiya') || text.includes('semya') || text.includes('brak') || text.includes('razvod') || text.includes('prestupl')
  ) {
    return 'Oilaviy, Jinoyat';
  }
  if (
    text.includes('mulk') || text.includes('uy') || text.includes('yer') || text.includes('kadastr') || text.includes('meros') ||
    text.includes('biznes') || text.includes('shartnoma') || text.includes('tadbirkor') || text.includes('firma') ||
    text.includes('nedvij') || text.includes('kvartir') || text.includes('dogovor') || text.includes('predprin')
  ) {
    return 'Mulk, Biznes';
  }
  if (
    text.includes('migratsiya') || text.includes('viza') || text.includes('chegara') || text.includes('patent') ||
    text.includes('fuqarolik') || text.includes('pasport') || text.includes('xorij') ||
    text.includes('migrats') || text.includes('viz') || text.includes('grazjdan') || text.includes('zagran')
  ) {
    return 'Migratsiya, Fuqarolik';
  }
  return '';
}

export interface Lawyer {
  id: string;
  name: string;
  email: string;
  specialization: string;
  isAvailable: boolean;
  activeCases: number;
  isBlocked?: boolean;
  role: string;
}

export function autoAssignLawyer(description: string, category?: string): { lawyerId: string; lawyerName: string } | null {
  // 1. Get current lawyers list
  const saved = localStorage.getItem('lawyers_list');
  let lawyers: Lawyer[] = [];
  if (saved) {
    try {
      lawyers = JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
  }

  // Ensure all lawyers have isAvailable and activeCases initialized
  let needsSync = false;
  lawyers = lawyers.map(l => {
    let updated = { ...l };
    if (l.isAvailable === undefined) {
      updated.isAvailable = true;
      needsSync = true;
    }
    if (l.activeCases === undefined) {
      updated.activeCases = 0;
      needsSync = true;
    }
    return updated;
  });

  if (needsSync) {
    localStorage.setItem('lawyers_list', JSON.stringify(lawyers));
  }

  // 2. Filter active, unblocked, available, non-admin lawyers
  const candidates = lawyers.filter(l => 
    (l.role === 'lawyer' || l.role === 'advokat') && 
    !l.isBlocked && 
    l.isAvailable
  );

  if (candidates.length === 0) {
    return null;
  }

  // 3. Determine the category
  const catToMatch = category || determineCategory(description);

  // 4. Try to match candidate specialties (case-insensitive substring match)
  let pool = candidates;
  if (catToMatch) {
    const catParts = catToMatch.toLowerCase().split(/[,\s]+/).filter(Boolean);
    const matched = candidates.filter(l => {
      const spec = (l.specialization || '').toLowerCase();
      return catParts.some(part => spec.includes(part) || part.includes(spec));
    });
    if (matched.length > 0) {
      pool = matched;
    }
  }

  // 5. Select the one with lowest activeCases
  pool.sort((a, b) => (a.activeCases || 0) - (b.activeCases || 0));
  const selected = pool[0];

  // 6. Increment activeCases for the assigned lawyer
  const updatedLawyers = lawyers.map(l => {
    if (l.id === selected.id) {
      return {
        ...l,
        activeCases: (l.activeCases || 0) + 1
      };
    }
    return l;
  });

  localStorage.setItem('lawyers_list', JSON.stringify(updatedLawyers));
  window.dispatchEvent(new Event('yurid_lawyers_updated'));

  return { lawyerId: selected.id, lawyerName: selected.name };
}
