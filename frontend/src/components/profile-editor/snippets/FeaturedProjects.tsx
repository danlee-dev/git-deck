'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  FolderGit2,
  Star,
  GitFork,
  X,
  Activity,
  Loader2,
  CheckCircle2,
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
  language: string | null;
  fork: boolean;
  pushed_at: string;
  updated_at: string;
  owner: {
    login: string;
  };
  topics?: string[];
}

interface ScoredRepo extends Repository {
  activityScore: number;
  isDevRepo: boolean;
}

interface FeaturedProjectsProps {
  username: string;
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

// Non-dev repo patterns
const NON_DEV_PATTERNS = [
  /^\.github$/i,
  /\.github\.io$/i,
  /^awesome-/i,
  /^\.dotfiles$/i,
  /^dotfiles$/i,
];

// Dev signals (file patterns that indicate a dev repo)
const DEV_TOPICS = [
  'api', 'library', 'framework', 'cli', 'sdk', 'app', 'application',
  'frontend', 'backend', 'fullstack', 'web', 'mobile', 'desktop'
];

function isDevRepo(repo: Repository, username: string): boolean {
  // Exclude profile repo
  if (repo.name.toLowerCase() === username.toLowerCase()) {
    return false;
  }

  // Exclude forks
  if (repo.fork) {
    return false;
  }

  // Exclude non-dev patterns
  for (const pattern of NON_DEV_PATTERNS) {
    if (pattern.test(repo.name)) {
      return false;
    }
  }

  // Must have a language (not docs-only)
  if (!repo.language) {
    return false;
  }

  return true;
}

function calculateActivityScore(repo: Repository): number {
  let score = 0;

  // Recent push bonus (within days)
  const pushedAt = new Date(repo.pushed_at);
  const now = new Date();
  const daysSincePush = Math.floor((now.getTime() - pushedAt.getTime()) / (1000 * 60 * 60 * 24));

  if (daysSincePush < 7) {
    score += 50; // Very active
  } else if (daysSincePush < 30) {
    score += 30; // Active
  } else if (daysSincePush < 90) {
    score += 15; // Moderately active
  } else {
    score += 5; // Not very active
  }

  // Stars bonus
  score += Math.min(repo.stargazers_count * 2, 100);

  // Forks bonus (indicates usefulness)
  score += Math.min(repo.forks_count * 3, 50);

  // Has description bonus
  if (repo.description && repo.description.length > 20) {
    score += 10;
  }

  // Has topics bonus
  if (repo.topics && repo.topics.length > 0) {
    score += 5;
    // Dev topic bonus
    const hasDevTopic = repo.topics.some(t =>
      DEV_TOPICS.some(dt => t.toLowerCase().includes(dt))
    );
    if (hasDevTopic) {
      score += 10;
    }
  }

  return score;
}

function getActivityLabel(score: number): { label: string; color: string } {
  if (score >= 80) return { label: '매우 활발', color: 'text-green-500' };
  if (score >= 50) return { label: '활발', color: 'text-blue-500' };
  if (score >= 30) return { label: '보통', color: 'text-yellow-500' };
  return { label: '낮음', color: 'text-gray-500' };
}

export default function FeaturedProjects({ username, onInsert, onClose }: FeaturedProjectsProps) {
  const [repos, setRepos] = useState<ScoredRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<ScoredRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [includeAutoUpdate, setIncludeAutoUpdate] = useState(false);

  const fetchRepos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.github.com/users/${username}/repos?sort=pushed&per_page=100&type=owner`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch repositories');
      }

      const data: Repository[] = await response.json();

      // Score and filter repos
      const scoredRepos: ScoredRepo[] = data.map(repo => ({
        ...repo,
        activityScore: calculateActivityScore(repo),
        isDevRepo: isDevRepo(repo, username)
      }));

      // Filter to dev repos only and sort by score
      const devRepos = scoredRepos
        .filter(r => r.isDevRepo)
        .sort((a, b) => b.activityScore - a.activityScore);

      setRepos(devRepos);

      // Auto-select top 3
      setSelectedRepos(devRepos.slice(0, 3));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    if (username) {
      fetchRepos();
    }
  }, [username, fetchRepos]);

  const toggleRepo = (repo: ScoredRepo) => {
    setSelectedRepos(prev => {
      const isSelected = prev.some(r => r.id === repo.id);
      if (isSelected) {
        return prev.filter(r => r.id !== repo.id);
      }
      if (prev.length >= 6) {
        return prev; // Max 6 repos
      }
      return [...prev, repo];
    });
  };

  const generateMarkdown = () => {
    if (selectedRepos.length === 0) return '';

    let markdown = `## Featured Projects\n\n`;

    if (includeAutoUpdate) {
      markdown += `<!-- FEATURED-PROJECTS:START -->\n`;
      markdown += `<!-- This section is auto-updated by GitHub Actions -->\n\n`;
    }

    markdown += `| Project | Description | Stats |\n`;
    markdown += `|---------|-------------|-------|\n`;

    for (const repo of selectedRepos) {
      const desc = repo.description
        ? repo.description.substring(0, 60) + (repo.description.length > 60 ? '...' : '')
        : 'No description';
      const stats = `![Stars](https://img.shields.io/github/stars/${repo.full_name}?style=flat-square) ![Language](https://img.shields.io/github/languages/top/${repo.full_name}?style=flat-square)`;
      markdown += `| [${repo.name}](${repo.html_url}) | ${desc} | ${stats} |\n`;
    }

    if (includeAutoUpdate) {
      markdown += `\n<!-- FEATURED-PROJECTS:END -->\n`;
      markdown += `\n<sub>Last updated: ${new Date().toISOString().split('T')[0]}</sub>`;
    }

    return markdown;
  };

  const handleInsert = () => {
    const markdown = generateMarkdown();
    if (markdown) {
      onInsert(markdown);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-github-gray-900 rounded-lg shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-500" />
            <h2 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
              주요 프로젝트
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-github-gray-600 dark:text-github-gray-400" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-github-gray-200 dark:border-github-gray-700">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            저장소는 활동(최근 커밋, 스타, 포크)에 따라 순위가 매겨집니다.
            프로필, 포크, 비개발 저장소는 제외됩니다.
          </p>
        </div>

        {/* Selected count */}
        <div className="px-4 py-2 border-b border-github-gray-200 dark:border-github-gray-700 flex items-center justify-between">
          <span className="text-sm text-github-gray-600 dark:text-github-gray-400">
            선택됨: {selectedRepos.length}/6
          </span>
          <button
            onClick={fetchRepos}
            disabled={loading}
            className="flex items-center gap-1 text-sm text-github-blue hover:underline disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            새로고침
          </button>
        </div>

        {/* Repo list */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-github-blue animate-spin mb-3" />
              <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
                저장소 분석 중...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : repos.length > 0 ? (
            <div className="space-y-2">
              {repos.map((repo, index) => {
                const isSelected = selectedRepos.some(r => r.id === repo.id);
                const activity = getActivityLabel(repo.activityScore);

                return (
                  <button
                    key={repo.id}
                    onClick={() => toggleRepo(repo)}
                    className={`w-full p-3 text-left rounded-md border transition-all ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-github-blue'
                        : 'bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 hover:border-github-blue'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {isSelected ? (
                          <CheckCircle2 className="w-5 h-5 text-github-blue" />
                        ) : (
                          <FolderGit2 className="w-5 h-5 text-github-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-github-gray-900 dark:text-github-gray-100 truncate">
                            {repo.name}
                          </h3>
                          {index < 3 && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded">
                              Top {index + 1}
                            </span>
                          )}
                        </div>
                        {repo.description && (
                          <p className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-1 line-clamp-1">
                            {repo.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          <span className="flex items-center gap-1 text-github-gray-500">
                            <Star className="w-3 h-3" />
                            {repo.stargazers_count}
                          </span>
                          <span className="flex items-center gap-1 text-github-gray-500">
                            <GitFork className="w-3 h-3" />
                            {repo.forks_count}
                          </span>
                          {repo.language && (
                            <span className="text-github-gray-500">
                              {repo.language}
                            </span>
                          )}
                          <span className={`flex items-center gap-1 ${activity.color}`}>
                            <Activity className="w-3 h-3" />
                            {activity.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-8 h-8 text-github-gray-400 mb-2" />
              <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
                개발 저장소를 찾을 수 없습니다
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-github-gray-200 dark:border-github-gray-700">
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={includeAutoUpdate}
              onChange={(e) => setIncludeAutoUpdate(e.target.checked)}
              className="w-4 h-4 rounded border-github-gray-300 text-github-blue focus:ring-github-blue"
            />
            <span className="text-sm text-github-gray-700 dark:text-github-gray-300">
              자동 업데이트 마커 포함 (GitHub Actions 워크플로우용)
            </span>
          </label>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-github-gray-700 dark:text-github-gray-300 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded-md transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleInsert}
              disabled={selectedRepos.length === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-github-blue hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              삽입 ({selectedRepos.length}개 프로젝트)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
