'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function withAuth(WrappedComponent, requireAdmin = false, preventAdmin = false) {
  return function AuthenticatedComponent(props) {
    const { user, loading, isAdmin, isEmailVerified } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.push('/auth/login');
          return;
        }
        
        if (!isEmailVerified) {
          router.push(`/auth/verify-email?email=${encodeURIComponent(user.email)}`);
          return;
        }
        
        if (requireAdmin && !isAdmin) {
          // Non-admin trying to access admin page - redirect to home
          router.push('/');
          return;
        }
        
        if (preventAdmin && isAdmin) {
          // Admin trying to access user-only pages - redirect to admin
          router.push('/admin');
          return;
        }
      }
    }, [user, loading, isAdmin, isEmailVerified, router]);

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!user || !isEmailVerified) {
      return null;
    }

    if (requireAdmin && !isAdmin) {
      return null;
    }

    if (preventAdmin && isAdmin) {
      return null;
    }

    return <WrappedComponent {...props} />;
  };
}
