'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { Github, LogOut, User, Settings, Moon, Sun, Workflow, Store } from 'lucide-react';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

export default function Header() {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  const isActive = (path: string) => pathname === path;

  if (!isAuthenticated) return null;

  return (
    <header className="border-b border-github-gray-200 dark:border-github-gray-700 bg-white dark:bg-github-gray-900">
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/profile" className="flex items-center gap-2">
              <Github className="w-6 h-6 text-github-gray-900 dark:text-github-gray-100" />
              <span className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
                Git Deck
              </span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/profile"
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive('/profile')
                  ? 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 font-medium'
                  : 'text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-50 dark:hover:bg-github-gray-800 hover:text-github-gray-900 dark:hover:text-github-gray-100'
              }`}
            >
              프로필 편집기
            </Link>
            <Link
              href="/blog"
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                isActive('/blog')
                  ? 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 font-medium'
                  : 'text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-50 dark:hover:bg-github-gray-800 hover:text-github-gray-900 dark:hover:text-github-gray-100'
              }`}
            >
              블로그
            </Link>
            {user?.is_github_connected && (
              <Link
                href="/github"
                className={`px-3 py-2 text-sm rounded-md transition-colors ${
                  isActive('/github')
                    ? 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 font-medium'
                    : 'text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-50 dark:hover:bg-github-gray-800 hover:text-github-gray-900 dark:hover:text-github-gray-100'
                }`}
              >
                GitHub
              </Link>
            )}
            <Link
              href="/workflows"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
                pathname?.startsWith('/workflows')
                  ? 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 font-medium'
                  : 'text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-50 dark:hover:bg-github-gray-800 hover:text-github-gray-900 dark:hover:text-github-gray-100'
              }`}
            >
              <Workflow className="w-4 h-4" />
              워크플로우
            </Link>
            <Link
              href="/marketplace"
              className={`flex items-center gap-1.5 px-3 py-2 text-sm rounded-md transition-colors ${
                pathname?.startsWith('/marketplace')
                  ? 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-900 dark:text-github-gray-100 font-medium'
                  : 'text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-50 dark:hover:bg-github-gray-800 hover:text-github-gray-900 dark:hover:text-github-gray-100'
              }`}
            >
              <Store className="w-4 h-4" />
              마켓플레이스
            </Link>
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <Link
              href="/mypage"
              className="flex items-center gap-2 px-3 py-1.5 bg-github-gray-50 dark:bg-github-gray-800 rounded-md hover:bg-github-gray-100 dark:hover:bg-github-gray-700 transition-colors"
            >
              <User className="w-4 h-4 text-github-gray-600 dark:text-github-gray-400" />
              <span className="text-sm text-github-gray-900 dark:text-github-gray-100">{user?.github_username || user?.username}</span>
            </Link>
            <NotificationDropdown isAuthenticated={isAuthenticated} />
            <button
              onClick={toggleTheme}
              className="p-2 text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded-md transition-colors"
              title={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Link
              href="/settings"
              className="p-2 text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded-md transition-colors"
              title="설정"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="p-2 text-github-gray-600 dark:text-github-gray-400 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded-md transition-colors"
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
