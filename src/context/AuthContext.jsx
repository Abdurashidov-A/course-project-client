import { createContext, useContext, useState } from "react";
import { devLogin } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  async function login(email) {
    const loggedUser = await devLogin(email);
    setUser(loggedUser);
    return loggedUser;
  }

  function logout() {
    setUser(null);
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
