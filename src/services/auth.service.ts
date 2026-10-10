/* Clinic staff login, logout, and current-user calls to CGS auth.
 * The access token stays in memory. The refresh token is an httpOnly cookie. */
import { cgs_api, setAccessToken } from '../api/client';
import { Role, User } from '../types';

export class AuthService {
  private static currentUser: User | null = null;

  static async init(): Promise<User | null> {
    localStorage.removeItem('cgs_access_token');
    try {
      const refreshed = await cgs_api.post<{ accessToken: string }>('/auth/refresh');
      if (!refreshed?.accessToken) {
        this.currentUser = null;
        return null;
      }
      setAccessToken(refreshed.accessToken);
      const remoteUser = await cgs_api.get<User>('/auth/me');
      if (!remoteUser?.id) {
        this.currentUser = null;
        return null;
      }
      this.currentUser = {
        ...remoteUser,
        role: (remoteUser.role?.toLowerCase() as Role) || 'doctor',
      };
      return this.currentUser;
    } catch {
      setAccessToken(null);
      this.currentUser = null;
      localStorage.removeItem('cgs_current_user');
      return null;
    }
  }

  static getCurrentUser(): User | null {
    return this.currentUser;
  }

  static async login(email: string, pass: string): Promise<User> {
    setAccessToken(null);
    const res = await cgs_api.post<{ accessToken: string; user: User }>('/auth/login', {
      email: email.trim().toLowerCase(),
      password: pass,
    });
    if (!res || !res.accessToken || !res.user) {
      throw new Error('Invalid authentication response from server.');
    }

    setAccessToken(res.accessToken);
    this.currentUser = {
      ...res.user,
      role: (res.user.role?.toLowerCase() as Role) || 'doctor',
    };
    return this.currentUser;
  }

  static async logout(): Promise<void> {
    try {
      await cgs_api.post('/auth/logout');
    } catch {
      // The cookie is cleared server-side when the call succeeds.
    } finally {
      this.currentUser = null;
      setAccessToken(null);
      localStorage.removeItem('cgs_access_token');
      localStorage.removeItem('cgs_current_user');
    }
  }

  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await cgs_api.post('/auth/change-password', { currentPassword, newPassword });
    this.currentUser = null;
    setAccessToken(null);
    localStorage.removeItem('cgs_access_token');
    localStorage.removeItem('cgs_current_user');
  }
}
