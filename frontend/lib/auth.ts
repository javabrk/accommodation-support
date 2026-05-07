import Cookies from 'js-cookie';
import { User } from '@/types';

export const setTokens = (accessToken: string, refreshToken: string) => {
  Cookies.set('accessToken', accessToken, { expires: 1 / 96, sameSite: 'strict' });
  Cookies.set('refreshToken', refreshToken, { expires: 7, sameSite: 'strict' });
};

export const clearTokens = () => {
  Cookies.remove('accessToken');
  Cookies.remove('refreshToken');
};

export const getAccessToken = () => Cookies.get('accessToken');
export const getRefreshToken = () => Cookies.get('refreshToken');

export const setUser = (user: User) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
};

export const clearUser = () => {
  if (typeof window !== 'undefined') localStorage.removeItem('user');
};

export const isAuthenticated = () => !!getAccessToken();
