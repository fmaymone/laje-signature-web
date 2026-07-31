import { paths } from 'src/routes/paths';

import axios from 'src/lib/axios';

import { JWT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

let expiredTimer: ReturnType<typeof setTimeout> | null = null;

function getStorage(): Storage {
  return localStorage;
}

/** Migra token antigo de sessionStorage → localStorage (uma vez). */
export function readStoredToken(): string | null {
  const fromLocal = localStorage.getItem(JWT_STORAGE_KEY);
  if (fromLocal) return fromLocal;

  const fromSession = sessionStorage.getItem(JWT_STORAGE_KEY);
  if (fromSession) {
    localStorage.setItem(JWT_STORAGE_KEY, fromSession);
    sessionStorage.removeItem(JWT_STORAGE_KEY);
    return fromSession;
  }

  return null;
}

export function clearStoredToken() {
  localStorage.removeItem(JWT_STORAGE_KEY);
  sessionStorage.removeItem(JWT_STORAGE_KEY);
}

// ----------------------------------------------------------------------

export function jwtDecode(token: string) {
  try {
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) {
      throw new Error('Invalid token!');
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));

    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    throw error;
  }
}

/** User mínimo a partir do payload JWT (quando /me falha por rede). */
export function userFromToken(accessToken: string) {
  const decoded = jwtDecode(accessToken);
  if (!decoded) return null;

  return {
    id: String(decoded.sub ?? ''),
    email: String(decoded.email ?? ''),
    displayName: String(decoded.displayName ?? decoded.email ?? ''),
    photoURL: null as string | null,
    role: String(decoded.role ?? 'staff'),
    accessToken,
  };
}

// ----------------------------------------------------------------------

export function isValidToken(accessToken: string) {
  if (!accessToken) {
    return false;
  }

  try {
    const decoded = jwtDecode(accessToken);

    if (!decoded || !('exp' in decoded)) {
      return false;
    }

    const currentTime = Date.now() / 1000;

    return decoded.exp > currentTime;
  } catch (error) {
    console.error('Error during token validation:', error);
    return false;
  }
}

// ----------------------------------------------------------------------

export function tokenExpired(exp: number) {
  const currentTime = Date.now();
  const timeLeft = exp * 1000 - currentTime;

  if (expiredTimer) {
    clearTimeout(expiredTimer);
    expiredTimer = null;
  }

  if (timeLeft <= 0) {
    clearStoredToken();
    window.location.href = paths.auth.jwt.signIn;
    return;
  }

  expiredTimer = setTimeout(() => {
    try {
      clearStoredToken();
      window.location.href = paths.auth.jwt.signIn;
    } catch (error) {
      console.error('Error during token expiration:', error);
    }
  }, timeLeft);
}

// ----------------------------------------------------------------------

export async function setSession(accessToken: string | null) {
  try {
    if (accessToken) {
      getStorage().setItem(JWT_STORAGE_KEY, accessToken);
      sessionStorage.removeItem(JWT_STORAGE_KEY);

      axios.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

      const decodedToken = jwtDecode(accessToken);

      if (decodedToken && 'exp' in decodedToken) {
        tokenExpired(decodedToken.exp);
      } else {
        throw new Error('Invalid access token!');
      }
    } else {
      clearStoredToken();
      delete axios.defaults.headers.common.Authorization;
      if (expiredTimer) {
        clearTimeout(expiredTimer);
        expiredTimer = null;
      }
    }
  } catch (error) {
    console.error('Error during set session:', error);
    throw error;
  }
}
