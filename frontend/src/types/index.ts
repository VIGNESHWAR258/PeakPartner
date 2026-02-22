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

export interface ConnectionResponse {
  id: string;
  client: Profile;
  trainer: Profile;
  status: ConnectionStatus;
  program: ProgramType;
  notes?: string;
  connectedAt?: string;
  createdAt: string;
}

export interface ConnectionRequest {
  trainerId: string;
  program: ProgramType;
  notes?: string;
}

// ==================== ASSESSMENTS ====================

export type QuestionType = 'TEXT' | 'SINGLE_CHOICE' | 'MULTI_CHOICE';

export interface AssessmentQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
}

export interface AssessmentAnswer {
  value: string | string[];
}

export interface AssessmentResponse {
  id: string;
  connectionId: string;
  trainer: Profile;
  client: Profile;
  title: string;
  questions: string; // JSON string of AssessmentQuestion[]
  answers?: string;  // JSON string of AssessmentAnswer[]
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED';
  trainerNotes?: string;
  createdAt: string;
  updatedAt?: string;
}

// ==================== SESSION BOOKINGS ====================

export interface SessionResponse {
  id: string;
  connectionId: string;
  clientId: string;
  clientName: string;
  trainerId: string;
  trainerName: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  sessionType: 'IN_PERSON' | 'VIRTUAL';
  status: 'BOOKED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  notes?: string;
  cancelReason?: string;
  cancelledByName?: string;
  createdAt: string;
}

// ==================== RESCHEDULE ====================

export type RescheduleStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED';

export interface RescheduleResponse {
  id: string;
  sessionId: string;
  requestedById: string;
  requestedByName: string;
  proposedDate: string;
  proposedStartTime: string;
  proposedEndTime: string;
  reason?: string;
  status: RescheduleStatus;
  respondedAt?: string;
  createdAt: string;
}

// ==================== WORKOUT PLANS ====================

export type PlanDuration = 'WEEKLY' | 'MONTHLY' | 'CUSTOM';

export interface PlanExercise {
  id?: string;
  exerciseName: string;
  sets?: number;
  reps?: string;
  weightSuggestion?: string;
  restSeconds?: number;
  notes?: string;
  sortOrder?: number;
}

export interface PlanDay {
  id?: string;
  dayNumber: number;
  dayName?: string;
  focusArea?: string;
  notes?: string;
  exercises: PlanExercise[];
}

export interface WorkoutPlanResponse {
  id: string;
  connectionId: string;
  trainerId: string;
  clientId: string;
  trainerName: string;
  clientName: string;
  title: string;
  description?: string;
  program: string;
  duration: string;
  status: PlanStatus;
  startDate: string;
  endDate: string;
  createdAt: string;
  days: PlanDay[];
}

// ==================== DIET PLANS ====================

export interface MealItem {
  id?: string;
  foodName: string;
  quantity?: string;
  calories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  alternatives?: string;
}

export interface Meal {
  id?: string;
  mealName: string;
  mealTime?: string;
  sortOrder?: number;
  items: MealItem[];
}

export interface DietPlanResponse {
  id: string;
  connectionId: string;
  trainerId: string;
  clientId: string;
  trainerName: string;
  clientName: string;
  title: string;
  description?: string;
  status: string;
  startDate: string;
  endDate: string;
  dailyCalorieTarget?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  notes?: string;
  createdAt: string;
  meals: Meal[];
}

// ==================== EXERCISE LOGS ====================

export interface ExerciseLogResponse {
  id: string;
  connectionId: string;
  loggedById: string;
  loggedByName: string;
  planExerciseId?: string;
  exerciseName: string;
  logDate: string;
  setsCompleted?: number;
  repsCompleted?: number;
  weightUsed?: number;
  weightUnit?: string;
  durationSeconds?: number;
  isPr?: boolean;
  notes?: string;
  createdAt: string;
}

// ==================== MEAL LOGS ====================

export interface MealLogResponse {
  id: string;
  connectionId: string;
  clientId: string;
  clientName: string;
  dietMealId?: string;
  logDate: string;
  mealName: string;
  compliance: MealCompliance;
  photoUrl?: string;
  itemsConsumed?: string;
  estimatedCalories?: number;
  proteinGrams?: number;
  carbsGrams?: number;
  fatGrams?: number;
  notes?: string;
  trainerVerified?: boolean;
  trainerVerifiedAt?: string;
  createdAt: string;
}
