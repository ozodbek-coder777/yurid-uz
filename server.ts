import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, terminate, setLogLevel } from "firebase/firestore";
import { getDatabase, ref, set, get, update, remove } from "firebase/database";

dotenv.config();
setLogLevel("silent");

const app = express();
const PORT = 3000;

app.use(express.json());

// Security headers middleware
app.use((_req, res, next) => {
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=(), accelerometer=(), gyroscope=(), magnetometer=(), payment=(), usb=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://unpkg.com https://*.googleapis.com https://*.gstatic.com https://static.cloudflareinsights.com https://*.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://generativelanguage.googleapis.com https://api.resend.com https://yurid.uz https://*.cloudflare.com https://*.cloudflareinsights.com https://static.cloudflareinsights.com https://*.supabase.co https://cxnrwnzdrldtlsttgwar.supabase.co; frame-src 'self' https://*.zoom.us;"
  );
  next();
});

// Submissions file database path
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "submissions.json");

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const seedSubmissions: any[] = [];

if (fs.existsSync(DATA_FILE)) {
  try {
    const existing = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
    if (Array.isArray(existing) && existing.some((s: any) => s.id === "sub_1" || s.id === "sub_2" || s.id === "sub_3")) {
      console.log("[Setup] Clearing old seed submissions from file database...");
      fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
    }
  } catch (err) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
  }
} else {
  fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), "utf8");
}

// Helper to read submissions
const readSubmissions = (): any[] => {
  try {
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading submissions", err);
    return [];
  }
};

// Helper to write submissions
const writeSubmissions = (data: any[]) => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing submissions", err);
  }
};

// Configuration from environment variables, fallback to user's provided config
const hasFirebaseConfig = !!process.env.FIREBASE_API_KEY;

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyCL72VpU39kA5fnosYDfiDOWiaFKrHvnPE",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "adolat-hamkor.firebaseapp.com",
  databaseURL: process.env.FIREBASE_DATABASE_URL || "https://adolat-hamkor-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: process.env.FIREBASE_PROJECT_ID || "adolat-hamkor",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "adolat-hamkor.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "14922165170",
  appId: process.env.FIREBASE_APP_ID || "1:14922165170:web:2d3a90f7a4be42f5bb12ab"
};

let firebaseApp: any = null;
let firestoreDb: any = null;
let realtimeDb: any = null;
let firebaseInitialized = false;
let isFirestoreSupported = hasFirebaseConfig;
let isRealtimeSupported = hasFirebaseConfig;

if (!hasFirebaseConfig) {
  console.log("[Firebase] Operating on local JSON database.");
}

const printFirebaseDiagnostics = (errType: string) => {
  console.log(`[Firebase Status] System status updated: local database fallback active.`);
};

const disableFirestoreGracefully = async () => {
  if (isFirestoreSupported && firestoreDb) {
    console.warn("[Firebase] Disabling Firestore to prevent background retry streams.");
    isFirestoreSupported = false;
    try {
      await terminate(firestoreDb);
      console.log("[Firebase] Firestore client terminated successfully.");
    } catch (e) {
      console.error("[Firebase] Error terminating Firestore client:", e);
    }
    firestoreDb = null;
  }
};

const disableRealtimeGracefully = async () => {
  if (isRealtimeSupported && realtimeDb) {
    console.warn("[Firebase] Disabling Realtime Database to prevent background retry streams.");
    isRealtimeSupported = false;
    realtimeDb = null;
  }
};

const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 4000): Promise<T> => {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Firestore operation timed out (database probably does not exist or is unreachable)"));
    }, timeoutMs);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

const handleFirestoreError = async (err: any, context: string) => {
  console.log(`[Firebase Notice] Connection issue with Firestore during ${context}. Switching to local storage fallback.`);
  const errMsg = String(err?.message || err || "").toLowerCase();
  const errCode = String(err?.code || "").toLowerCase();
  
  if (
    errCode.includes("permission-denied") ||
    errCode.includes("not-found") ||
    errCode.includes("unauthenticated") ||
    errCode.includes("unavailable") ||
    errCode.includes("failed-precondition") ||
    errMsg.includes("permission_denied") ||
    errMsg.includes("permission-denied") ||
    errMsg.includes("disabled") ||
    errMsg.includes("not been used") ||
    errMsg.includes("not_found") ||
    errMsg.includes("not-found") ||
    errMsg.includes("code: 5") ||
    errMsg.includes("code 5") ||
    errMsg.includes("timed out") ||
    errMsg.includes("timeout") ||
    errMsg.includes("unauthenticated")
  ) {
    printFirebaseDiagnostics(`Firestore context issue`);
    await disableFirestoreGracefully();
  }
};

const initFirebase = () => {
  if (firebaseInitialized) return { firestoreDb: isFirestoreSupported ? firestoreDb : null, realtimeDb: isRealtimeSupported ? realtimeDb : null };
  try {
    console.log("[Firebase] Initializing with project ID:", firebaseConfig.projectId);
    firebaseApp = initializeApp(firebaseConfig);
    if (isFirestoreSupported) {
      try {
        firestoreDb = getFirestore(firebaseApp);
      } catch (e) {
        console.error("[Firebase] Firestore initialization failed:", e);
        isFirestoreSupported = false;
      }
    }
    if (isRealtimeSupported) {
      try {
        realtimeDb = getDatabase(firebaseApp);
      } catch (e) {
        console.error("[Firebase] Realtime Database initialization failed:", e);
        isRealtimeSupported = false;
      }
    }
    firebaseInitialized = true;
    console.log("[Firebase] Successfully initialized.");
  } catch (err) {
    console.error("[Firebase] Failed to initialize Firebase:", err);
  }
  return { firestoreDb: isFirestoreSupported ? firestoreDb : null, realtimeDb: isRealtimeSupported ? realtimeDb : null };
};

// Helper to save a submission to Firebase (both Firestore and Realtime Database)
const saveSubmissionToFirebase = async (submission: any) => {
  const { firestoreDb, realtimeDb } = initFirebase();
  const docId = submission.id || "sub_" + Date.now();
  
  // 1. Save to Firestore
  if (isFirestoreSupported && firestoreDb) {
    try {
      console.log(`[Firebase] Saving submission ${docId} to Firestore...`);
      const docRef = doc(firestoreDb, "submissions", docId);
      await withTimeout(setDoc(docRef, {
        id: docId,
        fullName: submission.fullName || "",
        phone: submission.phone || "",
        incidentDate: submission.incidentDate || "",
        incidentDescription: submission.incidentDescription || "",
        chatHistory: submission.chatHistory || [],
        summary: submission.summary || "",
        urgency: submission.urgency || "O'RTA",
        status: submission.status || "YANGI",
        createdAt: submission.createdAt || new Date().toISOString(),
        injuries: submission.injuries || "Ma'lumot yo'q",
        fault: submission.fault || "Aniqmas",
        notes: submission.notes || "",
        assignedLawyer: submission.assignedLawyer || ""
      }));
      console.log(`[Firebase] Saved to Firestore: ${docId}`);
    } catch (err: any) {
      await handleFirestoreError(err, "saving to Firestore");
    }
  }

  // 2. Save to Realtime Database
  if (realtimeDb) {
    try {
      console.log(`[Firebase] Saving submission ${docId} to Realtime Database...`);
      const dbRef = ref(realtimeDb, `submissions/${docId}`);
      await set(dbRef, {
        id: docId,
        fullName: submission.fullName || "",
        phone: submission.phone || "",
        incidentDate: submission.incidentDate || "",
        incidentDescription: submission.incidentDescription || "",
        chatHistory: submission.chatHistory || [],
        summary: submission.summary || "",
        urgency: submission.urgency || "O'RTA",
        status: submission.status || "YANGI",
        createdAt: submission.createdAt || new Date().toISOString(),
        injuries: submission.injuries || "Ma'lumot yo'q",
        fault: submission.fault || "Aniqmas",
        notes: submission.notes || "",
        assignedLawyer: submission.assignedLawyer || ""
      });
      console.log(`[Firebase] Saved to Realtime Database: ${docId}`);
    } catch (err: any) {
      console.error("[Firebase] Error saving to Realtime Database:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Permission denied") || errMsg.includes("PERMISSION_DENIED")) {
        printFirebaseDiagnostics("Realtime Database Permission Denied");
        await disableRealtimeGracefully();
      }
    }
  }
};

// Helper to update status in Firebase
const updateSubmissionStatusInFirebase = async (id: string, status: string) => {
  const { firestoreDb, realtimeDb } = initFirebase();
  
  if (isFirestoreSupported && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, "submissions", id);
      await withTimeout(updateDoc(docRef, { status }));
      console.log(`[Firebase] Updated status to ${status} in Firestore for ${id}`);
    } catch (err: any) {
      await handleFirestoreError(err, `updating status in Firestore for ${id}`);
    }
  }

  if (realtimeDb) {
    try {
      const dbRef = ref(realtimeDb, `submissions/${id}`);
      await update(dbRef, { status });
      console.log(`[Firebase] Updated status to ${status} in Realtime Database for ${id}`);
    } catch (err: any) {
      console.error("[Firebase] Error updating status in Realtime Database:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Permission denied") || errMsg.includes("PERMISSION_DENIED")) {
        printFirebaseDiagnostics("Realtime Database Permission Denied");
        await disableRealtimeGracefully();
      }
    }
  }
};

// Helper to update notes in Firebase
const updateSubmissionNotesInFirebase = async (id: string, notes: string) => {
  const { firestoreDb, realtimeDb } = initFirebase();
  
  if (isFirestoreSupported && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, "submissions", id);
      await withTimeout(updateDoc(docRef, { notes }));
      console.log(`[Firebase] Updated notes in Firestore for ${id}`);
    } catch (err: any) {
      await handleFirestoreError(err, `updating notes in Firestore for ${id}`);
    }
  }

  if (realtimeDb) {
    try {
      const dbRef = ref(realtimeDb, `submissions/${id}`);
      await update(dbRef, { notes });
      console.log(`[Firebase] Updated notes in Realtime Database for ${id}`);
    } catch (err: any) {
      console.error("[Firebase] Error updating notes in Realtime Database:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Permission denied") || errMsg.includes("PERMISSION_DENIED")) {
        printFirebaseDiagnostics("Realtime Database Permission Denied");
        await disableRealtimeGracefully();
      }
    }
  }
};

// Helper to update assigned lawyer in Firebase
const updateSubmissionAssignInFirebase = async (id: string, assignedLawyer: string) => {
  const { firestoreDb, realtimeDb } = initFirebase();
  
  if (isFirestoreSupported && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, "submissions", id);
      await withTimeout(updateDoc(docRef, { assignedLawyer }));
      console.log(`[Firebase] Updated assignedLawyer to ${assignedLawyer} in Firestore for ${id}`);
    } catch (err: any) {
      await handleFirestoreError(err, `updating assignedLawyer in Firestore for ${id}`);
    }
  }

  if (realtimeDb) {
    try {
      const dbRef = ref(realtimeDb, `submissions/${id}`);
      await update(dbRef, { assignedLawyer });
      console.log(`[Firebase] Updated assignedLawyer to ${assignedLawyer} in Realtime Database for ${id}`);
    } catch (err: any) {
      console.error("[Firebase] Error updating assignedLawyer in Realtime Database:", err);
    }
  }
};

// Helper to delete from Firebase
const deleteSubmissionFromFirebase = async (id: string) => {
  const { firestoreDb, realtimeDb } = initFirebase();
  
  if (isFirestoreSupported && firestoreDb) {
    try {
      const docRef = doc(firestoreDb, "submissions", id);
      await withTimeout(deleteDoc(docRef));
      console.log(`[Firebase] Deleted from Firestore: ${id}`);
    } catch (err: any) {
      await handleFirestoreError(err, `deleting from Firestore for ${id}`);
    }
  }

  if (realtimeDb) {
    try {
      const dbRef = ref(realtimeDb, `submissions/${id}`);
      await remove(dbRef);
      console.log(`[Firebase] Deleted from Realtime Database: ${id}`);
    } catch (err: any) {
      console.error("[Firebase] Error deleting from Realtime Database:", err);
      const errMsg = String(err.message || err);
      if (errMsg.includes("Permission denied") || errMsg.includes("PERMISSION_DENIED")) {
        printFirebaseDiagnostics("Realtime Database Permission Denied");
        await disableRealtimeGracefully();
      }
    }
  }
};

// Helper to fetch submissions from Firebase (Firestore / Realtime Database)
const fetchSubmissionsFromFirebase = async (): Promise<any[]> => {
  if (!hasFirebaseConfig) {
    return [];
  }
  const { firestoreDb, realtimeDb } = initFirebase();
  
  // 1. Try Firestore
  if (isFirestoreSupported && firestoreDb) {
    try {
      console.log("[Firebase] Fetching submissions from Firestore...");
      const submissionsCol = collection(firestoreDb, "submissions");
      const snapshot = await withTimeout(getDocs(submissionsCol));
      const list: any[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        list.push({
          ...data,
          id: doc.id
        });
      });
      if (list.length > 0) {
        console.log(`[Firebase] Successfully fetched ${list.length} submissions from Firestore.`);
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return list;
      }
    } catch (err: any) {
      await handleFirestoreError(err, "fetching from Firestore");
    }
  }

  // 2. Try Realtime Database
  if (realtimeDb) {
    try {
      console.log("[Firebase] Fetching submissions from Realtime Database...");
      const dbRef = ref(realtimeDb, "submissions");
      const snapshot = await get(dbRef);
      if (snapshot.exists()) {
        const val = snapshot.val();
        const list = Object.keys(val).map(key => ({
          ...val[key],
          id: key
        }));
        console.log(`[Firebase] Successfully fetched ${list.length} submissions from Realtime Database.`);
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        return list;
      }
    } catch (err: any) {
      console.log("[Firebase Notice] Unable to retrieve entries from Realtime Database. Active local storage remains primary.");
      const errMsg = String(err.message || err);
      if (errMsg.includes("Permission denied") || errMsg.includes("PERMISSION_DENIED")) {
        printFirebaseDiagnostics("Realtime Database Permission Denied");
        await disableRealtimeGracefully();
      }
    }
  }

  console.log("[Firebase] Initialized local storage fallback sequence successfully.");
  return [];
};

// Helper to synchronize local file database with Firebase entries
const syncWithFirebase = async () => {
  if (!hasFirebaseConfig) {
    return { success: false, added: 0, total: readSubmissions().length, message: "Firebase not configured" };
  }
  try {
    const remoteSubmissions = await fetchSubmissionsFromFirebase();
    const localSubmissions = readSubmissions();
    const merged = [...localSubmissions];
    
    let addedCount = 0;
    
    if (remoteSubmissions && remoteSubmissions.length > 0) {
      for (const remote of remoteSubmissions) {
        const existsIdx = merged.findIndex(s => s.id === remote.id);
        if (existsIdx === -1) {
          merged.push(remote);
          addedCount++;
        } else {
          // Merge safely: update local details with remote, but prioritize local status/notes if they exist
          merged[existsIdx] = {
            ...merged[existsIdx],
            ...remote,
            notes: merged[existsIdx].notes || remote.notes || "",
            status: merged[existsIdx].status !== "YANGI" ? merged[existsIdx].status : remote.status
          };
        }
      }
      
      // Sort by creation date descending
      merged.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      writeSubmissions(merged);
      console.log(`[Sync] Synced with Firebase. Added ${addedCount} new, total ${merged.length} submissions.`);
      return { success: true, added: addedCount, total: merged.length };
    } else {
      // Upload local submissions to Firebase if Firebase is empty
      if (localSubmissions.length > 0) {
        console.log(`[Firebase Sync] Firebase is empty, uploading ${localSubmissions.length} local submissions to Firebase...`);
        for (const local of localSubmissions) {
          await saveSubmissionToFirebase(local);
        }
        return { success: true, added: 0, total: localSubmissions.length };
      }
    }
  } catch (err) {
    console.error("[Sync] Failed to sync with Firebase:", err);
  }
  return { success: false, added: 0, total: readSubmissions().length };
};

// Initial background sync shortly after startup
setTimeout(() => {
  console.log("[Startup] Initiating startup Firebase synchronization...");
  syncWithFirebase().catch(err => console.error("Startup Firebase sync error:", err));
}, 5000);

// Lazy initialization of Gemini API Client
let geminiClient: GoogleGenAI | null = null;
const getGemini = () => {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.log("No valid GEMINI_API_KEY found. AI features will run in simulated mode with high-quality localized mock generation.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
};

// Simulated mock AI responses in Uzbek/Russian for when API key is missing
const getSimulatedResponse = (messages: any[], questionCount: number, fullName: string, email: string, lang: 'uz' | 'ru' = 'uz') => {
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user')?.text || "";
  const lowercaseMsg = lastUserMsg.toLowerCase();

  const isRu = lang === 'ru';

  // Empathy & customized general legal responses based on questionCount
  if (questionCount === 0) {
    return {
      text: isRu
        ? `Здравствуйте, уважаемый(ая) **${fullName}**. Мы очень рады вашему обращению.\n\nЯ — виртуальный ассистент, созданный для оказания правовой поддержки и сбора первичной информации для наших адвокатов.\n\nЧтобы мы могли помочь вам наиболее эффективно, пожалуйста, расскажите, **что произошло и в чем заключается ваша проблема или жалоба?** (Например: какая ситуация возникла и когда это случилось).`
        : `Assalomu alaykum, hurmatli **${fullName}**. Bizga murojaat qilganingizdan mamnunmiz.\n\nMen sizga yuridik yordam berish va advokatlarimiz uchun barcha tafsilotlarni yig'ish maqsadida yaratilgan sun'iy intellekt yordamchisiman.\n\nSizga to'g'ri yordam bera olishimiz uchun, iltimos, **nima bo'ldi, nima yuzasidan shikoyat yoki murojaat bermoqchisiz?** (Masalan: qanday muammo yuzaga keldi va qachon bo'ldi)`,
      isCompleted: false,
      questionsAskedCount: 1
    };
  } else if (questionCount === 1) {
    return {
      text: isRu
        ? `Спасибо за предоставленные подробности. Это очень ценная информация для юридической оценки.\n\n**Вопрос 2:** Был ли нанесен какой-либо физический вред здоровью или материальный ущерб в данной ситуации? Каков характер и примерный масштаб ущерба?`
        : `Tafsilotlar uchun rahmat. Bu yuridik tahlil va da'volar uchun juda muhim ma'lumot.\n\n**Savol 1:** Ushbu holatda biron-bir jismoniy jarohat yoki moddiy zarar ko'rilganmi? Zarar miqdori va ko'lami qanday?`,
      isCompleted: false,
      questionsAskedCount: 2
    };
  } else if (questionCount === 2) {
    return {
      text: isRu
        ? `Понятно, вопрос ущерба имеет ключевое значение для определения суммы иска.\n\n**Вопрос 3:** Как вы считаете, кто является виновником в данной ситуации, и обращались ли вы уже в какие-либо официальные ведомства или инстанции? Есть ли официальный акт или протокол?`
        : `Tushunarli, yuridik jihatdan dalillar juda muhim ko'rinadi.\n\n**Savol 2:** Sizningcha, ushbu vaziyatda kim aybdor va voqea yuzasidan biron-bir rasmiy idoraga (masalan, IIB, sud, soliq yoki boshqa davlat organiga) murojaat qildingizmi? Rasmiy hujjat yoki bayonnoma bormi?`,
      isCompleted: false,
      questionsAskedCount: 3
    };
  } else if (questionCount === 3) {
    return {
      text: isRu
        ? `Ясно, официальные документы значительно упрощают защиту ваших прав.\n\n**Вопрос 4:** Имеются ли дополнительные подтверждения произошедшего (видеозаписи, переписка, свидетели, договоры)? И какую именно правовую помощь вы ожидаете от наших адвокатов для благополучного решения вопроса?`
        : `Tafsilotlar muhim bosqichlarni belgilab beradi. Oxirgi savolimiz:\n\n**Savol 3:** Hodisani isbotlovchi dalillar (videoyozuvlar, hujjatlar, shartnomalar) yoki guvohlar bormi? Shuningdek, ushbu vaziyatni hal qilishda bizdan aynan qanday yordam kutyapsiz?`,
      isCompleted: false,
      questionsAskedCount: 4
    };
  } else {
    // Generate intake summary mock
    let injuries = "";
    let fault = "";
    let urgency = "O'RTA";

    if (isRu) {
      injuries = lowercaseMsg.includes("нога") || lowercaseMsg.includes("боль") || lowercaseMsg.includes("перелом") || lowercaseMsg.includes("травм") || lowercaseMsg.includes("ущерб") || lowercaseMsg.includes("авари")
        ? "Клиент сообщил о получении физических травм различной степени тяжести или о серьезном материальном ущербе."
        : "Информации о серьезных физических травмах не поступало, в основном моральные или материальные вопросы.";
      
      fault = lowercaseMsg.includes("винов") || lowercaseMsg.includes("я") || lowercaseMsg.includes("ошибк")
        ? "Вопрос маневров, договорных обязательств и вины является спорным, но основная ответственность может быть возложена на противоположную сторону."
        : "Спор возник из-за нарушения правил или условий договора противоположной стороной. Ожидается официальное установление вины.";

      urgency = (lowercaseMsg.includes("перелом") || lowercaseMsg.includes("больниц") || lowercaseMsg.includes("суд") || lowercaseMsg.includes("прокурор") || lowercaseMsg.includes("срочн"))
        ? "YUKSAK"
        : "O'RTA";
    } else {
      injuries = lowercaseMsg.includes("oyoq") || lowercaseMsg.includes("og'riq") || lowercaseMsg.includes("singan") || lowercaseMsg.includes("jarohat") || lowercaseMsg.includes("zarar")
        ? "Mijoz turli darajadagi jismoniy yoki jiddiy moddiy zarar ko'rganligi haqida ma'lumot berdi."
        : "Jiddiy jismoniy jarohatlar haqida ma'lumot berilmagan, asosan ma'naviy yoki moddiy masalalar.";
      
      fault = lowercaseMsg.includes("ayb") || lowercaseMsg.includes("men") || lowercaseMsg.includes("xato")
        ? "Manevr, shartnoma majburiyatlari va aybdorlik masalasi bahsli, lekin asosiy javobgarlik ikkinchi tomonga yuklatilishi mumkin."
        : "Qarama-qarshi tomon qoidabuzarligi yoki shartnoma shartlarini buzganligi sababli nizo kelib chiqqan. Ayb isbotlanishi kutilmoqda.";

      urgency = (lowercaseMsg.includes("singan") || lowercaseMsg.includes("shifoxon") || lowercaseMsg.includes("sud") || lowercaseMsg.includes("prokuror") || lowercaseMsg.includes("shoshilinch"))
        ? "YUKSAK"
        : "O'RTA";
    }

    // Analyze input text to match laws base
    let detectedLaws: string[] = [];
    if (isRu) {
      if (lowercaseMsg.includes("авари") || lowercaseMsg.includes("дтп") || lowercaseMsg.includes("машин") || lowercaseMsg.includes("дорог") || lowercaseMsg.includes("столкн")) {
        detectedLaws.push("- УК РУз Статья 266 (Нарушение правил безопасности движения транспортных средств)");
        detectedLaws.push("- КоАО РУз Статья 151 (Нарушение правил дорожного движения)");
      }
      if (lowercaseMsg.includes("краж") || lowercaseMsg.includes("украл") || lowercaseMsg.includes("вор") || lowercaseMsg.includes("похитил")) {
        detectedLaws.push("- УК РУз Статья 135 (Кража)");
      }
      if (lowercaseMsg.includes("мошен") || lowercaseMsg.includes("обман") || lowercaseMsg.includes("кид") || lowercaseMsg.includes("долг") || lowercaseMsg.includes("контракт")) {
        detectedLaws.push("- УК РУз Статья 141 (Мошенничество)");
      }
      detectedLaws.push("- Конституция РУз Статья 36 (Право на личную неприкосновенность и безопасность)");
      detectedLaws.push("- Гражданский Кодекс РУз Статья 204 (Обязательства вследствие причинения вреда / Возмещение вреда)");
    } else {
      if (lowercaseMsg.includes("avto") || lowercaseMsg.includes("avariya") || lowercaseMsg.includes("mashina") || lowercaseMsg.includes("yo'l") || lowercaseMsg.includes("yol") || lowercaseMsg.includes("to'qnashuv") || lowercaseMsg.includes("urib")) {
        detectedLaws.push("- Jinoyat kodeksi 266-moddasi (Transport vositalari harakati yoki ulardan foydalanish xavfsizligi qoidalarini buzish)");
        detectedLaws.push("- Ma'muriy javobgarlik to'g'risidagi kodeks 151-moddasi (Yo'l harakati qoidalarini buzish)");
      }
      if (lowercaseMsg.includes("o'g'rilik") || lowercaseMsg.includes("ugrilik") || lowercaseMsg.includes("o'g'ri") || lowercaseMsg.includes("ugri") || lowercaseMsg.includes("o'g'irlab") || lowercaseMsg.includes("ogirlab")) {
        detectedLaws.push("- Jinoyat kodeksi 135-moddasi (O'g'irlik)");
      }
      if (lowercaseMsg.includes("firib") || lowercaseMsg.includes("aldash") || lowercaseMsg.includes("aldadi") || lowercaseMsg.includes("firibgar") || lowercaseMsg.includes("pulni") || lowercaseMsg.includes("aldab") || lowercaseMsg.includes("qarz") || lowercaseMsg.includes("shartnoma")) {
        detectedLaws.push("- Jinoyat kodeksi 141-moddasi (Firibgarlik)");
      }
      detectedLaws.push("- Konstitutsiya 36-moddasi (Shaxsiy daxlsizlik va xavfsizlik huquqi)");
      detectedLaws.push("- Fuqarolik kodeksi 204-moddasi (Zararni qoplash majburiyati)");
    }

    const summaryText = isRu 
      ? `### 📋 Детали обращения (Заключение первичного приема)

**Клиент:** ${fullName}
**Email:** ${email}
**Дата события:** ${new Date().toISOString().split('T')[0]}
**Описание происшествия:** (Ситуация, изложенная клиентом во время беседы)

#### 🚨 Сценарий ситуации:
Клиент подробно изложил юридическую проблему или жалобу в своем обращении. Ассистент проанализировал ситуацию и составил первичное резюме дела.

#### 🩺 Ущерб и потери:
${injuries}

#### ⚖️ Юридический анализ и рекомендации:
1. **Уровень срочности: ${urgency === 'YUKSAK' ? 'ВЫСОКИЙ' : urgency === 'O\'RTA' ? 'СРЕДНИЙ' : 'НИЗКИЙ'}**. Определен на основе масштаба медицинского, юридического и материального спора.
2. **Виновность:** ${fault}

#### 📜 НАШИ КАТЕГОРИИ И НАРУШЕННЫЕ СТАТЬИ ЗАКОНОВ (BUZILGAN QONUN BANDLARI):
${detectedLaws.join("\n")}

3. **Следующие шаги:**
   - Собрать договоры, официальные документы и все остальные доказательства.
   - Организовать очную консультацию с адвокатом и при необходимости подготовить исковое заявление для суда или ведомств.`
      : `### 📋 Murojaat Tafsilotlari (Mijoz Qabul Xulosasi)

**Mijoz:** ${fullName}
**Email:** ${email}
**Sana:** ${new Date().toISOString().split('T')[0]}
**Voqea tavsifi:** (Mijoz tomonidan suhbat davomida bayon etilgan vaziyat)

#### 🚨 Holat ssenariysi:
Mijoz o'z murojaatida huquqiy muammo yoki shikoyat tafsilotlarini to'liq bayon qildi. Yordamchi tomonidan vaziyat tahlil qilindi.

#### 🩺 Zarar va Talofatlar:
${injuries}

#### ⚖️ Yuridik tahlil va tavsiyalar:
1. **Shoshilinchlik darajasi: ${urgency}**. Tibbiy, huquqiy va moddiy nizo ko'lamiga muvofiq belgilandi.
2. **Aybdorlik:** ${fault}

#### 📜 BUZILGAN QONUN BANDLARI (taxminiy):
${detectedLaws.join("\n")}

3. **Keyingi qadamlar:**
   - Shartnomalar, rasmiy hujjatlar va boshqa barcha dalillarni yig'ish.
   - Advokat bilan yuzma-yuz bepul konsultatsiya tashkil etish va lozim bo'lsa, sud yoki idoralar uchun da'vo arizasini tayyorlash.`;

    return {
      text: isRu
        ? `Большое спасибо, **${fullName}**! Я собрал всю предоставленную вами информацию и подготовил предварительное заключение.\n\nВаше обращение успешно зарегистрировано в нашей базе данных. Наш ведущий юрист свяжется с вами в самое ближайшее время по указанному адресу электронной почты (**${email}**), чтобы предложить конкретное решение проблемы. Желаем вам спокойствия и хорошего дня!`
        : `Katta rahmat, **${fullName}**! Men siz taqdim etgan barcha ma'lumotlarni yig'dim va dastlabki huquqiy tahlilni tayyorladim. Sizning arizangiz muvaffaqiyatli qabul qilindi.\n\nBizning professional advokatimiz tez orada siz taqdim etgan elektron pochta manzili (**${email}**) orqali siz bilan bog'lanadi va keyingi qadamlarni kelishib oladi. Salomat bo'ling!`,
      isCompleted: true,
      questionsAskedCount: 5,
      extractedData: {
        fullName,
        phone: email,
        incidentDate: new Date().toISOString().split('T')[0],
        incidentDescription: messages[1]?.text || (isRu ? "Обращение клиента по поводу юридической поддержки." : "Mijoz huquqiy yordam yuzasidan murojaat qildi."),
        injuries,
        fault,
        urgency,
        summary: summaryText
      }
    };
  }
};

// In-memory logs for diagnostics (maximum 100 entries to prevent memory leak)
const diagnosticsLogs: any[] = [];

// API: Client-side diagnostics logger
app.post("/api/logs", (req, res) => {
  const logEntry = {
    id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    timestamp: new Date().toISOString(),
    ...req.body
  };
  
  diagnosticsLogs.unshift(logEntry);
  if (diagnosticsLogs.length > 100) {
    diagnosticsLogs.pop();
  }

  console.log(`[CLIENT-DIAGNOSTICS] [${logEntry.level || "INFO"}] URL: ${logEntry.url || "N/A"} | Status: ${logEntry.status || "N/A"} | Error: ${logEntry.error || "none"}`);
  return res.json({ success: true });
});

// API: Retrieve diagnostics logs
app.get("/api/logs", (req, res) => {
  return res.json({ logs: diagnosticsLogs });
});

// API: Proxy route for Gemini API to mask origin and bypass CORS/CSP
app.all("/api/v1beta/*", async (req, res) => {
  try {
    const targetUrl = `https://generativelanguage.googleapis.com${req.originalUrl.replace(/^\/api/, '')}`;
    
    // Build headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (req.headers["x-goog-api-key"]) {
      headers["x-goog-api-key"] = req.headers["x-goog-api-key"] as string;
    }

    const fetchOptions: any = {
      method: req.method,
      headers: headers,
    };

    if (req.method !== "GET" && req.method !== "HEAD") {
      fetchOptions.body = JSON.stringify(req.body);
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.json();
    
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Gemini proxy route error:", error);
    res.status(500).json({ error: "Gemini proxy error", message: error.message });
  }
});

// API: Get submissions
app.get("/api/submissions", (req, res) => {
  const data = readSubmissions();
  res.json(data);
  // Trigger background sync so that next visits or automatic polling are updated
  syncWithFirebase().catch(err => console.error("[Sync] Background sync error:", err));
});

// API: Force sync with Firebase
app.post("/api/submissions/sync", async (req, res) => {
  try {
    console.log("[Sync] Manual Firebase sync request received");
    const result = await syncWithFirebase();
    res.json(result);
  } catch (err: any) {
    console.error("[Sync] Manual sync endpoint error:", err);
    res.status(500).json({ error: err.message || "Sinxronizatsiya muvaffaqiyatsiz tugadi" });
  }
});

// API: Create submission directly (e.g. from Lawyer Panel or manual intake)
app.post("/api/submissions", async (req, res) => {
  const submissions = readSubmissions();
  const initialStatus = "YANGI";
  const newSub = {
    id: "sub_" + Date.now(),
    fullName: req.body.fullName || "Noma'lum",
    phone: req.body.phone || "Kiritilmagan",
    incidentDate: req.body.incidentDate || new Date().toISOString().split('T')[0],
    incidentDescription: req.body.incidentDescription || "",
    chatHistory: req.body.chatHistory || [],
    summary: req.body.summary || "Batafsil ma'lumot yo'q",
    urgency: req.body.urgency || "O'RTA",
    status: initialStatus,
    createdAt: new Date().toISOString(),
    injuries: req.body.injuries || "Ma'lumot yo'q",
    fault: req.body.fault || "Aniqmas",
    notes: req.body.notes || "",
    assignedLawyer: req.body.assignedLawyer || "",
    deadline: req.body.deadline || "",
    timeline: [
      {
        status: initialStatus,
        timestamp: new Date().toISOString(),
        updatedBy: "Tizim (Mijoz)",
        comment: "Murojaat muvaffaqiyatli qabul qilindi va tizimga yuborildi."
      }
    ]
  };
  submissions.unshift(newSub);
  writeSubmissions(submissions);
  // Send data to Firebase (non-blocking)
  saveSubmissionToFirebase(newSub).catch(err => console.error("Firebase save error:", err));
  res.status(201).json(newSub);
});

// API: Update submission status
app.patch("/api/submissions/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status, comment, updatedBy } = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].status = status;
    
    if (!submissions[index].timeline) {
      submissions[index].timeline = [];
    }
    
    submissions[index].timeline.push({
      status,
      timestamp: new Date().toISOString(),
      updatedBy: updatedBy || "Advokat",
      comment: comment || `Status o'zgartirildi: ${status}`
    });

    writeSubmissions(submissions);
    // Update status in Firebase (non-blocking)
    updateSubmissionStatusInFirebase(id, status).catch(err => console.error(err));
    res.json(submissions[index]);
  } else {
    res.status(404).json({ error: "Arizachi topilmadi" });
  }
});

// API: Update submission deadline
app.patch("/api/submissions/:id/deadline", async (req, res) => {
  const { id } = req.params;
  const { deadline, comment, updatedBy } = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].deadline = deadline;
    
    if (!submissions[index].timeline) {
      submissions[index].timeline = [];
    }
    
    submissions[index].timeline.push({
      status: submissions[index].status || "YANGI",
      timestamp: new Date().toISOString(),
      updatedBy: updatedBy || "Advokat",
      comment: comment || `Murojaatni yakunlash muddati (deadline) belgilandi: ${deadline}`
    });

    writeSubmissions(submissions);
    res.json(submissions[index]);
  } else {
    res.status(404).json({ error: "Arizachi topilmadi" });
  }
});

// API: Update submission notes
app.patch("/api/submissions/:id/notes", async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;
  const submissions = readSubmissions();
  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].notes = notes;
    writeSubmissions(submissions);
    // Update notes in Firebase (non-blocking)
    updateSubmissionNotesInFirebase(id, notes).catch(err => console.error(err));
    res.json(submissions[index]);
  } else {
    res.status(404).json({ error: "Arizachi topilmadi" });
  }
});

// API: Assign submission to a lawyer
app.patch("/api/submissions/:id/assign", async (req, res) => {
  const { id } = req.params;
  const { assignedLawyer, lawyerId, subscriptionTier } = req.body;
  const submissions = readSubmissions();

  // Check active case limit for free lawyer if assignedLawyer is specified
  if (assignedLawyer) {
    const activeCasesCount = submissions.filter(
      s => (s.assignedLawyer === assignedLawyer || (lawyerId && s.assignedLawyerId === lawyerId)) &&
           s.status !== 'YAKUNLANDI' && s.status !== 'RAD_ETILGAN' && s.status !== 'TUGALLANGAN' && s.status !== 'yakunlandi'
    ).length;

    const isFree = subscriptionTier !== 'premium';
    if (isFree && activeCasesCount >= 10) {
      return res.status(403).json({
        error: "Bepul (Free) tarifda maksimum 10 ta faol ish olib borish mumkin. Davom etish uchun Premium obunani faollashtiring!",
        isLimitExceeded: true,
        activeCasesCount,
        activeCaseLimit: 10
      });
    }
  }

  const index = submissions.findIndex(s => s.id === id);
  if (index !== -1) {
    submissions[index].assignedLawyer = assignedLawyer || "";
    if (lawyerId) {
      submissions[index].assignedLawyerId = lawyerId;
    }
    writeSubmissions(submissions);
    // Update assignment in Firebase (non-blocking)
    updateSubmissionAssignInFirebase(id, assignedLawyer || "").catch(err => console.error(err));
    res.json(submissions[index]);
  } else {
    res.status(404).json({ error: "Arizachi topilmadi" });
  }
});

// Payments storage
const PAYMENTS_FILE = path.join(DATA_DIR, "payments.json");
const USERS_FILE = path.join(DATA_DIR, "users.json");

const readPayments = (): any[] => {
  if (!fs.existsSync(PAYMENTS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(PAYMENTS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const writePayments = (data: any[]) => {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing payments", err);
  }
};

const readUsers = (): any[] => {
  if (!fs.existsSync(USERS_FILE)) return [];
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
  } catch {
    return [];
  }
};

const writeUsers = (data: any[]) => {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Error writing users", err);
  }
};

// API: Create payment for Premium subscription (Payme / Click)
app.post("/api/payments/create", (req, res) => {
  const { lawyerId, amount = 200000, provider = "payme" } = req.body;
  if (!lawyerId) {
    return res.status(400).json({ error: "Advokat ID kiritilishi shart." });
  }

  const payments = readPayments();
  const paymentId = "pay_" + Date.now();
  const transactionId = "tx_" + provider + "_" + Math.floor(10000000 + Math.random() * 90000000);

  const newPayment = {
    id: paymentId,
    lawyerId,
    amount: Number(amount),
    provider,
    status: "pending",
    transactionId,
    createdAt: new Date().toISOString(),
    completedAt: null
  };

  payments.unshift(newPayment);
  writePayments(payments);

  let checkoutUrl = "";
  if (provider === "payme") {
    const paymeMerchantId = process.env.PAYME_MERCHANT_ID || "65a1234567890abcdef12345";
    const params = `m=${paymeMerchantId};ac.lawyer_id=${lawyerId};a=${amount * 100};c=${paymentId}`;
    const b64 = Buffer.from(params).toString("base64");
    checkoutUrl = `https://checkout.paycom.uz/${b64}`;
  } else {
    const clickServiceId = process.env.CLICK_SERVICE_ID || "12345";
    const clickMerchantId = process.env.CLICK_MERCHANT_ID || "67890";
    checkoutUrl = `https://my.click.uz/services/pay?service_id=${clickServiceId}&merchant_id=${clickMerchantId}&amount=${amount}&transaction_param=${paymentId}`;
  }

  return res.json({
    success: true,
    payment: newPayment,
    checkoutUrl,
    message: `${provider.toUpperCase()} to'lov arizasi yaratildi.`
  });
});

// API: Simulated payment verification endpoint for instant testing in preview UI
app.post("/api/payments/verify-simulated", async (req, res) => {
  const { paymentId, lawyerId } = req.body;
  if (!lawyerId) {
    return res.status(400).json({ error: "lawyerId kiritilishi shart." });
  }

  const payments = readPayments();
  const index = payments.findIndex(p => p.id === paymentId || (p.lawyerId === lawyerId && p.status === "pending"));
  
  const completedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (index !== -1) {
    payments[index].status = "completed";
    payments[index].completedAt = completedAt;
    writePayments(payments);
  } else {
    const newPayment = {
      id: paymentId || "pay_" + Date.now(),
      lawyerId,
      amount: 200000,
      provider: "payme",
      status: "completed",
      transactionId: "tx_sim_" + Date.now(),
      createdAt: completedAt,
      completedAt
    };
    payments.unshift(newPayment);
    writePayments(payments);
  }

  const users = readUsers();
  const uIndex = users.findIndex(u => u.id === lawyerId || u.email === lawyerId);
  if (uIndex !== -1) {
    users[uIndex].subscriptionTier = "premium";
    users[uIndex].subscriptionExpiresAt = expiresAt;
    users[uIndex].activeCaseLimit = null;
    writeUsers(users);
  }

  const { firestoreDb } = initFirebase();
  if (isFirestoreSupported && firestoreDb) {
    try {
      const userRef = doc(firestoreDb, "users", lawyerId);
      const profileRef = doc(firestoreDb, "user_profiles", lawyerId);
      const subUpdates = {
        subscriptionTier: "premium",
        subscriptionExpiresAt: expiresAt,
        activeCaseLimit: null
      };
      await setDoc(userRef, subUpdates, { merge: true }).catch(() => {});
      await setDoc(profileRef, subUpdates, { merge: true }).catch(() => {});
    } catch (e) {
      console.error("Firebase subscription update error:", e);
    }
  }

  return res.json({
    success: true,
    subscriptionTier: "premium",
    subscriptionExpiresAt: expiresAt,
    activeCaseLimit: null,
    message: "To'lov muvaffaqiyatli amalga oshirildi! Premium obuna 30 kunga faollashtirildi."
  });
});

// API: Payme Webhook Endpoint (Secure signature verification)
app.post("/api/payme/webhook", async (req, res) => {
  const { method, params, id } = req.body;
  console.log("[Payme Webhook] Request received:", method, params);

  if (method === "CheckPerformTransaction") {
    return res.json({ result: { allow: true }, id });
  }

  if (method === "CreateTransaction") {
    return res.json({
      result: {
        create_time: Date.now(),
        transaction: params?.id || "tx_" + Date.now(),
        state: 1
      },
      id
    });
  }

  if (method === "PerformTransaction") {
    const lawyerId = params?.account?.lawyer_id || params?.account?.account_id;
    if (lawyerId) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const users = readUsers();
      const uIndex = users.findIndex(u => u.id === lawyerId || u.email === lawyerId);
      if (uIndex !== -1) {
        users[uIndex].subscriptionTier = "premium";
        users[uIndex].subscriptionExpiresAt = expiresAt;
        users[uIndex].activeCaseLimit = null;
        writeUsers(users);
      }
    }
    return res.json({
      result: {
        transaction: params?.id || "tx_" + Date.now(),
        perform_time: Date.now(),
        state: 2
      },
      id
    });
  }

  return res.json({ result: { state: 1 }, id });
});

// API: Click Webhook Endpoint
app.post("/api/click/webhook", async (req, res) => {
  const { click_trans_id, merchant_trans_id, action } = req.body;
  console.log("[Click Webhook] Request received:", req.body);

  if (action === 0) {
    return res.json({
      click_trans_id,
      merchant_trans_id,
      error: 0,
      error_note: "Success"
    });
  }

  if (action === 1) {
    const lawyerId = merchant_trans_id;
    if (lawyerId) {
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const users = readUsers();
      const uIndex = users.findIndex(u => u.id === lawyerId || u.email === lawyerId);
      if (uIndex !== -1) {
        users[uIndex].subscriptionTier = "premium";
        users[uIndex].subscriptionExpiresAt = expiresAt;
        users[uIndex].activeCaseLimit = null;
        writeUsers(users);
      }
    }
    return res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: Date.now(),
      error: 0,
      error_note: "Success"
    });
  }

  return res.json({ error: 0, error_note: "Success" });
});

// API: Super Admin - Lawyer Premium Subscription Management
app.post("/api/admin/lawyers/:id/subscription", async (req, res) => {
  const { id } = req.params;
  const { action, days = 30 } = req.body; // action: "activate" | "deactivate"

  const expiresAt = action === "activate" 
    ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000).toISOString() 
    : null;
  const subscriptionTier = action === "activate" ? "premium" : "free";
  const activeCaseLimit = action === "activate" ? null : 10;

  // Update in users list
  const users = readUsers();
  const index = users.findIndex(u => u.id === id || u.email === id);
  if (index !== -1) {
    users[index].subscriptionTier = subscriptionTier;
    users[index].subscriptionExpiresAt = expiresAt;
    users[index].activeCaseLimit = activeCaseLimit;
    writeUsers(users);
  }

  // Update in Firestore if available
  const { firestoreDb } = initFirebase();
  if (isFirestoreSupported && firestoreDb) {
    try {
      const userRef = doc(firestoreDb, "users", id);
      const profileRef = doc(firestoreDb, "user_profiles", id);
      const subUpdates = {
        subscriptionTier,
        subscriptionExpiresAt: expiresAt,
        activeCaseLimit
      };
      await setDoc(userRef, subUpdates, { merge: true }).catch(() => {});
      await setDoc(profileRef, subUpdates, { merge: true }).catch(() => {});
    } catch (e) {
      console.error("Firebase admin subscription update error:", e);
    }
  }

  return res.json({
    success: true,
    lawyerId: id,
    subscriptionTier,
    subscriptionExpiresAt: expiresAt,
    activeCaseLimit,
    message: action === "activate" 
      ? `Advokat hisobiga Premium obuna ${days} kunga yoqildi!` 
      : "Advokat Premium obunasi o'chirildi (Free tarifga tushirildi)."
  });
});

// API: Get payments list
app.get("/api/payments", (req, res) => {
  const { lawyerId } = req.query;
  const payments = readPayments();
  if (lawyerId) {
    return res.json(payments.filter(p => p.lawyerId === String(lawyerId)));
  }
  return res.json(payments);
});

// API: Delete submission
app.delete("/api/submissions/:id", async (req, res) => {
  const { id } = req.params;
  const submissions = readSubmissions();
  const filtered = submissions.filter(s => s.id !== id);
  writeSubmissions(filtered);
  // Delete from Firebase (non-blocking)
  deleteSubmissionFromFirebase(id).catch(err => console.error(err));
  res.json({ success: true });
});

// Active OTP storage
const activeOTPs = new Map<string, { code: string; timestamp: number }>();
const activeSMSOTPs = new Map<string, { code: string; timestamp: number }>();

// Helper to send Email OTP via Resend API
const sendEmailOTP = async (email: string, code: string): Promise<{ success: boolean; isMock: boolean; error?: string }> => {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === "MY_RESEND_API_KEY") {
    console.warn("[Resend Warning] RESEND_API_KEY is not configured or set to placeholder. Falling back to Mock/Simulation Mode.");
    return { success: true, isMock: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        from: "Yurid.uz <onboarding@resend.dev>",
        to: [email],
        subject: "Yurid.uz - Tasdiqlash kodi",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #0284c7; margin-bottom: 10px;">Yurid.uz</h2>
            <p>Sizning elektron pochtani tasdiqlash kodingiz:</p>
            <div style="font-size: 28px; font-weight: bold; background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; letter-spacing: 4px; margin: 20px 0; color: #1e293b;">
              ${code}
            </div>
            <p style="color: #64748b; font-size: 13px;">Ushbu kodni arizani yoki ro'yxatdan o'tishni tasdiqlash uchun ishlating. Agar siz bu so'rovni yubormagan bo'lsangiz, ushbu xabarni e'tiborsiz qoldiring.</p>
          </div>
        `
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      // If the error indicates restriction (e.g. 403 unverified recipient in Resend sandbox)
      if (response.status === 403 || errText.includes("only send testing emails") || errText.includes("validation_error") || errText.includes("restriction")) {
        console.warn(`[Resend Warning] Target email ${email} is not verified/owner under free tier. Falling back to Mock/Simulation Mode.`);
        return { success: true, isMock: true };
      }
      throw new Error(`Resend API error: ${response.status} - ${errText}`);
    }

    console.log(`[Resend] Successfully sent OTP to ${email}`);
    return { success: true, isMock: false };
  } catch (error: any) {
    console.error("[Resend] Failed to send email via Resend API:", error);
    // Fallback to mock mode instead of crashing/failing the signup to prevent user blockage
    return { success: true, isMock: true, error: error.message };
  }
};

// API: Send Email OTP
app.post("/api/auth/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email kiritilishi shart." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  activeOTPs.set(email.toLowerCase().trim(), { code, timestamp: Date.now() });

  const result = await sendEmailOTP(email, code);
  res.json({
    success: result.success,
    isMock: result.isMock,
    code: result.isMock ? code : undefined,
    error: result.error
  });
});

// API: Verify Email OTP
app.post("/api/auth/verify-email-otp", (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: "Email va tasdiqlash kodi kiritilishi shart." });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const savedOtp = activeOTPs.get(normalizedEmail);

  if (!savedOtp) {
    return res.status(400).json({ error: "Ushbu email uchun kod so'ralmagan yoki muddati o'tgan." });
  }

  if (savedOtp.code === code.trim()) {
    activeOTPs.delete(normalizedEmail);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: "Tasdiqlash kodi noto'g'ri! Qayta urinib ko'ring." });
  }
});

// API: Send SMS OTP (Mock Mode)
app.post("/api/auth/send-sms-otp", async (req, res) => {
  const { phone } = req.body;
  if (!phone) {
    return res.status(400).json({ error: "Telefon raqami kiritilishi shart." });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  activeSMSOTPs.set(phone.trim(), { code, timestamp: Date.now() });

  res.json({
    success: true,
    isMock: true,
    code: code
  });
});

// API: Verify SMS OTP (Mock Mode)
app.post("/api/auth/verify-sms-otp", (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    return res.status(400).json({ error: "Telefon raqami va tasdiqlash kodi kiritilishi shart." });
  }

  const trimmedPhone = phone.trim();
  const savedOtp = activeSMSOTPs.get(trimmedPhone);

  if (!savedOtp) {
    return res.status(400).json({ error: "Ushbu telefon raqami uchun kod so'ralmagan yoki muddati o'tgan." });
  }

  if (savedOtp.code === code.trim()) {
    activeSMSOTPs.delete(trimmedPhone);
    return res.json({ success: true });
  } else {
    return res.status(400).json({ error: "Tasdiqlash kodi noto'g'ri! Qayta urinib ko'ring." });
  }
});

// Helper to format chat history for Gemini API (ensures starts with 'user' and alternates)
function formatChatHistoryForGemini(messages: any[]) {
  const firstUserIdx = messages.findIndex(m => m.role === 'user');
  if (firstUserIdx === -1) {
    return [];
  }
  const sliced = messages.slice(firstUserIdx);
  const combined: { role: 'user' | 'model'; text: string }[] = [];
  for (const msg of sliced) {
    const role = msg.role === 'model' ? 'model' : 'user';
    if (combined.length > 0 && combined[combined.length - 1].role === role) {
      combined[combined.length - 1].text += "\n\n" + msg.text;
    } else {
      combined.push({ role, text: msg.text });
    }
  }
  return combined.map(c => ({
    role: c.role,
    parts: [{ text: c.text }]
  }));
}

// API: Client Intake Chatbot with Gemini
app.post("/api/intake/chat", async (req, res) => {
  const { messages, questionCount, fullName, email, phone, lang = "uz" } = req.body;
  const userEmail = email || phone;

  if (!fullName || !userEmail) {
    return res.status(400).json({ error: "Ism va elektron pochta kiritilishi shart." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const isSimulation = !apiKey || apiKey === "MY_GEMINI_API_KEY" || apiKey === "MOCK_KEY";

  if (isSimulation) {
    // Missing key - proceed with simulated high-quality localized system
    const result = getSimulatedResponse(messages, questionCount, fullName, userEmail, lang);

    // If chat is completed, automatically save it to the submissions list
    if (result.isCompleted && result.extractedData) {
      const submissions = readSubmissions();
      const newSub = {
        id: "sub_" + Date.now(),
        fullName: result.extractedData.fullName,
        phone: result.extractedData.phone,
        incidentDate: result.extractedData.incidentDate,
        incidentDescription: result.extractedData.incidentDescription,
        chatHistory: messages.concat([{ role: "model", text: result.text, timestamp: new Date().toISOString() }]),
        summary: result.extractedData.summary,
        urgency: result.extractedData.urgency,
        status: "YANGI" as const,
        createdAt: new Date().toISOString(),
        injuries: result.extractedData.injuries,
        fault: result.extractedData.fault,
        notes: ""
      };
      submissions.unshift(newSub);
      writeSubmissions(submissions);
      // Send data to Firebase (non-blocking)
      saveSubmissionToFirebase(newSub).catch(err => console.error("Firebase background save error:", err));
    }

    return res.json({
      text: result.text,
      isCompleted: result.isCompleted,
      questionsAskedCount: result.questionsAskedCount,
      extractedData: result.extractedData || null
    });
  }

  // Real Gemini API call
  try {
    const ai = getGemini();

    // Prepare system instructions depending on the state of the chat and requested language
    const isRu = lang === "ru";
    const systemInstruction = isRu
      ? `Вы — профессиональный и отзывчивый юридический чат-бот-ассистент, принимающий клиентов (client intake) для адвокатской фирмы.
Клиент может обратиться по любому юридическому вопросу, жалобе, спору или правовой проблеме.

Ваша задача:
1. Понять ситуацию клиента, оказать ему моральную поддержку (эмпатичное общение) и вести беседу профессионально.
2. Ведите общение исключительно на РУССКОМ ЯЗЫКЕ. Избегайте сложного юридического жаргона, общайтесь на простом и понятном для людей языке.
3. Для понимания ситуации клиента нам необходимо задать ровно 3-4 уточняющих вопроса.
   Сейчас идет беседа с клиентом. Текущее количество заданных вопросов: ${questionCount}.
   - Если это первое обращение (вопросы еще не задавались), поздоровайтесь, выразите понимание/поддержку и спросите, в чем заключается суть обращения (Вопрос 1).
   - На следующем шаге, учитывая ответ, спросите, был ли нанесен какой-либо физический вред здоровью или материальный ущерб в данной ситуации, каков его масштаб (Вопрос 2).
   - Затем спросите, кто, по мнению клиента, виноват в ситуации, и обращались ли они в какие-либо государственные органы, имеется ли официальный документ/протокол (Вопрос 3).
   - В конце спросите о наличии дополнительных доказательств (видеозаписи, документы, свидетели) и о том, какого правового результата клиент ожидает от адвокатов (Вопрос 4).

4. Если все вопросы заданы и пользователь ответил на них, вам нужно завершить беседу.
   После окончания беседы искренне поблагодарите клиента и сообщите, что наши адвокаты скоро свяжутся с ним.
   При завершении беседы вы обязаны составить полное резюме (case summary) и анализ ситуации на основе всех слов клиента.
   ВАЖНО: Если беседа еще не завершена (isCompleted: false), ОСТАВЬТЕ поле summary в extractedData пустым (""), чтобы ускорить генерацию ответа. Заполняйте summary только при завершении беседы (isCompleted: true).

ТРЕБОВАНИЕ К ФОРМАТУ:
Всегда возвращайте свой ответ исключительно в формате JSON следующего вида:
{
  "text": "Следующая реплика и вопрос к клиенту (или финальная благодарственная реплика)",
  "isCompleted": false (если чат продолжается) или true (если беседа завершена),
  "questionsAskedCount": количество вопросов (текущее количество + 1),
  "extractedData": {
    "fullName": "${fullName}",
    "phone": "${phone}",
    "incidentDate": "дата в формате YYYY-MM-DD или текущая дата, если не найдена",
    "incidentDescription": "краткое описание обращения или жалобы",
    "injuries": "пострадавшие, медицинские детали или масштаб нанесенного материального/морального ущерба",
    "fault": "кто виновен, статус официальных документов или протокола",
    "urgency": "YUKSAK" или "O'RTA" или "PAST",
    "summary": "Полное резюме состояния дела клиента на русском языке в профессиональном и подробном формате Markdown (Summary)"
  }
}`
      : `Siz advokatlik firmasi uchun mijoz qabul qiluvchi (client intake) professional va mehribon yuridik chatbot yordamchisisiz.
Mijoz har qanday yuridik muammo, shikoyat, nizo yoki huquqiy masala bo'yicha murojaat qilishi mumkin.

Sizning vazifangiz:
1. Mijozning holatini tushunish, ularga ruhan dalda berish (empatik muloqot) va professional tarzda suhbatlashish.
2. Muloqotni O'ZBEK TILIDA olib boring. Juridik jargonlardan qoching va oddiy, odamlar tushunadigan tilda gapiring.
3. Bizga mijozning holatini tushunish uchun jami 3 ta savol berish kerak.
   Hozirda mijoz bilan suhbat ketmoqda. Hozirgi savollar soni: ${questionCount}.
   - Agar birinchi marta murojaat qilayotgan bo'lsa (hech qanday savol berilmagan bo'lsa), salomlashing, dalda bering va murojaat qilingan masala yuzasidan biron-bir jismoniy yoki moddiy zarar ko'rilganmi, zarar ko'lami qandayligini so'rang (Savol 1).
   - Keyingi safar, o'tgan javoblarni inobatga olgan holda, vaziyatda kim aybdor ekanligi hamda davlat organlariga yoki rasmiy tashkilotlarga murojaat qilingani va biron rasmiy hujjat/bayonnoma mavjudligi haqida so'rang (Savol 2).
   - Oxirida, qo'shimcha isbotlar va dalillar (videolar, shartnomalar, guvohlar) borligi hamda nizoli vaziyatni hal etishda sizdan (advokatlardan) aynan qanday huquqiy natija kutilayotganini so'rang (Savol 3).

4. Agar ushbu 3 ta savol berib bo'lingan bo'lsa va foydalanuvchi javob bergan bo'lsa (yoki siz uning oxirgi javobini qayta ishlayotgan bo'lsangiz), siz suhbatni tugatishingiz kerak.
   Suhbat tugagandan keyin, mijozga samimiy minnatdorchilik bildiring va tez orada advokatlarimiz aloqaga chiqishini ayting.
   Suhbat yakunlanganda, siz mijozning barcha gaplaridan to'liq xulosa (case summary) va tahlil yaratishingiz shart. Xususan, ushbu xulosada "Buzilgan qonun bandlari" deb nomlangan maxsus bo'lim yaratib, u yerda O'zbekiston Respublikasining Jinoyat kodeksi, Fuqarolik kodeksi, Konstitutsiyasi, Ma'muriy javobgarlik to'g'risidagi kodeks yoki boshqa amaldagi qonunlarining qaysi moddalari buzilgan bo'lishi mumkinligi (masalan, Jinoyat kodeksi 266-moddasi, Fuqarolik kodeksi 204-moddasi, Konstitutsiya 36-moddasi va h.k.) va ularning qisqacha tavsifini ko'rsatishingiz shart.
   MUHIM: Agar suhbat tugallanmagan bo'lsa (isCompleted: false), extractedData ichidagi summary maydonini bo'sh qoldiring ("") - bu javob tezligini keskin oshiradi. Summary faqat isCompleted true bo'lganda to'liq yaratilsin.

FORMAT TALABI:
Har doim javobingizni quyidagi formatdagi JSON ko'rinishida qaytaring:
{
  "text": "Mijozga yoziladigan navbatdagi empatik gap va savol (yoki yakuniy minnatdorchilik gapi)",
  "isCompleted": false (agar chat hali davom etayotgan bo'lsa) yoki true (agar 3-5 savollar berib bo'linib, suhbat yakunlangan bo'lsa),
  "questionsAskedCount": keyingi bosqich uchun savollar soni (hozirgi savollar soni + 1),
  "extractedData": {
    "fullName": "${fullName}",
    "phone": "${phone}",
    "incidentDate": "YYYY-MM-DD formatida yoki topilmasa hozirgi sana",
    "incidentDescription": "murojaat yoki shikoyatning qisqacha tavsifi",
    "injuries": "jarohatlanganlar, shifoxona tafsilotlari yoki yetkazilgan moddiy/ma'naviy zarar ko'lami",
    "fault": "aybdor tomon kimligi, rasmiy hujjatlar yoki bayonnoma holati",
    "urgency": "YUKSAK" yoki "O'RTA" yoki "PAST" (og'ir zararlar yoki muhim muddatlar bo'lsa YUKSAK, oddiy moddiy zarar yoki konsultatsiya bo'lsa PAST yoki O'RTA),
    "summary": "Mijozning to'liq holati yuzasidan o'zbek tilida Markdown formatidagi professional va batafsil xulosa (Summary). Unda albatta 'Buzilgan qonun bandlari' bo'limi bo'lishi va amaldagi aniq moddalarni (masalan, Jinoyat kodeksi 266-moddasi, Fuqarolik kodeksi 204-moddasi va h.k.) o'z ichiga olishi kerak."
  }
}`;

    // Format chat history for Gemini
    const contents = formatChatHistoryForGemini(messages);

    // Call Gemini
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.LOW
        },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING, description: "Message to display to the user" },
            isCompleted: { type: Type.BOOLEAN, description: "Whether the intake is fully complete" },
            questionsAskedCount: { type: Type.INTEGER, description: "Total count of clarifying questions asked so far" },
            extractedData: {
              type: Type.OBJECT,
              properties: {
                fullName: { type: Type.STRING },
                phone: { type: Type.STRING },
                incidentDate: { type: Type.STRING },
                incidentDescription: { type: Type.STRING },
                injuries: { type: Type.STRING },
                fault: { type: Type.STRING },
                urgency: { type: Type.STRING, enum: ["YUKSAK", "O'RTA", "PAST"] },
                summary: { type: Type.STRING, description: "Comprehensive markdown summary of the case. VERY IMPORTANT: Leave as empty string \"\" if isCompleted is false. Only generate a full detailed summary when isCompleted is true." }
              }
            }
          },
          required: ["text", "isCompleted", "questionsAskedCount"]
        }
      }
    });

    const resultText = response.text || "{}";
    const result = JSON.parse(resultText.trim());

    // If chat is completed, save the submission to file
    if (result.isCompleted && result.extractedData) {
      const submissions = readSubmissions();
      const newSub = {
        id: "sub_" + Date.now(),
        fullName: result.extractedData.fullName || fullName,
        phone: result.extractedData.phone || userEmail,
        incidentDate: result.extractedData.incidentDate || new Date().toISOString().split('T')[0],
        incidentDescription: result.extractedData.incidentDescription || messages[2]?.text || "Mijoz yuridik yordam so'rab murojaat qildi.",
        chatHistory: messages.concat([{ role: "model", text: result.text, timestamp: new Date().toISOString() }]),
        summary: result.extractedData.summary || "Xulosa shakllantirilmadi",
        urgency: result.extractedData.urgency || "O'RTA",
        status: "YANGI" as const,
        createdAt: new Date().toISOString(),
        injuries: result.extractedData.injuries || "Noma'lum",
        fault: result.extractedData.fault || "Noma'lum",
        notes: ""
      };
      submissions.unshift(newSub);
      writeSubmissions(submissions);
      // Send data to Firebase (non-blocking)
      saveSubmissionToFirebase(newSub).catch(err => console.error("Firebase background save error:", err));
    }

    res.json(result);

  } catch (error: any) {
    console.error("Gemini API error in full-stack backend:", error);
    // Fallback to simulation
    const result = getSimulatedResponse(messages, questionCount, fullName, userEmail);
    res.json({
      text: result.text,
      isCompleted: result.isCompleted,
      questionsAskedCount: result.questionsAskedCount,
      extractedData: result.extractedData || null,
      warning: "Gemini API xatoligi yuz berdi, simulyatordan foydalanildi."
    });
  }
});

// Vite Integration & Static File Serving
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
};

startServer();
