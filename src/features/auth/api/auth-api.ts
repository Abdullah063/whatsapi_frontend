import { ApiError, apiRequest, jsonBody } from 'src/shared/api/http';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string | null;
  role: 'USER' | 'ADMIN';
  status: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: AuthUser;
  sessionExpiresAt: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface RegistrationResponse {
  userId: string;
  email: string;
  status: string;
}

export async function currentUser(): Promise<AuthUser | null> {
  try {
    return await apiRequest<AuthUser>('/api/v1/auth/me');
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
}

export function login(input: LoginInput): Promise<LoginResponse> {
  return apiRequest('/api/v1/auth/login', { method: 'POST', body: jsonBody(input) });
}

export function logout(): Promise<void> {
  return apiRequest('/api/v1/auth/logout', { method: 'POST' });
}

export function register(input: RegisterInput): Promise<RegistrationResponse> {
  return apiRequest('/api/v1/auth/register', { method: 'POST', body: jsonBody(input) });
}

export function verifyEmail(userId: string, code: string): Promise<void> {
  return apiRequest('/api/v1/auth/email/verify', {
    method: 'POST',
    body: jsonBody({ userId, code }),
  });
}

export function resendVerification(userId: string): Promise<void> {
  return apiRequest('/api/v1/auth/email/resend', {
    method: 'POST',
    body: jsonBody({ userId }),
  });
}

export function requestPasswordReset(email: string): Promise<void> {
  return apiRequest('/api/v1/auth/password/forgot', {
    method: 'POST',
    body: jsonBody({ email }),
  });
}

export function resetPassword(email: string, code: string, newPassword: string): Promise<void> {
  return apiRequest('/api/v1/auth/password/reset', {
    method: 'POST',
    body: jsonBody({ email, code, newPassword }),
  });
}
