'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface UserPreferences {
  genres: string[];
  moods: string[];
  favoriteMovies: number[];
}

export interface User {
  id: string;
  username: string;
  email?: string;
  preferences: UserPreferences;
  joinDate: string;
  isOnboarded: boolean;
}

interface UserContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (userData: Partial<User>) => void;
  logout: () => void;
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  completeOnboarding: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem('cineai-user');
        if (savedUser) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
        }
      } catch (error) {
        console.error('Error loading user from localStorage:', error);
        localStorage.removeItem('cineai-user');
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // Save user to localStorage whenever user changes
  useEffect(() => {
    if (user) {
      localStorage.setItem('cineai-user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cineai-user');
    }
  }, [user]);

  const login = async (userData: Partial<User>) => {
    const newUser: User = {
      id: userData.id || generateUserId(),
      username: userData.username || '',
      email: userData.email || '',
      preferences: userData.preferences || {
        genres: [],
        moods: [],
        favoriteMovies: []
      },
      joinDate: userData.joinDate || new Date().toISOString(),
      isOnboarded: userData.isOnboarded || false
    };

    setUser(newUser);

    // Save to Neo4j if available
    try {
      await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });
    } catch (error) {
      console.warn('Failed to save user to database:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cineai-user');
    localStorage.removeItem('cineai-watchlist');
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    if (!user) return;

    const updatedUser = {
      ...user,
      preferences: {
        ...user.preferences,
        ...newPreferences
      }
    };

    setUser(updatedUser);

    // Update in Neo4j if available
    try {
      fetch('/api/users/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          preferences: updatedUser.preferences
        }),
      });
    } catch (error) {
      console.warn('Failed to update preferences in database:', error);
    }
  };

  const completeOnboarding = () => {
    if (!user) return;

    const updatedUser = {
      ...user,
      isOnboarded: true
    };

    setUser(updatedUser);

    // Update in Neo4j
    try {
      fetch('/api/users/onboarding', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          isOnboarded: true
        }),
      });
    } catch (error) {
      console.warn('Failed to update onboarding status in database:', error);
    }
  };

  const generateUserId = (): string => {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  const value: UserContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    updatePreferences,
    completeOnboarding
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export default UserProvider;
