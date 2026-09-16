import { createContext, useContext } from 'react';
import type { AuthUser, LoginInput } from '../api/auth-api';

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (input: LoginInput) => Promise<AuthUser>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
