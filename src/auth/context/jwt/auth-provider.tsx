import { useSetState } from 'minimal-shared/hooks';
import { useMemo, useEffect, useCallback } from 'react';

import axios, { endpoints } from 'src/lib/axios';

import { AuthContext } from '../auth-context';
import { setSession, isValidToken, readStoredToken, userFromToken, clearStoredToken } from './utils';

import type { AuthState } from '../../types';

// ----------------------------------------------------------------------

type Props = {
  children: React.ReactNode;
};

function isUnauthorized(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === 'string') {
    return /token|autentic|unauthor|401/i.test(error);
  }
  if (typeof error !== 'object') return false;

  const status =
    (error as { status?: number }).status ?? (error as { statusCode?: number }).statusCode;
  if (status === 401) return true;

  const detail = (error as { detail?: unknown }).detail;
  if (typeof detail === 'string') {
    return /token|autentic|unauthor/i.test(detail);
  }

  return false;
}

export function AuthProvider({ children }: Props) {
  const { state, setState } = useSetState<AuthState>({ user: null, loading: true });

  const checkUserSession = useCallback(async () => {
    try {
      const accessToken = readStoredToken();

      if (accessToken && isValidToken(accessToken)) {
        await setSession(accessToken);

        try {
          const res = await axios.get(endpoints.auth.me);
          const { user } = res.data;
          setState({ user: { ...user, accessToken }, loading: false });
        } catch (error) {
          // Rede / cold start da API: mantém sessão se o JWT ainda for válido.
          if (isUnauthorized(error)) {
            await setSession(null);
            setState({ user: null, loading: false });
            return;
          }

          console.warn('Auth /me unavailable, keeping JWT session', error);
          const fallback = userFromToken(accessToken);
          setState({ user: fallback, loading: false });
        }
      } else {
        if (accessToken) {
          clearStoredToken();
        }
        setState({ user: null, loading: false });
      }
    } catch (error) {
      console.error(error);
      setState({ user: null, loading: false });
    }
  }, [setState]);

  useEffect(() => {
    checkUserSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------------------------------------------------

  const checkAuthenticated = state.user ? 'authenticated' : 'unauthenticated';

  const status = state.loading ? 'loading' : checkAuthenticated;

  const memoizedValue = useMemo(
    () => ({
      user: state.user ? { ...state.user, role: state.user?.role ?? 'admin' } : null,
      checkUserSession,
      loading: status === 'loading',
      authenticated: status === 'authenticated',
      unauthenticated: status === 'unauthenticated',
    }),
    [checkUserSession, state.user, status]
  );

  return <AuthContext.Provider value={memoizedValue}>{children}</AuthContext.Provider>;
}
