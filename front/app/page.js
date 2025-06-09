"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "./hooks/useAuth"; // Update this path to match your file structure

export default function Home() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    // Wait a moment for the auth context to initialize
    const timer = setTimeout(() => {
      if (!token || !user) {
        // User is not authenticated, redirect to login
        router.push('/Login');
      } else {
        // User is authenticated, redirect to dashboard
        router.push('/dashboard');
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [token, user, router]);

  // Show a loading state while checking authentication
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <p>Loading...</p>
    </div>
  );
}