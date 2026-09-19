import React, { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'student' | 'industry' | 'academician' | 'institution';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  fullName?: string;
  role: UserRole;
  college?: string;
  collegeName?: string;
  degree?: string;
  targetRole?: string;
  targetCtc?: string;
  phone?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  skills?: string[];
  bio?: string;
  cgpa?: number;
  graduationYear?: number;
  readinessScore?: number;
  dsaSolved?: number;
  systemDesignScore?: number;
  mockInterviewsCompleted?: number;
  company?: string;
  department?: string;
  designation?: string;
}

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  college?: string;
  collegeName?: string;
  degree?: string;
  targetRole?: string;
  company?: string;
  department?: string;
  designation?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoggedIn: boolean;
  userRole: UserRole;
  role: UserRole;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (data: SignupData) => Promise<boolean>;
  updateUser: (userData: Partial<AuthUser>) => void;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      setToken(data.token);
      setUser(data.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'Login failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (data: SignupData): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Signup failed');
      }
      setToken(resData.token);
      setUser(resData.user);
      return true;
    } catch (err: any) {
      setError(err.message || 'Signup failed');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUser = (userData: Partial<AuthUser>) => {
    setUser((prev) => (prev ? { ...prev, ...userData } : (userData as AuthUser)));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const isLoggedIn = !!user && !!token;
  const userRole: UserRole = user?.role || 'student';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        userRole,
        role: userRole,
        loading,
        error,
        login,
        signup,
        updateUser,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
