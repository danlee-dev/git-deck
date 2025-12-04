'use client';

import { useState } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { snippets, categories } from './snippetData';
import SnippetCard from './SnippetCard';
import BadgeSearch from './BadgeSearch';
import RepoSelector from './RepoSelector';
import FeaturedProjects from './FeaturedProjects';

interface SnippetsPanelProps {
  username: string;
  onInsert: (markdown: string) => void;
}

export default function SnippetsPanel({ username, onInsert }: SnippetsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('stats');
  const [isRepoSelectorOpen, setIsRepoSelectorOpen] = useState(false);
  const [isFeaturedProjectsOpen, setIsFeaturedProjectsOpen] = useState(false);

  const filteredSnippets = snippets.filter(s => s.category === selectedCategory);

  if (selectedCategory === 'badges') {
    return (
      <div className="w-full h-full flex flex-col bg-white dark:bg-github-gray-900 border-l border-github-gray-200 dark:border-github-gray-700">
        <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700">
          <h3 className="text-sm font-semibold text-github-gray-900 dark:text-github-gray-100 mb-3">
            배지 검색
          </h3>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                    selectedCategory === category.id
                      ? 'bg-github-blue text-white'
                      : 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-700 dark:text-github-gray-300 hover:bg-github-gray-200 dark:hover:bg-github-gray-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <BadgeSearch onInsert={onInsert} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-github-gray-900 border-l border-github-gray-200 dark:border-github-gray-700">
      <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700">
        <h3 className="text-sm font-semibold text-github-gray-900 dark:text-github-gray-100 mb-3">
          빠른 삽입
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  selectedCategory === category.id
                    ? 'bg-github-blue text-white'
                    : 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-700 dark:text-github-gray-300 hover:bg-github-gray-200 dark:hover:bg-github-gray-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {selectedCategory === 'sections' && (
          <div className="space-y-2 mb-3">
            <button
              onClick={() => setIsFeaturedProjectsOpen(true)}
              className="w-full p-3 text-left bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <div>
                <span className="text-sm font-medium block">주요 프로젝트</span>
                <span className="text-xs opacity-80">활동 기준 자동 순위</span>
              </div>
            </button>
            <button
              onClick={() => setIsRepoSelectorOpen(true)}
              className="w-full p-3 text-left bg-github-blue hover:bg-blue-600 text-white rounded-md transition-colors flex items-center gap-2"
            >
              <Link2 className="w-4 h-4" />
              <span className="text-sm font-medium">저장소 연결</span>
            </button>
          </div>
        )}

        {filteredSnippets.length > 0 ? (
          filteredSnippets.map(snippet => (
            <SnippetCard
              key={snippet.id}
              snippet={snippet}
              onInsert={onInsert}
              username={username}
            />
          ))
        ) : (
          <p className="text-sm text-github-gray-500 dark:text-github-gray-400 text-center py-8">
            이 카테고리에 스니펫이 없습니다
          </p>
        )}
      </div>

      {isRepoSelectorOpen && (
        <RepoSelector
          username={username}
          onInsert={onInsert}
          onClose={() => setIsRepoSelectorOpen(false)}
        />
      )}

      {isFeaturedProjectsOpen && (
        <FeaturedProjects
          username={username}
          onInsert={onInsert}
          onClose={() => setIsFeaturedProjectsOpen(false)}
        />
      )}
    </div>
  );
}
