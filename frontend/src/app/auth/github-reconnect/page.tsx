'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { authAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

function GitHubReconnectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { fetchUser } = useAuthStore();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      setStatus('error');
      setError('No authorization code received');
      return;
    }

    const reconnect = async () => {
      try {
        // Pass the redirect_uri that was used in the OAuth flow
        const redirectUri = `${window.location.origin}/auth/github-reconnect`;
        await authAPI.connectGithub(code, redirectUri);
        await fetchUser();
        setStatus('success');

        // Redirect to settings after 2 seconds
        setTimeout(() => {
          router.push('/settings');
        }, 2000);
      } catch (err: unknown) {
        setStatus('error');
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to reconnect GitHub');
      }
    };

    reconnect();
  }, [searchParams, router, fetchUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-github-gray-50 dark:bg-github-gray-900">
      <div className="bg-white dark:bg-github-gray-800 rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            <p className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100">
              GitHub 연결 중...
            </p>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              잠시만 기다려주세요
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <CheckCircle className="w-12 h-12 text-green-500" />
            <p className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100">
              GitHub 연결 완료!
            </p>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              설정 페이지로 이동합니다...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100">
              연결 실패
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
            <button
              onClick={() => router.push('/settings')}
              className="mt-4 px-4 py-2 bg-github-gray-900 dark:bg-github-gray-100 text-white dark:text-github-gray-900 rounded-md text-sm font-medium hover:bg-github-gray-800 dark:hover:bg-github-gray-200"
            >
              설정으로 돌아가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function GitHubReconnectPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-github-gray-50 dark:bg-github-gray-900">
          <div className="bg-white dark:bg-github-gray-800 rounded-lg p-8 shadow-lg max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100">
                로딩 중...
              </p>
            </div>
          </div>
        </div>
      }
    >
      <GitHubReconnectContent />
    </Suspense>
  );
}
