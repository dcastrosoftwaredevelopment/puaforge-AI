import { atom } from 'jotai';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  apiKey: string | null;
  apiKeyEnabled: boolean;
}

export const authTokenAtom = atom<string | null>(localStorage.getItem('auth_token'));
export const authUserAtom = atom<AuthUser | null>(null);
export const authLoadingAtom = atom(true);
