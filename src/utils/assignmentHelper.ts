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

export function autoAssignLawyer(description: string): { lawyerId: string; lawyerName: string } {
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
  let candidates = lawyers.filter(l => l.role === 'lawyer' && !l.isBlocked && l.isAvailable);

  if (candidates.length === 0) {
    // If no available candidates, fallback to any active lawyer
    candidates = lawyers.filter(l => l.role === 'lawyer' && !l.isBlocked);
  }

  if (candidates.length === 0) {
    return { lawyerId: 'admin', lawyerName: 'Super Admin' };
  }

  // 3. Determine the category
  const category = determineCategory(description);

  // 4. Try to match candidate specialties
  let matchedCandidates = candidates;
  if (category) {
    matchedCandidates = candidates.filter(l => {
      const spec = l.specialization.toLowerCase();
      const catParts = category.toLowerCase().split(', ');
      return catParts.some(part => spec.includes(part));
    });
  }

  // If no candidates matched the specialization, fallback to all available candidates
  if (matchedCandidates.length === 0) {
    matchedCandidates = candidates;
  }

  // 5. Select the one with lowest activeCases
  matchedCandidates.sort((a, b) => (a.activeCases || 0) - (b.activeCases || 0));
  const selected = matchedCandidates[0];

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
