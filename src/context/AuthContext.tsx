/* Holds the signed-in clinic user, token, and permission helpers.
 * Login/logout persist the session; pages read role via can() / hasRole(). */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthService } from '../services/auth.service';
import { can as canCheck, hasRole as roleCheck } from '../permissions';
import { Permission, Role, User } from '../types';

interface AuthContextType {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission: Permission) => boolean;
  hasRole: (role: Role) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const u = await AuthService.init();
        setUser(u);
      } catch (err) {
        console.error('Failed to initialize auth', err);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await AuthService.login(email, pass);
      setUser(loggedUser);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const can = (permission: Permission) => {
    return canCheck(user, permission);
  };

  const hasRole = (targetRole: Role) => {
    return roleCheck(user, targetRole);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        can,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
