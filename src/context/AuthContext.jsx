import { createContext, useContext, useState } from "react";
import { devLogin } from "../api/authApi";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("cvms_user");

    if (!savedUser) {
      return null;
    }

    return JSON.parse(savedUser);
  });

  async function login(email) {
    const loggedUser = await devLogin(email);
    setUser(loggedUser);
    localStorage.setItem("cvms_user", JSON.stringify(loggedUser));

    return loggedUser;
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("cvms_user");
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
