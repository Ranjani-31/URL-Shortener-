import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import axios from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check existing authentication when app loads
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/v1/users/me");

        setCurrentUser(response.data.user);
        setIsAuthenticated(true);

      } catch (error) {
        setCurrentUser(null);
        setIsAuthenticated(false);

      } finally {
        setIsCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  const value = {
    currentUser,
    isAuthenticated,
    isCheckingAuth,
    setCurrentUser,
    setIsAuthenticated
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}