'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Calendar,
  User,
  Tag,
  Github,
  X,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { BlogPost, GitHubRepo, BlogFolder } from '@/types/blog';

// Notion-style tag colors
const TAG_COLORS = [
  { name: 'gray', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-600 dark:text-gray-300', dot: 'bg-gray-400' },
  { name: 'brown', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
  { name: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  { name: 'yellow', bg: 'bg-yellow-50 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  { name: 'green', bg: 'bg-green-50 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  { name: 'blue', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  { name: 'purple', bg: 'bg-purple-50 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
  { name: 'pink', bg: 'bg-pink-50 dark:bg-pink-900/30', text: 'text-pink-700 dark:text-pink-300', dot: 'bg-pink-500' },
  { name: 'red', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
];

// Get consistent color for a tag based on hash
function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

interface PostPropertiesProps {
  post: BlogPost;
  folders: BlogFolder[];
  repos: GitHubRepo[];
  allTags: string[]; // All available tags from the system
  authorName?: string;
  onUpdate: (updates: Partial<BlogPost>) => void;
  onRepoChange?: (repoId: string | null, repoName: string | null) => void;
}

export default function PostProperties({
  post,
  folders,
  repos,
  allTags = [],
  authorName = 'Anonymous',
  onUpdate,
  onRepoChange,
}: PostPropertiesProps) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [showRepoMenu, setShowRepoMenu] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const repoDropdownRef = useRef<HTMLDivElement>(null);

  const tags = post.tags || [];
  const currentRepo = repos.find(r => r.id === post.github_repo_id);

  // Filter available tags based on search
  const filteredTags = allTags.filter(
    tag => tag.toLowerCase().includes(tagSearch.toLowerCase()) && !tags.includes(tag)
  );

  // Check if search term is a new tag
  const isNewTag = tagSearch.trim() &&
    !allTags.some(t => t.toLowerCase() === tagSearch.toLowerCase()) &&
    !tags.some(t => t.toLowerCase() === tagSearch.toLowerCase());

  useEffect(() => {
    if (showTagDropdown && tagInputRef.current) {
      tagInputRef.current.focus();
    }
  }, [showTagDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target as Node)) {
        setShowTagDropdown(false);
        setTagSearch('');
      }
      if (repoDropdownRef.current && !repoDropdownRef.current.contains(e.target as Node)) {
        setShowRepoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close other dropdowns when opening one
  const openTagDropdown = () => {
    setShowRepoMenu(false);
    setShowTagDropdown(true);
  };

  const openRepoMenu = () => {
    setShowTagDropdown(false);
    setTagSearch('');
    setShowRepoMenu(true);
  };

  const handleAddTag = (tag: string) => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      onUpdate({ tags: [...tags, tag.trim()] });
    }
    setTagSearch('');
  };

  const handleRemoveTag = (tagToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ tags: tags.filter(t => t !== tagToRemove) });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagSearch.trim()) {
      e.preventDefault();
      handleAddTag(tagSearch.trim());
    } else if (e.key === 'Escape') {
      setShowTagDropdown(false);
      setTagSearch('');
    }
  };

  const handleRepoSelect = (repo: GitHubRepo | null) => {
    const repoId = repo?.id || null;
    const repoName = repo?.name || null;
    onUpdate({ github_repo_id: repoId });
    onRepoChange?.(repoId, repoName);
    setShowRepoMenu(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
      <div className="space-y-1">
        {/* Created At */}
        <div className="flex items-center gap-3 py-1 group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded -mx-2 px-2">
          <div className="flex items-center gap-2 w-28 text-sm text-gray-500 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span>Created</span>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            {formatDate(post.created_at)}
          </div>
        </div>

        {/* Author */}
        <div className="flex items-center gap-3 py-1 group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded -mx-2 px-2">
          <div className="flex items-center gap-2 w-28 text-sm text-gray-500 dark:text-gray-400">
            <User className="w-4 h-4" />
            <span>Author</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
              <span className="text-xs text-white font-medium">
                {authorName.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-gray-700 dark:text-gray-300">{authorName}</span>
          </div>
        </div>

        {/* Tags - Notion style */}
        <div className="flex items-start gap-3 py-1 group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded -mx-2 px-2">
          <div className="flex items-center gap-2 w-28 text-sm text-gray-500 dark:text-gray-400 pt-0.5">
            <Tag className="w-4 h-4" />
            <span>Tags</span>
          </div>
          <div className="flex-1 relative" ref={tagDropdownRef}>
            {/* Selected Tags Display */}
            <div
              className="flex flex-wrap items-center gap-1 min-h-[26px] cursor-pointer"
              onClick={openTagDropdown}
            >
              {tags.map(tag => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${color.bg} ${color.text}`}
                  >
                    {tag}
                    <button
                      onClick={(e) => handleRemoveTag(tag, e)}
                      className="hover:opacity-70 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {tags.length === 0 && (
                <span className="text-sm text-gray-400">Empty</span>
              )}
            </div>

            {/* Tag Dropdown */}
            {showTagDropdown && (
              <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <input
                    ref={tagInputRef}
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search or create tag..."
                    className="w-full px-2 py-1.5 text-sm bg-transparent border-0 outline-none placeholder-gray-400"
                  />
                </div>

                {/* Tag Options */}
                <div className="max-h-60 overflow-y-auto py-1">
                  {/* Create new tag option */}
                  {isNewTag && (
                    <button
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 text-left"
                      onClick={() => handleAddTag(tagSearch.trim())}
                    >
                      <span className="text-gray-500">Create</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTagColor(tagSearch).bg} ${getTagColor(tagSearch).text}`}>
                        {tagSearch.trim()}
                      </span>
                    </button>
                  )}

                  {/* Existing tags */}
                  {filteredTags.length > 0 && (
                    <div className="px-2 py-1 text-xs text-gray-500 dark:text-gray-400">
                      Select or create
                    </div>
                  )}
                  {filteredTags.map(tag => {
                    const color = getTagColor(tag);
                    return (
                      <button
                        key={tag}
                        className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => handleAddTag(tag)}
                      >
                        <GripVertical className="w-3 h-3 text-gray-300" />
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${color.bg} ${color.text}`}>
                          {tag}
                        </span>
                      </button>
                    );
                  })}

                  {filteredTags.length === 0 && !isNewTag && tagSearch && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No tags found
                    </div>
                  )}

                  {filteredTags.length === 0 && !tagSearch && allTags.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      Type to create a tag
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* GitHub Repo */}
        <div className="flex items-center gap-3 py-1 group hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded -mx-2 px-2">
          <div className="flex items-center gap-2 w-28 text-sm text-gray-500 dark:text-gray-400">
            <Github className="w-4 h-4" />
            <span>Repository</span>
          </div>
          <div className="relative" ref={repoDropdownRef}>
            <button
              onClick={openRepoMenu}
              className="flex items-center gap-1 px-2 py-0.5 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <span className={currentRepo ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'}>
                {currentRepo?.full_name || 'None'}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400" />
            </button>

            {showRepoMenu && (
              <div className="absolute left-0 top-full mt-1 w-72 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20 max-h-60 overflow-y-auto">
                <button
                  className="w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
                  onClick={() => handleRepoSelect(null)}
                >
                  None
                </button>
                {repos.map(repo => (
                  <button
                    key={repo.id}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700 ${
                      currentRepo?.id === repo.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                    onClick={() => handleRepoSelect(repo)}
                  >
                    <div className="font-medium text-gray-800 dark:text-gray-200">{repo.full_name}</div>
                    {repo.description && (
                      <div className="text-xs text-gray-500 truncate mt-0.5">{repo.description}</div>
                    )}
                  </button>
                ))}
                {repos.length === 0 && (
                  <div className="px-3 py-3 text-sm text-gray-500">
                    <p className="mb-2">No repositories found</p>
                    <a
                      href="/github"
                      className="text-blue-500 hover:text-blue-600 hover:underline"
                    >
                      Go to GitHub page to sync repositories
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
