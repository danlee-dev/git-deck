'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Github, LogOut, User, Settings } from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();

  const isActive = (path: string) => pathname === path;

  if (!isAuthenticated) return null;

  return (
    <header className="border-b border-github-gray-200 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Github className="w-6 h-6 text-github-gray-900" />
              <span className="text-lg font-semibold text-github-gray-900">
                Git Deck
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive('/dashboard')
                  ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                  : 'text-github-gray-600 hover:bg-github-gray-50 hover:text-github-gray-900'
              }`}
            >
              대시보드
            </Link>
            <Link
              href="/profile"
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive('/profile')
                  ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                  : 'text-github-gray-600 hover:bg-github-gray-50 hover:text-github-gray-900'
              }`}
            >
              프로필
            </Link>
            <Link
              href="/blog"
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive('/blog')
                  ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                  : 'text-github-gray-600 hover:bg-github-gray-50 hover:text-github-gray-900'
              }`}
            >
              블로그
            </Link>
            {user?.is_github_connected && (
              <Link
                href="/github"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/github')
                    ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                    : 'text-github-gray-600 hover:bg-github-gray-50 hover:text-github-gray-900'
                }`}
              >
                GitHub
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-github-gray-50 rounded-md">
              <User className="w-4 h-4 text-github-gray-600" />
              <span className="text-sm text-github-gray-900">{user?.username}</span>
            </div>
            <Link
              href="/settings"
              className="p-2 text-github-gray-600 hover:bg-github-gray-100 rounded-md transition-colors"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="p-2 text-github-gray-600 hover:bg-github-gray-100 rounded-md transition-colors"
              title="로그아웃"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
