import { useState } from "react";
import { devLogin, testLogin } from "../api/authApi";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("cvms_user");

    if (!savedUser) {
      return null;
    }

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem("cvms_user");
      return null;
    }
  });

  function setAuthenticatedUser(loggedUser) {
    setUser(loggedUser);
    localStorage.setItem("cvms_user", JSON.stringify(loggedUser));
    return loggedUser;
  }

  async function login(email) {
    const loggedUser = await devLogin(email);
    return setAuthenticatedUser(loggedUser);
  }

  async function loginWithTestCredentials(login, password) {
    const loggedUser = await testLogin({ login, password });
    return setAuthenticatedUser(loggedUser);
  }

  function logout() {
    setUser(null);
    localStorage.removeItem("cvms_user");
  }

  const value = {
    user,
    isAuthenticated: Boolean(user),
    login,
    loginWithTestCredentials,
    logout,
    setAuthenticatedUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
