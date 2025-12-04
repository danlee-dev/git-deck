'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Github } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/profile');
    } catch (err: any) {
      setError(err.response?.data?.detail || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/github/callback`;
    // GitHub Actions 기능에 필요한 전체 권한
    const scopes = [
      'user',           // 유저 정보
      'repo',           // 레포지토리 전체 접근
      'read:org',       // 조직 정보 읽기
      'workflow',       // 워크플로우 파일 수정 (.github/workflows)
      'write:packages', // GitHub Packages 푸시 (Docker 등)
      'read:packages',  // GitHub Packages 읽기
    ].join(',');
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-github-gray-50 dark:bg-github-gray-900">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-github-gray-800 rounded-lg border border-github-gray-200 dark:border-github-gray-700 p-8 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100 mb-2">
              Git Deck
            </h1>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              계정에 로그인하세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-github-gray-900 dark:text-github-gray-100 mb-2"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input w-full"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-github-gray-900 dark:text-github-gray-100 mb-2"
              >
                비밀번호
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full"
                placeholder="비밀번호를 입력하세요"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-github-gray-200 dark:border-github-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-github-gray-800 text-github-gray-500 dark:text-github-gray-400">또는</span>
            </div>
          </div>

          <button
            onClick={handleGithubLogin}
            className="btn-github w-full flex items-center justify-center gap-2"
          >
            <Github className="w-5 h-5" />
            GitHub로 계속하기
          </button>

          <div className="mt-6 text-center">
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              계정이 없으신가요?{' '}
              <Link
                href="/register"
                className="text-github-blue dark:text-blue-400 hover:underline font-medium"
              >
                회원가입
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
