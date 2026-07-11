import { Submission } from '../types';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

/**
  * Har qanday Firestore xatoligini xavfsiz va tizimli ravishda qayta ishlash uchun funksiya
  */
function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore xatoligi:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * 1. Arizani Firebase Firestore ga saqlaydigan funksiya
 */
export async function saveApplicationToFirebase(submission: Submission): Promise<boolean> {
  const path = `applications`;
  try {
    const payload = {
      ...submission,
      sana: submission.createdAt || new Date().toISOString()
    };

    console.log("Firebase Firestore-ga ariza saqlanmoqda...", submission.id);
    // Bizda id mavjud bo'lgani sababli setDoc yordamida hujjat yaratamiz
    await setDoc(doc(db, path, submission.id), payload);
    console.log("✅ Ariza Firebase-ga muvaffaqiyatli saqlandi! ID:", submission.id);
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.WRITE, `${path}/${submission.id}`);
    } catch (err) {
      console.error("Firebase saqlashda xatolik yuz berdi:", err);
    }
    return false;
  }
}

/**
 * 2. Barcha arizalarni Firebase Firestore dan oladigan funksiya
 */
export async function getApplicationsFromFirebase(): Promise<Submission[]> {
  const path = 'applications';
  try {
    console.log("Firebase Firestore-dan arizalar yuklanmoqda...");
    const q = query(collection(db, path), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const apps: Submission[] = [];
    snapshot.forEach(docSnap => {
      apps.push(docSnap.data() as Submission);
    });
    
    console.log(`✅ Firebase-dan ${apps.length}ta ariza olindi.`);
    // Mahalliy keshni ham yangilaymiz
    localStorage.setItem('submissions_list', JSON.stringify(apps));
    return apps;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.LIST, path);
    } catch (err) {
      console.error("Firebase-dan ma'lumot olishda xatolik yuz berdi:", err);
    }
    // Agar xatolik bo'lsa, keshdagi ma'lumotlarni qaytaramiz
    return JSON.parse(localStorage.getItem('submissions_list') || '[]');
  }
}

/**
 * 3. Ariza holatini yoki boshqa maydonlarini yangilaydigan funksiya
 */
export async function updateApplicationInFirebase(id: string, updates: Partial<Submission>): Promise<boolean> {
  const path = `applications`;
  try {
    console.log(`Firebase Firestore-da ariza yangilanmoqda: ${id}`, updates);
    const docRef = doc(db, path, id);
    await updateDoc(docRef, updates);
    console.log("✅ Ariza Firebase-da muvaffaqiyatli yangilandi!");
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.UPDATE, `${path}/${id}`);
    } catch (err) {
      console.error("Firebase-da yangilashda xatolik yuz berdi:", err);
    }
    return false;
  }
}

/**
 * 4. Arizani Firebase dan o'chirish funksiyasi (Optional)
 */
export async function deleteApplicationFromFirebase(id: string): Promise<boolean> {
  const path = `applications`;
  try {
    console.log(`Firebase-dan ariza o'chirilmoqda: ${id}`);
    const docRef = doc(db, path, id);
    await deleteDoc(docRef);
    console.log("✅ Ariza Firebase-dan o'chirildi!");
    return true;
  } catch (error) {
    try {
      handleFirestoreError(error, OperationType.DELETE, `${path}/${id}`);
    } catch (err) {
      console.error("Firebase-dan o'chirishda xatolik yuz berdi:", err);
    }
    return false;
  }
}

/**
 * 5. Real-time Firebase-dan arizalarni tinglash funksiyasi
 */
export function onSnapshotApplications(callback: (apps: Submission[]) => void): () => void {
  const path = 'applications';
  const q = query(collection(db, path), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const apps: Submission[] = [];
    snapshot.forEach(docSnap => {
      apps.push(docSnap.data() as Submission);
    });
    console.log(`⚡ [Real-time] Firestore-dan ${apps.length}ta ariza yangilandi.`);
    localStorage.setItem('submissions_list', JSON.stringify(apps));
    callback(apps);
  }, (error) => {
    console.error("Firebase onSnapshot tinglashda xatolik:", error);
  });
}

export interface ChatDraft {
  id: string;
  fullName?: string;
  phone?: string;
  incidentDate?: string;
  incidentDescription?: string;
  urgency?: string;
  injuries?: string;
  fault?: string;
  step?: string;
  lawyerDrafts?: { [lawyerId: string]: string };
  updatedAt: string;
}

/**
 * 6. Foydalanuvchining local yoki global draft identifikatorini olish yoki yaratish
 */
export function getOrCreateDraftId(): string {
  let draftId = localStorage.getItem('yurid_draft_id');
  if (!draftId) {
    draftId = 'draft_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now();
    localStorage.setItem('yurid_draft_id', draftId);
  }
  return draftId;
}

/**
 * 7. Draft ma'lumotlarini Firebase Firestore ga saqlash
 */
export async function saveDraftToFirebase(draftId: string, draftData: Partial<ChatDraft>): Promise<boolean> {
  const path = 'chat_drafts';
  try {
    const docRef = doc(db, path, draftId);
    await setDoc(docRef, {
      ...draftData,
      id: draftId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving draft to Firestore:", error);
    return false;
  }
}

/**
 * 8. Draft ma'lumotlarini Firebase Firestore dan yuklash
 */
export async function getDraftFromFirebase(draftId: string): Promise<ChatDraft | null> {
  const path = 'chat_drafts';
  try {
    const docRef = doc(db, path, draftId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ChatDraft;
    }
    return null;
  } catch (error) {
    console.error("Error getting draft from Firestore:", error);
    return null;
  }
}

/**
 * 9. Draft ma'lumotlarini Firebase Firestore dan o'chirish (ariza topshirilgach yoki bekor qilingach)
 */
export async function deleteDraftFromFirebase(draftId: string): Promise<boolean> {
  const path = 'chat_drafts';
  try {
    const docRef = doc(db, path, draftId);
    await deleteDoc(docRef);
    return true;
  } catch (error) {
    console.error("Error deleting draft from Firestore:", error);
    return false;
  }
}
