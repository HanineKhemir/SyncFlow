// hooks/useAuth.js
'use client'
import { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const decoded = jwtDecode(storedToken);
          console.log('🔍 Decoded JWT:', decoded); // Debug log
          
          setUser({
            id: decoded.sub || decoded.id,
            username: decoded.username,
            email: decoded.email,
            role: decoded.role,
            company: {
              id: decoded.companyId, // This matches your JWT structure
              code : decoded.companyCode, // Assuming you have a company code in your JWT
            }
          });
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    }
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    try {
      const decoded = jwtDecode(newToken);
      console.log('🔍 Login - Decoded JWT:', decoded); // Debug log
      
      setUser({
        id: decoded.sub || decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        // Add company information based on your JWT structure
        company: {
          id: decoded.companyId, // This matches your JWT structure
          code : decoded.companyCode, // Assuming you have a company code in your JWT
        }
      });
      console.log('User logged in:', {
        id: decoded.sub || decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        company: {
          id: decoded.companyId,
          code : decoded.companyCode,
        }
      });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    token,
    user,
    isManager: user?.role === 'manager',
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}