'use client';

import { useState, useEffect } from 'react';
import { Search, FolderGit2, Star, GitFork, X } from 'lucide-react';

interface Repository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  html_url: string;
}

interface RepoSelectorProps {
  username: string;
  onInsert: (markdown: string) => void;
  onClose: () => void;
}

export default function RepoSelector({ username, onInsert, onClose }: RepoSelectorProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<Repository[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=100`);

        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }

        const data = await response.json();
        setRepos(data);
        setFilteredRepos(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchRepos();
    }
  }, [username]);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query))
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [searchQuery, repos]);

  const generateRepoMarkdown = (repo: Repository) => {
    return `<sub><a href="${repo.html_url}"><picture><source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/View_Repo-white?style=flat-square&logo=github&logoColor=black"><source media="(prefers-color-scheme: light)" srcset="https://img.shields.io/badge/View_Repo-181717?style=flat-square&logo=github&logoColor=white"><img src="https://img.shields.io/badge/View_Repo-181717?style=flat-square&logo=github&logoColor=white" height="18"/></picture></a></sub>`;
  };

  const handleSelectRepo = (repo: Repository) => {
    const markdown = generateRepoMarkdown(repo);
    onInsert(markdown);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-github-gray-900 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
            Select Repository
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-github-gray-100 dark:hover:bg-github-gray-800 rounded transition-colors"
          >
            <X className="w-5 h-5 text-github-gray-600 dark:text-github-gray-400" />
          </button>
        </div>

        <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-github-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search repositories..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-github-gray-800 border border-github-gray-300 dark:border-github-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-github-blue dark:focus:ring-blue-400 text-github-gray-900 dark:text-github-gray-100"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-github-blue border-t-transparent rounded-full animate-spin mb-3"></div>
              <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
                Loading repositories...
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-red-600 dark:text-red-400">
                {error}
              </p>
            </div>
          ) : filteredRepos.length > 0 ? (
            <div className="space-y-2">
              {filteredRepos.map(repo => (
                <button
                  key={repo.id}
                  onClick={() => handleSelectRepo(repo)}
                  className="w-full p-3 text-left bg-white dark:bg-github-gray-800 border border-github-gray-200 dark:border-github-gray-700 rounded-md hover:border-github-blue dark:hover:border-blue-400 transition-colors group"
                >
                  <div className="flex items-start gap-3">
                    <FolderGit2 className="w-5 h-5 text-github-gray-500 dark:text-github-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-github-gray-900 dark:text-github-gray-100 truncate group-hover:text-github-blue dark:group-hover:text-blue-400">
                        {repo.name}
                      </h3>
                      {repo.description && (
                        <p className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-1 line-clamp-2">
                          {repo.description}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-xs text-github-gray-500 dark:text-github-gray-500">
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {repo.stargazers_count}
                        </span>
                        <span className="flex items-center gap-1">
                          <GitFork className="w-3 h-3" />
                          {repo.forks_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <Search className="w-8 h-8 text-github-gray-400 mb-2" />
              <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
                No repositories found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
