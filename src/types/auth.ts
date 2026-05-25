export type UserRole = "worker" | "customer" | "admin" | "both";
export type WorkerType = 0 | 1; // 0 = Fixed, 1 = Mobile

export interface User {
  id: string;
  phone: string;
  email?: string;
  name: string;
  username?: string;
  gender?: string;
  dob?: string;
  organization?: string;
  bio?: string;
  socialLinks?: string[];
  role: UserRole;
  roles?: UserRole[];
  workerType?: WorkerType;
  skill?: string;
  location?: string;
  photo?: string;
  otpVerified: boolean;
  lastActive: Date;
  points?: number;
  badges?: string[];
  muktiScore?: number;
  location_coords?: { lat: number; lng: number };
  isDemo?: boolean;
  employerName?: string;
  employerPhone?: string;
  employerVerified?: boolean;
  activeVerificationCode?: string;
  activeSessionId?: string;
  deviceId?: string;
  lastOtpDate?: Date;
  trustScore?: number;
  customer_type?: 0 | 1;
  isVerifiedByAdmin?: boolean;
  experienceYears?: number;
  hourlyRate?: number;
  isProfileComplete?: boolean;
  googleId?: string;
}
