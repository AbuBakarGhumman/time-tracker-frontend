import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { User } from "../api/auth";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (user: User) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem("user", JSON.stringify(newUser));
      // Broadcast update to other tabs/windows
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: newUser }));
    } else {
      localStorage.removeItem("user");
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, [setUser]);

  // Listen for user updates from other contexts (e.g., after profile image upload)
  useEffect(() => {
    const handleUserUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      setUserState(customEvent.detail);
    };

    window.addEventListener("userUpdated", handleUserUpdate);
    return () => window.removeEventListener("userUpdated", handleUserUpdate);
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};
