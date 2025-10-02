import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, username: string, email: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on app start
    const validateSession = async () => {
      const token = authService.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const userData = await authService.validateToken(token);

        setUser({ 
          username: userData.username, 
          email: userData.email 
        });
        // login(userData.access_token, userData.username, userData.email);

      } catch (error) {
        console.error('Error validating token:', error);
        setUser(null);

      } finally {
        setLoading(false);
      }
    };
    validateSession();
  }, []);


  const login = (token: string, username: string, email: string) => {
    const userData: User = { username, email };  // Create User object

    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};