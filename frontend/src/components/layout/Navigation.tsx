'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  User,
  FileText,
  Github,
  Settings,
} from 'lucide-react';

export default function Navigation() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const isActive = (path: string) => pathname.startsWith(path);

  const navItems = [
    {
      href: '/profile',
      label: 'Profile Editor',
      icon: User,
    },
    {
      href: '/blog',
      label: '블로그',
      icon: FileText,
    },
    ...(user?.is_github_connected
      ? [
          {
            href: '/github',
            label: 'GitHub',
            icon: Github,
          },
        ]
      : []),
    {
      href: '/settings',
      label: '설정',
      icon: Settings,
    },
  ];

  return (
    <nav className="w-64 bg-white border-r border-github-gray-200 min-h-screen">
      <div className="p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                active
                  ? 'bg-github-gray-100 text-github-gray-900 font-medium'
                  : 'text-github-gray-600 hover:bg-github-gray-50 hover:text-github-gray-900'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
