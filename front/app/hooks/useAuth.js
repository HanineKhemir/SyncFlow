'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const Router = useRouter();
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // 👇 Function to decode and set user
  const decodeAndSetUser = (accessToken) => {
    try {
      const decoded = jwtDecode(accessToken);
      setUser({
        id: decoded.sub || decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        company: {
          id: decoded.companyId,
          code: decoded.companyCode,
        },
        exp: decoded.exp,
        iat: decoded.iat,
      });
      return decoded.exp;
    } catch (error) {
      console.error('❌ Error decoding token:', error);
      logout();
    }
  };

  // 👇 Refresh token logic
  const refreshToken = async () => {
    const refresh_token = localStorage.getItem('refresh_token');
    if (!refresh_token) {
      logout();
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh_token }),
      });

      if (!response.ok) {
        logout();
      }

      const data = await response.json();
      console.log(data);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('refresh_token', data.refresh_token);
      setToken(data.access_token);
      console.log(data.access_token)
      decodeAndSetUser(data.access_token);
      console.log('🔁 Token refreshed');
    } catch (error) {
      console.error(' Refresh token error:', error);
      logout();
    }
  };

  // 👇 Check token expiry and refresh periodically
  useEffect(() => {
    const checkAndRefresh = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) return;

      const decoded = jwtDecode(storedToken);
      const currentTime = Math.floor(Date.now() / 1000);

      // If expired or close to expiring (e.g., < 60s left)
      if (decoded.exp < currentTime + 10) {
        await refreshToken();
      } else {
        setToken(storedToken);
        decodeAndSetUser(storedToken);
      }
    };

    checkAndRefresh();

    // Optional: set interval to keep checking every 30 seconds
    const interval = setInterval(checkAndRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  const login = (accessToken, refreshToken) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    setToken(accessToken);
    decodeAndSetUser(accessToken);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setToken(null);
    setUser(null);
    Router.push('/Login');
  };

  const value = {
    token,
    user,
    isManager: user?.role === 'manager',
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
