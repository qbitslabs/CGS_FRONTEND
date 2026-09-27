/* Clinic staff login, logout, and current-user calls to CGS auth.
 * Stores nothing beyond what AuthContext persists. */
import { cgs_api } from '../api/client';
import { Role, User } from '../types';

const AUTH_STORAGE_KEY = 'cgs_current_user';
const TOKEN_STORAGE_KEY = 'cgs_access_token';

export class AuthService {
  private static currentUser: User | null = null;

  static async init(): Promise<User | null> {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const saved = localStorage.getItem(AUTH_STORAGE_KEY);

    if (token) {
      try {
        const remoteUser = await cgs_api.get<User>('/auth/me');
        if (remoteUser && remoteUser.id) {
          this.currentUser = {
            ...remoteUser,
            role: (remoteUser.role?.toLowerCase() as Role) || 'doctor',
          };
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
          return this.currentUser;
        }
      } catch {
        // Token invalid or expired
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    if (saved) {
      try {
        this.currentUser = JSON.parse(saved);
        return this.currentUser;
      } catch {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }

    this.currentUser = null;
    return null;
  }

  static getCurrentUser(): User | null {
    if (!this.currentUser) {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        try {
          this.currentUser = JSON.parse(saved);
        } catch {
          this.currentUser = null;
        }
      }
    }
    return this.currentUser;
  }

  static async login(email: string, pass: string): Promise<User> {
    const res = await cgs_api.post<{ accessToken: string; user: User }>('/auth/login', {
      email: email.trim().toLowerCase(),
      password: pass,
    });
    if (!res || !res.accessToken || !res.user) {
      throw new Error('Invalid authentication response from server.');
    }

    localStorage.setItem(TOKEN_STORAGE_KEY, res.accessToken);
    this.currentUser = {
      ...res.user,
      role: (res.user.role?.toLowerCase() as Role) || 'doctor',
    };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(this.currentUser));
    return this.currentUser;
  }

  static async logout(): Promise<void> {
    try {
      await cgs_api.post('/auth/logout');
    } catch {
      // ignore network errors on logout
    } finally {
      this.currentUser = null;
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  }
}
