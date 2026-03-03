import { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

// Hardcoded fallback demo account
const DEMO_USER = { email: 'demo@aps.com', password: 'password123', firstName: 'Demo' };

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('auth') === 'true'
  );

  // Register: saves new user to localStorage mock store
  const register = ({ firstName, lastName, email, password }) => {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { success: false, message: 'An account with this email already exists.' };
    users.push({ firstName, lastName, email, password });
    localStorage.setItem('mockUsers', JSON.stringify(users));
    localStorage.setItem('auth', 'true');
    localStorage.setItem('currentUser', JSON.stringify({ firstName, email }));
    setIsAuthenticated(true);
    return { success: true };
  };

  // Login: validates against stored users or the demo account
  const loginWithCredentials = ({ email, password }) => {
    const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    const found = users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    const isDemo =
      email.toLowerCase() === DEMO_USER.email && password === DEMO_USER.password;

    if (found || isDemo) {
      const user = found || DEMO_USER;
      localStorage.setItem('auth', 'true');
      localStorage.setItem('currentUser', JSON.stringify({ firstName: user.firstName, email: user.email }));
      setIsAuthenticated(true);
      return { success: true };
    }
    return { success: false, message: 'Incorrect email or password.' };
  };

  const logout = () => {
    localStorage.removeItem('auth');
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
  };

  const currentUser = () => {
    try {
      return JSON.parse(localStorage.getItem('currentUser'));
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, register, loginWithCredentials, logout, currentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
