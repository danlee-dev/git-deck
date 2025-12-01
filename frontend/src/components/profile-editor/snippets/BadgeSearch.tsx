'use client';

import { useState, useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import { badges, badgeCategories, generateBadgeMarkdown, BadgeInfo } from './badgeData';

interface BadgeSearchProps {
  onInsert: (markdown: string) => void;
}

export default function BadgeSearch({ onInsert }: BadgeSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredBadges = useMemo(() => {
    let result = badges;

    if (selectedCategory !== 'all') {
      result = result.filter(badge => badge.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(badge =>
        badge.name.toLowerCase().includes(query) ||
        badge.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, selectedCategory]);

  const handleInsert = (badge: BadgeInfo) => {
    const markdown = generateBadgeMarkdown(badge);
    onInsert(markdown);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-github-gray-200 dark:border-github-gray-700 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-github-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search badges..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-github-gray-800 border border-github-gray-300 dark:border-github-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-github-blue dark:focus:ring-blue-400 text-github-gray-900 dark:text-github-gray-100"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {badgeCategories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors ${
                selectedCategory === category.id
                  ? 'bg-github-blue text-white'
                  : 'bg-github-gray-100 dark:bg-github-gray-800 text-github-gray-700 dark:text-github-gray-300 hover:bg-github-gray-200 dark:hover:bg-github-gray-700'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {filteredBadges.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {filteredBadges.map(badge => (
              <button
                key={badge.id}
                onClick={() => handleInsert(badge)}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-github-gray-800 border border-github-gray-200 dark:border-github-gray-700 rounded hover:border-github-blue dark:hover:border-blue-400 transition-colors group text-left"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <img
                    src={`https://cdn.simpleicons.org/${badge.logo}/${badge.color}`}
                    alt={badge.name}
                    className="w-4 h-4 flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <span className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100 truncate">
                    {badge.name}
                  </span>
                  <span className="text-xs text-github-gray-500 dark:text-github-gray-400 capitalize">
                    {badge.category}
                  </span>
                </div>
                <Plus className="w-4 h-4 text-github-gray-400 group-hover:text-github-blue dark:group-hover:text-blue-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="w-8 h-8 text-github-gray-400 mb-2" />
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              No badges found
            </p>
            <p className="text-xs text-github-gray-500 dark:text-github-gray-500 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
