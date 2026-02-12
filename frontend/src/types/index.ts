export interface Profile {
  id: string;
  role: 'TRAINER' | 'CLIENT';
  fullName: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  specializations?: string[];
  experienceYears?: number;
  certifications?: string[];
  fitnessGoals?: string[];
  avgRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
  role: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface SignUpRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'TRAINER' | 'CLIENT';
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  specializations?: string[];
  experienceYears?: number;
  certifications?: string[];
  fitnessGoals?: string[];
}

export type ProgramType = 'FAT_LOSS' | 'MUSCLE_GAIN' | 'STRENGTH_TRAINING' | 'GENERAL_FITNESS' | 'FLEXIBILITY' | 'CUSTOM';
export type ConnectionStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';
export type PlanStatus = 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
export type MealCompliance = 'ON_PLAN' | 'PARTIAL' | 'OFF_PLAN' | 'SKIPPED';
export type BookingStatus = 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type SessionType = 'IN_PERSON' | 'VIRTUAL';
export type PhotoCategory = 'FRONT' | 'BACK' | 'SIDE_LEFT' | 'SIDE_RIGHT' | 'CUSTOM';
