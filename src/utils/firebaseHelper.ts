import { Submission, RegisteredUser, PoliceReport, ChatRoom } from '../types';
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
  onSnapshot,
  runTransaction
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

/**
 * 10. Foydalanuvchi profillarini Firestore-ga saqlash
 */
export async function saveUserProfileToFirebase(user: RegisteredUser): Promise<boolean> {
  const path = 'user_profiles';
  try {
    console.log("Foydalanuvchi profili Firestore-ga saqlanmoqda...", user.id);
    await setDoc(doc(db, path, user.id), user);
    return true;
  } catch (error) {
    console.error("Foydalanuvchini Firestore-ga saqlashda xatolik:", error);
    return false;
  }
}

/**
 * 11. Barcha foydalanuvchi profillarini Firestore-dan olish
 */
export async function getUserProfilesFromFirebase(): Promise<RegisteredUser[]> {
  const path = 'user_profiles';
  try {
    console.log("Foydalanuvchilar Firestore-dan yuklanmoqda...");
    const snapshot = await getDocs(collection(db, path));
    const users: RegisteredUser[] = [];
    snapshot.forEach(docSnap => {
      users.push(docSnap.data() as RegisteredUser);
    });
    // Keshni ham yangilaymiz
    localStorage.setItem('user_profiles', JSON.stringify(users));
    return users;
  } catch (error) {
    console.error("Foydalanuvchilarni Firestore-dan olishda xatolik:", error);
    return JSON.parse(localStorage.getItem('user_profiles') || '[]');
  }
}

/**
 * 12. Real-time foydalanuvchilarni tinglash
 */
export function onSnapshotUserProfiles(callback: (users: RegisteredUser[]) => void): () => void {
  const path = 'user_profiles';
  return onSnapshot(collection(db, path), (snapshot) => {
    const users: RegisteredUser[] = [];
    snapshot.forEach(docSnap => {
      users.push(docSnap.data() as RegisteredUser);
    });
    localStorage.setItem('user_profiles', JSON.stringify(users));
    callback(users);
  }, (error) => {
    console.error("Foydalanuvchilarni tinglashda xatolik:", error);
  });
}

/**
 * 13. Foydalanuvchi profilini Firestore-da yangilash
 */
export async function updateUserProfileInFirebase(id: string, updates: Partial<RegisteredUser>): Promise<boolean> {
  const path = 'user_profiles';
  try {
    await updateDoc(doc(db, path, id), updates);
    return true;
  } catch (error) {
    console.error("Foydalanuvchini Firestore-da yangilashda xatolik:", error);
    return false;
  }
}

/**
 * 14. Foydalanuvchi profilini Firestore-dan o'chirish
 */
export async function deleteUserProfileFromFirebase(id: string): Promise<boolean> {
  const path = 'user_profiles';
  try {
    await deleteDoc(doc(db, path, id));
    return true;
  } catch (error) {
    console.error("Foydalanuvchini Firestore-dan o'chirishda xatolik:", error);
    return false;
  }
}

/**
 * 15. Ichki ishlar arizasini (police report) Firestore-ga saqlash
 */
export async function savePoliceReportToFirebase(report: PoliceReport): Promise<boolean> {
  const path = 'police_reports';
  try {
    console.log("Ichki ishlar arizasi Firestore-ga saqlanmoqda...", report.id);
    await setDoc(doc(db, path, report.id), report);
    return true;
  } catch (error) {
    console.error("Ichki ishlar arizasini Firestore-ga saqlashda xatolik:", error);
    return false;
  }
}

/**
 * 16. Barcha ichki ishlar arizalarini Firestore-dan olish
 */
export async function getPoliceReportsFromFirebase(): Promise<PoliceReport[]> {
  const path = 'police_reports';
  try {
    console.log("Ichki ishlar arizalari Firestore-dan yuklanmoqda...");
    const snapshot = await getDocs(collection(db, path));
    const reports: PoliceReport[] = [];
    snapshot.forEach(docSnap => {
      reports.push(docSnap.data() as PoliceReport);
    });
    localStorage.setItem('police_reports_list', JSON.stringify(reports));
    return reports;
  } catch (error) {
    console.error("Ichki ishlar arizalarini Firestore-dan olishda xatolik:", error);
    return JSON.parse(localStorage.getItem('police_reports_list') || '[]');
  }
}

/**
 * 17. Real-time ichki ishlar arizalarini tinglash
 */
export function onSnapshotPoliceReports(callback: (reports: PoliceReport[]) => void): () => void {
  const path = 'police_reports';
  return onSnapshot(collection(db, path), (snapshot) => {
    const reports: PoliceReport[] = [];
    snapshot.forEach(docSnap => {
      reports.push(docSnap.data() as PoliceReport);
    });
    localStorage.setItem('police_reports_list', JSON.stringify(reports));
    callback(reports);
  }, (error) => {
    console.error("Ichki ishlar arizalarini tinglashda xatolik:", error);
  });
}

/**
 * 18. Ichki ishlar arizasini Firestore-da yangilash
 */
export async function updatePoliceReportInFirebase(id: string, updates: Partial<PoliceReport>): Promise<boolean> {
  const path = 'police_reports';
  try {
    await updateDoc(doc(db, path, id), updates);
    return true;
  } catch (error) {
    console.error("Ichki ishlar arizasini Firestore-da yangilashda xatolik:", error);
    return false;
  }
}

/**
 * 19. Ichki ishlar arizasini Firestore-dan o'chirish
 */
export async function deletePoliceReportFromFirebase(id: string): Promise<boolean> {
  const path = 'police_reports';
  try {
    await deleteDoc(doc(db, path, id));
    return true;
  } catch (error) {
    console.error("Ichki ishlar arizasini Firestore-dan o'chirishda xatolik:", error);
    return false;
  }
}

/**
 * 20. Chat xonasini Firestore-ga saqlash (mijoz va advokat o'rtasida)
 */
export async function saveChatRoomToFirebase(room: ChatRoom): Promise<boolean> {
  const path = 'lawyer_chats';
  const docId = `${room.clientId}_${room.lawyerId}`;
  try {
    console.log("Chat xonasi Firestore-ga saqlanmoqda...", docId);
    await setDoc(doc(db, path, docId), room);
    return true;
  } catch (error) {
    console.error("Chat xonasini Firestore-ga saqlashda xatolik:", error);
    return false;
  }
}

/**
 * 21. Barcha chat xonalarini Firestore-dan yuklash
 */
export async function getChatRoomsFromFirebase(): Promise<ChatRoom[]> {
  const path = 'lawyer_chats';
  try {
    console.log("Chat xonalari Firestore-dan yuklanmoqda...");
    const snapshot = await getDocs(collection(db, path));
    const rooms: ChatRoom[] = [];
    snapshot.forEach(docSnap => {
      rooms.push(docSnap.data() as ChatRoom);
    });
    localStorage.setItem('yurid_lawyer_chats', JSON.stringify(rooms));
    return rooms;
  } catch (error) {
    console.error("Chat xonalarini Firestore-dan olishda xatolik:", error);
    return JSON.parse(localStorage.getItem('yurid_lawyer_chats') || '[]');
  }
}

/**
 * 22. Real-time chat xonalarini tinglash
 */
export function onSnapshotChatRooms(callback: (rooms: ChatRoom[]) => void): () => void {
  const path = 'lawyer_chats';
  return onSnapshot(collection(db, path), (snapshot) => {
    const rooms: ChatRoom[] = [];
    snapshot.forEach(docSnap => {
      rooms.push(docSnap.data() as ChatRoom);
    });
    localStorage.setItem('yurid_lawyer_chats', JSON.stringify(rooms));
    callback(rooms);
  }, (error) => {
    console.error("Chat xonalarini tinglashda xatolik:", error);
  });
}

export interface FeatureSettings {
  lawyerHiring: boolean;
  policeComplaint: boolean;
  witnesses: boolean;
  news: boolean;
}

/**
 * 23. Bo'lim sozlamalarini Firestore-ga saqlash
 */
export async function saveFeatureSettingsToFirebase(settings: FeatureSettings): Promise<boolean> {
  const path = 'settings';
  try {
    console.log("Bo'lim sozlamalari Firestore-ga saqlanmoqda...", settings);
    await setDoc(doc(db, path, 'features'), settings);
    return true;
  } catch (error) {
    console.error("Error saving feature settings:", error);
    return false;
  }
}

/**
 * 24. Bo'lim sozlamalarini Firestore-dan olish
 */
export async function getFeatureSettingsFromFirebase(): Promise<FeatureSettings | null> {
  const path = 'settings';
  try {
    console.log("Bo'lim sozlamalari Firestore-dan yuklanmoqda...");
    const docSnap = await getDoc(doc(db, path, 'features'));
    if (docSnap.exists()) {
      return docSnap.data() as FeatureSettings;
    }
    return null;
  } catch (error) {
    console.error("Error getting feature settings:", error);
    return null;
  }
}

/**
 * 25. Bo'lim sozlamalarini real-time tinglash
 */
export function onSnapshotFeatureSettings(callback: (settings: FeatureSettings) => void): () => void {
  const path = 'settings';
  return onSnapshot(doc(db, path, 'features'), (docSnap) => {
    if (docSnap.exists()) {
      callback(docSnap.data() as FeatureSettings);
    }
  }, (error) => {
    console.error("Error listening to feature settings:", error);
  });
}

/**
 * 26. Cheksiz ariza raqami olish uchun tranzaksiya (YU-1, YU-2, ...)
 */
export async function getNextApplicationNumber(): Promise<string> {
  const counterRef = doc(db, 'counters', 'applications');
  try {
    const nextNum = await runTransaction(db, async (transaction) => {
      const counterDoc = await transaction.get(counterRef);
      if (!counterDoc.exists()) {
        transaction.set(counterRef, { current: 1 });
        return 1;
      }
      const newCount = (counterDoc.data().current || 0) + 1;
      transaction.update(counterRef, { current: newCount });
      return newCount;
    });
    return `YU-${nextNum}`;
  } catch (error) {
    console.error("getNextApplicationNumber tranzaksiyasida xatolik:", error);
    // Fallback locally using timestamp or Math.random if Firebase fails
    const localCounter = Number(localStorage.getItem('local_app_counter') || '10') + 1;
    localStorage.setItem('local_app_counter', String(localCounter));
    return `YU-${localCounter}`;
  }
}

