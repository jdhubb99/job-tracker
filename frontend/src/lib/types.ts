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
