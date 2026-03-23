// Matches UserResponse.java
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  updatedAt: string;
}

// Matches AuthTokenResponse.java
export interface AuthTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  user: User;
}

// Matches ApiErrorResponse (nested record in GlobalExceptionHandler.java)
export interface ApiErrorBody {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors: Record<string, string> | null;
}

// Request types matching UserLoginRequest.java
export interface LoginRequest {
  email: string;
  password: string;
}

// Request types matching UserRegistrationRequest.java
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

// Matches JobApplicationStatus.java enum
export const JOB_APPLICATION_STATUSES = [
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
  'ACCEPTED',
] as const;

export type JobApplicationStatus = (typeof JOB_APPLICATION_STATUSES)[number];

// Matches JobApplicationCreateRequest.java
export interface JobApplicationCreateData {
  company: string;
  jobTitle: string;
  dateApplied: string;
  status?: JobApplicationStatus;
  jobPostingUrl?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
}

// Matches JobApplicationUpdateRequest.java
export interface JobApplicationUpdateData {
  company?: string;
  jobTitle?: string;
  dateApplied?: string;
  status?: JobApplicationStatus;
  jobPostingUrl?: string | null;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  description?: string | null;
}

// Matches JobApplicationResponse.java
export interface JobApplicationResponse {
  id: string;
  userId: string;
  company: string;
  jobTitle: string;
  status: JobApplicationStatus;
  dateApplied: string;
  jobPostingUrl: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
