'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { githubAPI } from '@/lib/api';
import { RefreshCw, Github, Star, GitFork, ExternalLink, User, FileText } from 'lucide-react';
import Link from 'next/link';

interface Repository {
  id: string;
  name: string;
  full_name: string;
  description: string;
  url: string;
  stars_count: number;
  forks_count: number;
  language: string;
  is_private: boolean;
  is_featured: boolean;
  updated_at: string;
}

export default function GitHubPage() {
  const { user } = useAuthStore();
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user?.is_github_connected) {
      fetchRepositories();
    }
  }, [user]);

  const fetchRepositories = async () => {
    try {
      const response = await githubAPI.listRepositories();
      setRepositories(response.data);
    } catch (error) {
      console.error('Failed to fetch repositories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await githubAPI.syncRepositories();
      await fetchRepositories();
    } catch (error) {
      console.error('Failed to sync repositories:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (!user?.is_github_connected) {
    return (
      <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 text-center py-12">
        <Github className="w-16 h-16 text-github-gray-400 dark:text-github-gray-600 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
          GitHub 연결 필요
        </h2>
        <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-6">
          이 기능을 사용하려면 GitHub 계정을 연결해야 합니다.
        </p>
        <Link href="/settings" className="btn-primary">
          설정에서 연결하기
        </Link>
      </div>
    );
  }

  const profileRepo = repositories.find(repo => repo.is_featured);
  const otherRepos = repositories.filter(repo => !repo.is_featured);

  const RepositoryCard = ({ repo }: { repo: Repository }) => (
    <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <a
              href={repo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-medium text-github-blue dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              {repo.name}
              <ExternalLink className="w-4 h-4" />
            </a>
            {repo.is_private && (
              <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                Private
              </span>
            )}
          </div>
          <p className="text-xs text-github-gray-500 dark:text-github-gray-500 mt-1">
            {repo.full_name}
          </p>
        </div>
      </div>

      {repo.description && (
        <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-3 line-clamp-2">
          {repo.description}
        </p>
      )}

      <div className="flex items-center gap-4 text-sm text-github-gray-600 dark:text-github-gray-400">
        {repo.language && (
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-full bg-github-blue dark:bg-blue-400"></span>
            {repo.language}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Star className="w-4 h-4" />
          {repo.stars_count}
        </span>
        <span className="flex items-center gap-1">
          <GitFork className="w-4 h-4" />
          {repo.forks_count}
        </span>
      </div>

      <div className="mt-3 pt-3 border-t border-github-gray-200 dark:border-github-gray-700">
        <p className="text-xs text-github-gray-500 dark:text-github-gray-500">
          마지막 업데이트: {formatDate(repo.updated_at)}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100">
            GitHub 저장소
          </h1>
          <p className="mt-1 text-sm text-github-gray-600 dark:text-github-gray-400">
            연결된 GitHub 계정의 저장소를 관리하세요
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '동기화 중...' : '동기화'}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 animate-pulse">
              <div className="h-24 bg-github-gray-100 dark:bg-github-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      ) : repositories.length === 0 ? (
        <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 text-center py-12">
          <p className="text-github-gray-600 dark:text-github-gray-400 mb-4">
            동기화된 저장소가 없습니다
          </p>
          <button onClick={handleSync} className="btn-primary">
            저장소 동기화하기
          </button>
        </div>
      ) : (
        <>
          {profileRepo ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-github-gray-700 dark:text-github-gray-300" />
                <h2 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
                  프로필 저장소
                </h2>
              </div>
              <div className="card bg-gradient-to-br from-github-gray-50 to-white dark:from-github-gray-800 dark:to-github-gray-800 border-2 border-github-blue/20 dark:border-blue-400/20">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={profileRepo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xl font-semibold text-github-blue dark:text-blue-400 hover:underline flex items-center gap-2"
                      >
                        <FileText className="w-5 h-5" />
                        {profileRepo.name}
                        <ExternalLink className="w-5 h-5" />
                      </a>
                      {profileRepo.is_private && (
                        <span className="px-2 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                          Private
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-github-gray-500 dark:text-github-gray-500 mt-1">
                      {profileRepo.full_name}
                    </p>
                  </div>
                </div>

                {profileRepo.description && (
                  <p className="text-sm text-github-gray-700 dark:text-github-gray-300 mb-4">
                    {profileRepo.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-github-gray-600 dark:text-github-gray-400">
                  {profileRepo.language && (
                    <span className="flex items-center gap-1">
                      <span className="w-3 h-3 rounded-full bg-github-blue dark:bg-blue-400"></span>
                      {profileRepo.language}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4" />
                    {profileRepo.stars_count}
                  </span>
                  <span className="flex items-center gap-1">
                    <GitFork className="w-4 h-4" />
                    {profileRepo.forks_count}
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-github-gray-200 dark:border-github-gray-700">
                  <p className="text-xs text-github-gray-500 dark:text-github-gray-500">
                    마지막 업데이트: {formatDate(profileRepo.updated_at)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="card bg-github-gray-50 dark:bg-github-gray-800 border-2 border-dashed border-github-gray-300 dark:border-github-gray-600">
              <div className="text-center py-8">
                <User className="w-12 h-12 text-github-gray-400 dark:text-github-gray-600 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
                  프로필 저장소가 없습니다
                </h3>
                <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-4 max-w-md mx-auto">
                  GitHub에서 사용자명과 동일한 이름의 저장소를 생성하면,<br />
                  해당 저장소의 README가 프로필에 표시됩니다.
                </p>
                <a
                  href={`https://github.com/new?name=${user?.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Github className="w-4 h-4" />
                  프로필 저장소 생성하기
                </a>
              </div>
            </div>
          )}

          {otherRepos.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
                모든 저장소 ({otherRepos.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {otherRepos.map((repo) => (
                  <RepositoryCard key={repo.id} repo={repo} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
