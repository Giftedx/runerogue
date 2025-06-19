import React, { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import { User, AuthContextType, LoginCredentials, RegisterData } from '@/types';
import { apiClient } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (credentials: LoginCredentials) => {
    try {
      const { user, tokens } = await apiClient.login(credentials);

      // Store tokens in cookies
      Cookies.set('accessToken', tokens.accessToken, {
        expires: 7, // 7 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set('refreshToken', tokens.refreshToken, {
        expires: 30, // 30 days
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    if (data.password !== data.confirmPassword) {
      throw new Error('Passwords do not match');
    }

    try {
      const { user, tokens } = await apiClient.register(data);

      // Store tokens in cookies
      Cookies.set('accessToken', tokens.accessToken, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set('refreshToken', tokens.refreshToken, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    Cookies.remove('accessToken');
    Cookies.remove('refreshToken');
    setUser(null);
  };

  const validateSession = async () => {
    const token = Cookies.get('accessToken');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const { user } = await apiClient.validateSession();
      setUser(user);
    } catch (error) {
      console.error('Session validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    validateSession();
  }, []);

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
