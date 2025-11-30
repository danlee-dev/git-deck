'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { profilesAPI, blogAPI, githubAPI } from '@/lib/api';
import { Github, FileText, Users, TrendingUp } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    profiles: 0,
    blogPosts: 0,
    repositories: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [profilesRes, postsRes] = await Promise.all([
          profilesAPI.list(),
          blogAPI.posts.list(),
        ]);

        const newStats: any = {
          profiles: profilesRes.data.length || 0,
          blogPosts: postsRes.data.length || 0,
          repositories: 0,
        };

        if (user?.is_github_connected) {
          try {
            const reposRes = await githubAPI.listRepositories();
            newStats.repositories = reposRes.data.length || 0;
          } catch (err) {
            console.error('Failed to fetch repositories:', err);
          }
        }

        setStats(newStats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  const statCards = [
    {
      label: '프로필',
      value: stats.profiles,
      icon: Users,
      color: 'text-github-blue',
      bgColor: 'bg-blue-50',
      link: '/profile',
    },
    {
      label: '블로그 포스트',
      value: stats.blogPosts,
      icon: FileText,
      color: 'text-github-green',
      bgColor: 'bg-green-50',
      link: '/blog',
    },
    ...(user?.is_github_connected
      ? [
          {
            label: 'GitHub 저장소',
            value: stats.repositories,
            icon: Github,
            color: 'text-github-gray-900',
            bgColor: 'bg-github-gray-100',
            link: '/github',
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-github-gray-900">
          대시보드
        </h1>
        <p className="mt-1 text-sm text-github-gray-600">
          환영합니다, {user?.username}님
        </p>
      </div>

      {!user?.is_github_connected && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Github className="w-5 h-5 text-github-blue mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-github-gray-900">
                GitHub 연결하기
              </h3>
              <p className="mt-1 text-sm text-github-gray-600">
                GitHub 계정을 연결하여 저장소 관리와 README 동기화 기능을 사용하세요.
              </p>
              <Link
                href="/settings"
                className="inline-block mt-3 btn-primary text-sm"
              >
                설정에서 연결하기
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-20 bg-github-gray-100 rounded"></div>
              </div>
            ))}
          </>
        ) : (
          statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.label} href={stat.link}>
                <div className="card hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-github-gray-600">
                        {stat.label}
                      </p>
                      <p className="mt-2 text-3xl font-semibold text-github-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-github-gray-900">
              빠른 시작
            </h2>
          </div>
          <div className="space-y-3">
            <Link
              href="/profile"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-github-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                <Users className="w-4 h-4 text-github-blue" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-github-gray-900">
                  프로필 만들기
                </p>
                <p className="text-xs text-github-gray-600">
                  나만의 개발자 프로필을 구성하세요
                </p>
              </div>
            </Link>
            <Link
              href="/blog"
              className="flex items-center gap-3 p-3 rounded-md hover:bg-github-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                <FileText className="w-4 h-4 text-github-green" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-github-gray-900">
                  블로그 작성하기
                </p>
                <p className="text-xs text-github-gray-600">
                  첫 블로그 포스트를 작성해보세요
                </p>
              </div>
            </Link>
            {user?.is_github_connected && (
              <Link
                href="/github"
                className="flex items-center gap-3 p-3 rounded-md hover:bg-github-gray-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-github-gray-100 flex items-center justify-center">
                  <Github className="w-4 h-4 text-github-gray-900" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-github-gray-900">
                    저장소 동기화
                  </p>
                  <p className="text-xs text-github-gray-600">
                    GitHub 저장소를 가져오세요
                  </p>
                </div>
              </Link>
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-github-gray-900">
              활동
            </h2>
          </div>
          <div className="text-center py-8">
            <TrendingUp className="w-12 h-12 text-github-gray-400 mx-auto mb-3" />
            <p className="text-sm text-github-gray-600">
              활동 내역이 여기에 표시됩니다
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
