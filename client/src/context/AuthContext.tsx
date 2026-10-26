import React, { createContext, useContext, useState, useEffect } from "react";
import { User } from "../types";
import { api } from "../services/api";
import { socketClient } from "../services/socket";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (demoUser: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { user: profile } = await api.getMe();
        setUser(profile);
        connectSockets(profile);
      } catch (err) {
        console.warn("Session restore failed:", err);
        api.setToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const connectSockets = (u: User) => {
    socketClient.connect();
    if (u.role === "ADMIN") {
      socketClient.joinAdmin();
    } else {
      socketClient.joinAuthor(u.id);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { user: loggedInUser } = await api.login(email, password);
      setUser(loggedInUser);
      connectSockets(loggedInUser);
    } finally {
      setIsLoading(false);
    }
  };

  const switchUser = async (demoUser: any) => {
    setIsLoading(true);
    try {
      const pwd = demoUser.role === "ADMIN" ? "admin123" : "author123";
      await login(demoUser.email, pwd);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
    socketClient.disconnect();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, switchUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
