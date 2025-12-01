'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-github-gray-50 dark:bg-github-gray-900">
        <div className="text-github-gray-600 dark:text-github-gray-400">로딩 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-github-gray-50 dark:bg-github-gray-900 overflow-hidden">
      <Header />
      <main className="flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 overflow-hidden">
        {children}
      </main>
      <Footer />
    </div>
  );
}
