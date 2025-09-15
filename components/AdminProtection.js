'use client';

import { useAuth } from '@/contexts/AuthContext';

export default function AdminProtection({ children }) {
  const { loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // At this point, middleware has already handled authentication and authorization
  // If we reach here, the user is authenticated and authorized
  return children;
}
