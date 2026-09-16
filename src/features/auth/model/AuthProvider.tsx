import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { currentUser, login, logout, type AuthUser, type LoginInput } from '../api/auth-api';
import { AuthContext } from './auth-context';

const currentUserQueryKey = ['auth', 'current-user'] as const;

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const currentUserQuery = useQuery({
    queryKey: currentUserQueryKey,
    queryFn: currentUser,
    retry: false,
    staleTime: 60_000,
  });

  async function signIn(input: LoginInput): Promise<AuthUser> {
    const response = await login(input);
    queryClient.setQueryData(currentUserQueryKey, response.user);
    return response.user;
  }

  async function signOut(): Promise<void> {
    await logout();
    queryClient.setQueryData(currentUserQueryKey, null);
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== 'auth' });
  }

  return (
    <AuthContext.Provider
      value={{
        user: currentUserQuery.data ?? null,
        loading: currentUserQuery.isPending,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
