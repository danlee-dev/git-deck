'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    const token = searchParams.get('token');
    const userId = searchParams.get('user_id');

    if (token && userId) {
      localStorage.setItem('access_token', token);

      fetchUser().then(() => {
        router.push('/profile');
      }).catch(() => {
        localStorage.removeItem('access_token');
        router.push('/login');
      });
    } else {
      router.push('/login');
    }
  }, [searchParams, fetchUser, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-github-gray-50">
      <div className="text-github-gray-600">로그인 처리 중...</div>
    </div>
  );
}
