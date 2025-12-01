'use client';

import { Snippet } from './snippetData';
import { Plus } from 'lucide-react';

interface SnippetCardProps {
  snippet: Snippet;
  onInsert: (markdown: string) => void;
  username: string;
}

export default function SnippetCard({ snippet, onInsert, username }: SnippetCardProps) {
  const handleInsert = () => {
    const markdown = typeof snippet.markdown === 'function'
      ? snippet.markdown(username)
      : snippet.markdown;
    onInsert(markdown);
  };

  return (
    <button
      onClick={handleInsert}
      className="w-full p-3 text-left bg-white dark:bg-github-gray-800 border border-github-gray-200 dark:border-github-gray-700 rounded-md hover:border-github-blue dark:hover:border-blue-400 transition-colors group"
    >
      <div className="flex items-start gap-2">
        <snippet.icon className="w-4 h-4 text-github-gray-500 dark:text-github-gray-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100 truncate">
              {snippet.name}
            </h4>
            <Plus className="w-4 h-4 text-github-gray-400 group-hover:text-github-blue dark:group-hover:text-blue-400 flex-shrink-0" />
          </div>
          <p className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-1">
            {snippet.description}
          </p>
        </div>
      </div>
    </button>
  );
}
