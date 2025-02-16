import { Router } from "wouter";
import { useState, useEffect } from "react";

// Custom hook for hash-based routing
const useHashLocation = () => {
  const [loc, setLoc] = useState(window.location.hash.slice(1) || "/");

  useEffect(() => {
    const handler = () => {
      const hash = window.location.hash.slice(1) || "/";
      setLoc(hash);
    };

    // Listen to hash changes
    window.addEventListener("hashchange", handler);
    // Listen to initial load
    window.addEventListener("load", handler);

    return () => {
      window.removeEventListener("hashchange", handler);
      window.removeEventListener("load", handler);
    };
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [loc, navigate] as const;
};

export function AppRouter({ children }: { children: React.ReactNode }) {
  return (
    <Router hook={useHashLocation}>
      {children}
    </Router>
  );
} 