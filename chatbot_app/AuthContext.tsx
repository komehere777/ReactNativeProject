import React, { createContext, useState, useContext, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import CONFIG from './config';

type User = {
  id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  userToken: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserData: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${CONFIG.API_URL}/login`, { email, password });
      const { access_token, user_id, username } = response.data;
      
      await AsyncStorage.setItem('userToken', access_token);
      await AsyncStorage.setItem('userId', user_id);
      await AsyncStorage.setItem('username', username);
      
      setUserToken(access_token);
      setIsAuthenticated(true);
      setUser({ id: user_id, username, email });
      
      await fetchUserData(); // 로그인 후 사용자 데이터 즉시 가져오기
    } catch (error) {
      console.error('Login failed', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userId', 'username']);
      setUserToken(null);
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const fetchUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token available');
      }
      const response = await axios.get(`${CONFIG.API_URL}/user`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user data', error);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await logout(); // 인증 오류 시 로그아웃
      }
      throw error;
    }
  };

  const deleteAccount = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (!token) {
        throw new Error('No token available');
      }
      await axios.delete(`${CONFIG.API_URL}/delete_account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await logout();
    } catch (error) {
      console.error('Failed to delete account', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userToken, user, login, logout, fetchUserData, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};