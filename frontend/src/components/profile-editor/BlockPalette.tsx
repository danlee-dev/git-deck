'use client';

import { useState } from 'react';
import { BLOCK_CATEGORIES, BlockTemplate } from '@/types/profile-blocks';
import { useProfileEditorStore } from '@/store/profileEditorStore';
import { ChevronDown, ChevronRight } from 'lucide-react';

export default function BlockPalette() {
  const { setMarkdownContent, markdownContent } = useProfileEditorStore();
  const [expandedCategories, setExpandedCategories] = useState<string[]>(
    BLOCK_CATEGORIES.map((cat) => cat.id)
  );

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAddBlock = (template: BlockTemplate) => {
    // Append block markdown to content
    const blockMarkdown = template.defaultProperties?.markdown || `\n<!-- ${template.type} block -->\n`;
    setMarkdownContent(markdownContent + blockMarkdown);
  };

  return (
    <div className="card bg-white dark:bg-github-gray-800 border-github-gray-200 dark:border-github-gray-700 sticky top-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-github-gray-900 dark:text-github-gray-100">
          Block Palette
        </h3>
        <p className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-1">
          Click to add blocks to your profile
        </p>
      </div>

      <div className="space-y-2">
        {BLOCK_CATEGORIES.map((category) => {
          const isExpanded = expandedCategories.includes(category.id);

          return (
            <div key={category.id} className="border-b border-github-gray-200 dark:border-github-gray-700 last:border-b-0 pb-2">
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between py-2 text-left hover:bg-github-gray-50 dark:hover:bg-github-gray-700/50 rounded px-2 transition-colors"
              >
                <span className="font-medium text-sm text-github-gray-900 dark:text-github-gray-100">
                  {category.name}
                </span>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-github-gray-500 dark:text-github-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-github-gray-500 dark:text-github-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-1 mt-1">
                  {category.blocks.map((block) => (
                    <button
                      key={block.type}
                      onClick={() => handleAddBlock(block)}
                      className="w-full text-left p-3 rounded-md bg-github-gray-50 dark:bg-github-gray-900 hover:bg-github-gray-100 dark:hover:bg-github-gray-700 transition-colors group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-github-gray-200 dark:bg-github-gray-800 flex items-center justify-center flex-shrink-0 text-sm font-medium text-github-gray-700 dark:text-github-gray-300 group-hover:bg-github-blue group-hover:text-white transition-colors">
                          {block.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm text-github-gray-900 dark:text-github-gray-100">
                            {block.name}
                          </div>
                          <div className="text-xs text-github-gray-600 dark:text-github-gray-400 mt-0.5">
                            {block.description}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-github-gray-200 dark:border-github-gray-700">
        <p className="text-xs text-github-gray-500 dark:text-github-gray-500 text-center">
          Drag blocks to reorder them in the preview
        </p>
      </div>
    </div>
  );
}
