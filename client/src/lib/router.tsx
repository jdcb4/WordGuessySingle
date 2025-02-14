import { Router, Route } from "wouter";
import { useState, useEffect } from "react";

// Custom hook to handle base path
function useBasePath() {
  return '/WordGuessySingle'; // Match your vite.config.ts base
}

// Custom hook for hash-based routing
function useHashLocation() {
  const [location, setLocation] = useState(window.location.hash.replace('#', '') || '/');
  const base = useBasePath();

  useEffect(() => {
    // Handle hash changes
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      setLocation(hash);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (to: string) => {
    window.location.hash = to;
  };

  return [location, navigate];
}

export function AppRouter({ children }: { children: React.ReactNode }) {
  return (
    <Router hook={useHashLocation}>
      {children}
    </Router>
  );
} 