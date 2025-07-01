'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  // TEMPORARILY DISABLED AUTHENTICATION FOR TESTING
  // const { user, loading } = useAuth();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!loading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, loading, router]);

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
  //       <div className="text-center">
  //             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
  //             <p className="mt-4 text-gray-600">Loading...</p>
  //           </div>
  //     </div>
  //   );
  // }

  // if (!user) {
  //   return null; // Will redirect to login
  // }

  return <>{children}</>;
} 