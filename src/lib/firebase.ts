import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getAuth, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  User
} from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import appletConfig from "../../firebase-applet-config.json";

// Re-export modular functions as requested by the user
export { initializeApp, getApps, getApp };
export { getFirestore, initializeFirestore };

// Extend global window interface for Firebase debug/testing scripts and documentation parity
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier | null;
    recaptchaWidgetId?: any;
    confirmationResult?: ConfirmationResult | null;
  }
}

// Config variables with fallback to exact new firebase-applet-config.json values
const apiKey = appletConfig.apiKey || (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyBi6mPJpc1WiYQiK7b7qGCM8pFKv3cbxNc";
const authDomain = appletConfig.authDomain || (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "celestial-chassis-7nzsc.firebaseapp.com";
const projectId = appletConfig.projectId || (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "celestial-chassis-7nzsc";
const storageBucket = appletConfig.storageBucket || (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "celestial-chassis-7nzsc.firebasestorage.app";
const messagingSenderId = appletConfig.messagingSenderId || (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "469684088171";
const appId = appletConfig.appId || (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:469684088171:web:b28e92192316303001b02e";
const measurementId = (appletConfig as any).measurementId || (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "";
const firestoreDatabaseId = (appletConfig as any).firestoreDatabaseId || (import.meta as any).env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID || "ai-studio-lawyerclientinta-568825d7-2356-4a1f-91ef-93d94cb99e92";

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
  measurementId,
  firestoreDatabaseId
};

// Initialize Firebase App
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = firebaseConfig.firestoreDatabaseId 
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, firebaseConfig.firestoreDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

// Keep track of recaptcha verifier
let recaptchaVerifier: RecaptchaVerifier | null = null;

/**
 * Format phone numbers to standard E.164 format (+998XXXXXXXXX)
 */
export const formatPhoneToE164 = (phoneStr: string): string => {
  let cleaned = phoneStr.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) {
    if (cleaned.startsWith("998")) {
      cleaned = "+" + cleaned;
    } else {
      cleaned = "+998" + cleaned;
    }
  }
  return cleaned;
};

/**
 * Creates/retrieves an invisible RecaptchaVerifier on a dynamically appended container.
 */
export const setupRecaptcha = (): RecaptchaVerifier | null => {
  if (typeof window === "undefined") return null;

  let el = document.getElementById("recaptcha-container");
  if (!el) {
    el = document.createElement("div");
    el.id = "recaptcha-container";
    el.style.position = "absolute";
    el.style.top = "0";
    el.style.left = "0";
    el.style.width = "0";
    el.style.height = "0";
    el.style.opacity = "0";
    el.style.pointerEvents = "none";
    document.body.appendChild(el);
  }

  if (recaptchaVerifier) {
    window.recaptchaVerifier = recaptchaVerifier;
    return recaptchaVerifier;
  }

  try {
    recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
      callback: (response: any) => {
        console.log("[Firebase Auth] Invisible reCAPTCHA solved successfully.");
      },
      "expired-callback": () => {
        console.log("[Firebase Auth] Invisible reCAPTCHA expired. Resetting...");
        if (recaptchaVerifier) {
          recaptchaVerifier.clear();
          recaptchaVerifier = null;
          window.recaptchaVerifier = null;
        }
      }
    });
    window.recaptchaVerifier = recaptchaVerifier;
    return recaptchaVerifier;
  } catch (err) {
    console.error("[Firebase Auth] Error setting up RecaptchaVerifier:", err);
    return null;
  }
};

/**
 * Enables or disables App Verification for testing.
 * When enabled, reCAPTCHA is bypassed, allowing manual/integration testing with fictional phone numbers.
 */
export const setAppVerificationDisabledForTesting = (disabled: boolean) => {
  try {
    auth.settings.appVerificationDisabledForTesting = disabled;
    console.log(`[Firebase Auth] appVerificationDisabledForTesting set to: ${disabled}`);
  } catch (err) {
    console.error("[Firebase Auth] Failed to set appVerificationDisabledForTesting:", err);
  }
};

/**
 * Trigger real Firebase Phone Authentication SMS
 */
export const sendSmsCode = async (phoneNumber: string): Promise<ConfirmationResult> => {
  const formattedPhone = formatPhoneToE164(phoneNumber);
  const verifier = setupRecaptcha();
  if (!verifier) {
    throw new Error("reCAPTCHA verifier initialization failed.");
  }

  try {
    console.log(`[Firebase Auth] Sending SMS verification code to: ${formattedPhone}`);
    const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, verifier);
    window.confirmationResult = confirmationResult;
    return confirmationResult;
  } catch (error: any) {
    console.error("[Firebase Auth] Error in signInWithPhoneNumber:", error);
    
    // Suggest helpful steps for the user based on typical Firebase errors
    const msg = error?.message || String(error);
    if (msg.includes("auth/operation-not-allowed")) {
      throw new Error(
        "Firebase loyihangizda telefon orqali kirish (Phone Sign-in) o'chirilgan! Iltimos, Firebase Console > Authentication > Sign-in method bo'limidan Phone provayderini faollashtiring."
      );
    } else if (msg.includes("auth/invalid-phone-number")) {
      throw new Error("Telefon raqami noto'g'ri formatda kiritilgan! Iltimos, to'g'ri telefon raqamini kiriting.");
    } else if (msg.includes("auth/captcha-check-failed") || msg.includes("recaptcha")) {
      throw new Error("reCAPTCHA tekshiruvidan o'tib bo'lmadi yoki xavfsizlik cheklovlari sababli bloklandi.");
    } else if (msg.includes("auth/too-many-requests")) {
      throw new Error("Siz juda ko'p marta SMS so'radingiz. Iltimos, birozdan keyin qayta urinib ko'ring.");
    }
    throw error;
  }
};

// Google OAuth Provider for Gmail scopes
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("https://mail.google.com/");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize Google OAuth state listener
export const initGoogleAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Start Google sign-in popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("Failed to get access token from Google Auth");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("[Google Auth] Sign in error:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const googleLogout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};
