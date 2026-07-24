export interface ChatMessage {
  role: 'user' | 'model' | 'system';
  text: string;
  timestamp: string;
}

export type SubmissionStatus = 'YANGI' | 'KO\'RIB_CHIQILMOQDA' | 'QABUL_QILINGAN' | 'RAD_ETILGAN' | 'YAKUNLANDI' | 'TUGALLANGAN' | 'yakunlandi';
export type UrgencyLevel = 'YUKSAK' | 'O\'RTA' | 'PAST';

export interface TimelineItem {
  status: string;
  timestamp: string;
  updatedBy: string;
  comment: string;
}

export interface Submission {
  id: string;
  fullName: string;
  phone: string;
  incidentDate: string;
  incidentDescription: string;
  chatHistory: ChatMessage[];
  summary: string; // Markdown or detailed text
  urgency: UrgencyLevel;
  status: SubmissionStatus;
  createdAt: string;
  injuries: string;
  fault: string;
  notes?: string;
  assignedLawyer?: string;
  deadline?: string;
  timeline?: TimelineItem[];
  email?: string;
  region?: string;
  category?: string;
  categoryOther?: string;
  problemDescription?: string;
  isRecurring?: boolean;
  previousContact?: string;
  attachments?: string[];
  preferredContact?: string;
  assignedLawyerId?: string | null;
  userId?: string;
  applicationNumber?: string;
}

export interface IntakeSession {
  sessionId: string;
  fullName: string;
  phone: string;
  messages: ChatMessage[];
  questionsAskedCount: number;
  isCompleted: boolean;
  extractedData: {
    fullName?: string;
    phone?: string;
    incidentDate?: string;
    incidentDescription?: string;
    injuries?: string;
    fault?: string;
    [key: string]: any;
  };
}

export interface ClientReview {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface LawyerDetails {
  id: string;
  name: string;
  specialization: string;
  experience: number; // in years
  phone: string;
  email: string;
  price: number; // hourly rate in USD
  address: string;
  rating: number; // overall calculated rating
  clientRating: number; // average client rating (60% weight)
  systemRating: number; // calculated system rating (40% weight)
  casesAccepted: number;
  responseTime: number; // in minutes
  clientCount: number;
  reviews: ClientReview[];
  password?: string;
  isBlocked?: boolean;
  role?: string;
  isAvailable?: boolean;
  activeCases?: number;
  subscriptionTier?: 'free' | 'premium';
  subscriptionExpiresAt?: string | null;
  activeCaseLimit?: number | null;
}

export interface RegisteredUser {
  id: string;
  ism: string;
  telefon: string;
  email: string;
  manzil: string;
  parol: string;
  rasm: string | null;
  sana?: string;
  role?: string;
  subscriptionTier?: 'free' | 'premium';
  subscriptionExpiresAt?: string | null;
  activeCaseLimit?: number | null;
}

export interface Payment {
  id: string;
  lawyerId: string;
  amount: number;
  provider: 'payme' | 'click';
  status: 'pending' | 'completed' | 'failed';
  transactionId: string;
  createdAt: string;
  completedAt?: string | null;
}

export type PoliceReportType = 'Jinoyat' | 'Ma\'muriy' | 'Boshqa';
export type PoliceReportStatus = 'Yuborilgan' | 'Ko\'rib chiqilmoqda' | 'Tergovda' | 'Tugallangan' | 'Rad etilgan';

export interface WitnessDetails {
  name: string;
  phone: string;
}

export interface PoliceReportAIAnalysis {
  brokenLaw: string;
  liability: string;
  recommendedAuthority: string;
  fullAnalysisText: string;
}

export interface PoliceReport {
  id: string;
  fullName: string;
  phone: string;
  reportType: PoliceReportType;
  dateTime: string;
  address: string;
  suspectInfo?: string;
  description: string;
  witnesses?: WitnessDetails[];
  attachmentUrl?: string;
  status: PoliceReportStatus;
  organization: 'Ichki ishlar' | 'Prokuratura';
  createdAt: string;
  smsVerified: boolean;
  aiAnalysis?: PoliceReportAIAnalysis;
}

export interface NewsItem {
  id: number;
  sarlavha: string;
  kategoriya: "Qonun o'zgarishlari" | "Sud amaliyoti" | "Firma yangiliklari" | "Umumiy";
  matn: string; // HTML matn
  rasm: string; // rasm URL manzili
  muallif: string;
  sana: string; // YYYY-MM-DD
  muhim: boolean;
}

export interface LawyerChatMessage {
  id: string;
  sender: 'client' | 'lawyer';
  text: string;
  timestamp: string;
  read: boolean;
}

export interface ChatRoom {
  clientId: string;
  clientName: string;
  lawyerId: string;
  lawyerName: string;
  messages: LawyerChatMessage[];
  lastUpdated: string;
}
