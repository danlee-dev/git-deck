'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { githubAPI } from '@/lib/api';
import { Github, ExternalLink, Star, GitFork, RefreshCw } from 'lucide-react';

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

const processGitHubHtml = (html: string, repoFullName: string, theme: 'light' | 'dark' = 'light'): string => {
  let processedHtml = html;

  // HTML 주석 내부의 상대 경로 이미지도 변환
  processedHtml = processedHtml.replace(
    /<!--[\s\S]*?-->/g,
    (comment) => {
      return comment.replace(
        /(src|href)=["'](\.\/)?(profile-3d-contrib\/[^"']+)["']/g,
        (match, attr, dot, path) => {
          return `${attr}="https://raw.githubusercontent.com/${repoFullName}/main/${path}"`;
        }
      );
    }
  );

  const parser = new DOMParser();
  const doc = parser.parseFromString(processedHtml, 'text/html');

  // picture 태그 처리 - 테마에 맞게 필터링
  const pictures = doc.querySelectorAll('picture');
  pictures.forEach((picture) => {
    const sources = picture.querySelectorAll('source');
    sources.forEach((source) => {
      const media = source.getAttribute('media');
      // 테마에 맞지 않는 source는 제거
      if (theme === 'light' && media && media.includes('prefers-color-scheme: dark')) {
        source.remove();
        return;
      }
      if (theme === 'dark' && media && media.includes('prefers-color-scheme: light')) {
        source.remove();
        return;
      }

      // srcset 상대 경로 변환
      const srcset = source.getAttribute('srcset');
      if (srcset && !srcset.startsWith('http://') && !srcset.startsWith('https://')) {
        const cleanPath = srcset.replace(/^\.\//, '').replace(/^\//, '');
        const newSrcset = `https://raw.githubusercontent.com/${repoFullName}/main/${cleanPath}`;
        source.setAttribute('srcset', newSrcset);
      }
    });
  });

  // 모든 img 태그의 상대 경로 변환 및 테마 필터링
  const images = doc.querySelectorAll('img');
  images.forEach((img) => {
    const src = img.getAttribute('src');

    // 테마에 맞지 않는 이미지는 숨김 처리
    if (theme === 'light' && src && src.includes('#gh-dark-mode-only')) {
      img.style.display = 'none';
      return;
    }
    if (theme === 'dark' && src && src.includes('#gh-light-mode-only')) {
      img.style.display = 'none';
      return;
    }

    // 상대 경로 변환
    if (src && !src.startsWith('http://') && !src.startsWith('https://') && !src.startsWith('data:')) {
      const cleanPath = src.replace(/^\.\//, '').replace(/^\//, '');
      const newSrc = `https://raw.githubusercontent.com/${repoFullName}/main/${cleanPath}`;
      img.setAttribute('src', newSrc);
    }
  });

  // 링크의 상대 경로 변환
  const links = doc.querySelectorAll('a');
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('#') && !href.startsWith('mailto:')) {
      const cleanPath = href.replace(/^\.\//, '').replace(/^\//, '');
      const newHref = `https://github.com/${repoFullName}/blob/main/${cleanPath}`;
      link.setAttribute('href', newHref);
    }
  });

  // 배지 컨테이너 감지 및 클래스 적용 (p, div 모두 확인)
  const containers = doc.querySelectorAll('p, div');
  containers.forEach((container) => {
    const children = Array.from(container.childNodes);

    // 텍스트 노드 중 의미있는 텍스트가 있는지 확인
    const hasText = children.some(node => {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.textContent?.trim().length > 0;
      }
      return false;
    });

    // 이미지나 링크만 있는 경우
    if (!hasText) {
      const elements = Array.from(container.children);
      const hasImages = elements.some(el => {
        if (el.tagName === 'IMG') return true;
        if (el.tagName === 'A') {
          return el.querySelector('img') !== null;
        }
        return false;
      });

      if (hasImages && elements.length > 1) {
        container.classList.add('badge-container');
      }
    }
  });

  return doc.body.innerHTML;
};

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { theme } = useThemeStore();
  const [profileRepo, setProfileRepo] = useState<Repository | null>(null);
  const [readmeHtml, setReadmeHtml] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (user?.is_github_connected) {
      fetchProfileData();
    } else {
      setIsLoading(false);
    }
  }, [user, theme]);

  const fetchProfileData = async () => {
    try {
      const reposResponse = await githubAPI.listRepositories();
      const repos = reposResponse.data;
      const profile = repos.find((repo: Repository) => repo.is_featured);

      if (profile) {
        setProfileRepo(profile);
        const parts = profile.full_name.split('/');
        const owner = parts[0];
        const repo = parts[1];

        try {
          const readmeResponse = await githubAPI.getReadme(owner, repo);
          if (readmeResponse.data.html) {
            const processedHtml = processGitHubHtml(readmeResponse.data.html, profile.full_name, theme);
            setReadmeHtml(processedHtml);
          } else {
            setReadmeHtml('<div class="text-github-gray-600 dark:text-github-gray-400">README를 렌더링할 수 없습니다.</div>');
          }
        } catch (error) {
          console.error('Failed to fetch README:', error);
          setReadmeHtml('<div class="text-github-gray-600 dark:text-github-gray-400">README를 불러올 수 없습니다. 프로필 저장소에 README.md 파일이 없거나 접근할 수 없습니다.</div>');
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await githubAPI.syncRepositories();
      await fetchProfileData();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (!user?.is_github_connected) {
    return (
      <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 text-center py-12">
        <Github className="w-16 h-16 text-github-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
          GitHub 연결 필요
        </h2>
        <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-6">
          프로필을 보려면 GitHub 계정을 연결해야 합니다.
        </p>
        <a href="/settings" className="btn-primary">
          설정에서 연결하기
        </a>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-github-gray-600">로딩 중...</div>
      </div>
    );
  }

  if (!profileRepo) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100">프로필</h1>
            <p className="mt-1 text-sm text-github-gray-600 dark:text-github-gray-400">
              GitHub 프로필 README를 확인하세요
            </p>
          </div>
        </div>

        <div className="card dark:bg-github-gray-800 dark:border-github-gray-700 bg-github-gray-50 border-2 border-dashed border-github-gray-300">
          <div className="text-center py-12">
            <Github className="w-16 h-16 text-github-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
              프로필 저장소가 없습니다
            </h3>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-6 max-w-md mx-auto">
              GitHub에서 사용자명과 동일한 이름의 저장소를 생성하면,<br />
              해당 저장소의 README가 프로필에 표시됩니다.
            </p>
            <div className="flex items-center justify-center gap-3">
              <a
                href={`https://github.com/new?name=${user?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                프로필 저장소 생성하기
              </a>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="btn-secondary inline-flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? '동기화 중...' : '다시 확인'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-github-gray-900 dark:text-github-gray-100">프로필</h1>
          <p className="mt-1 text-sm text-github-gray-600 dark:text-github-gray-400">
            GitHub 프로필 README
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          {isSyncing ? '동기화 중...' : '새로고침'}
        </button>
      </div>

      <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700">
        <div className="mb-6 pb-6 border-b border-github-gray-200 dark:border-github-gray-700">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <a
                  href={profileRepo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xl font-semibold text-github-blue dark:text-blue-400 hover:underline flex items-center gap-2"
                >
                  <Github className="w-6 h-6" />
                  {profileRepo.full_name}
                  <ExternalLink className="w-5 h-5" />
                </a>
              </div>
              {profileRepo.description && (
                <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-3">
                  {profileRepo.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-github-gray-600 dark:text-github-gray-400">
                {profileRepo.language && (
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-github-blue"></span>
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
            </div>
          </div>
        </div>

        <div
          className="markdown-body"
          dangerouslySetInnerHTML={{ __html: readmeHtml }}
        />
      </div>
    </div>
  );
}
