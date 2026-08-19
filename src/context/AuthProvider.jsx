import { useEffect, useState, useCallback } from "react";
import AuthContext from "./AuthContext";
import {
  authAPI,
  clearAuthSession,
  getAuthToken,
  getStoredUser,
  saveAuthSession,
} from "../services/api";

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // ------------------------------------------------------
  // Logout Procedure
  // ------------------------------------------------------
  const logout = useCallback(() => {
    authAPI.logout();
    setToken(null);
    setUser(null);
  }, []);

  // ------------------------------------------------------
  // Initialize Auth State from Storage & Validate with API
  // ------------------------------------------------------
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const storedToken = getAuthToken();
        const storedUser = getStoredUser();

        if (!storedToken) {
          if (isMounted) setLoading(false);
          return;
        }

        if (isMounted) {
          setToken(storedToken);
          if (storedUser) setUser(storedUser);
        }

        // Validate token freshness via /auth/me
        const response = await authAPI.me();

        if (response?.success && response?.data?.user && isMounted) {
          const currentUser = response.data.user;
          setUser(currentUser);
          saveAuthSession(storedToken, currentUser);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        if (isMounted) {
          clearAuthSession();
          setToken(null);
          setUser(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    // Event listener for global 401 Unauthorized errors from api.js
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [logout]);

  // ------------------------------------------------------
  // Login Handler
  // ------------------------------------------------------
  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });

    if (!response?.success || !response?.data?.token || !response?.data?.user) {
      throw new Error(response?.message || "Login failed");
    }

    const newToken = response.data.token;
    const newUser = response.data.user;

    saveAuthSession(newToken, newUser);

    setToken(newToken);
    setUser(newUser);

    return {
      token: newToken,
      user: newUser,
    };
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;