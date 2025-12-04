'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { blogAPI } from '@/lib/api';
import { useBlogStore } from '@/store/blogStore';
import { useAuthStore } from '@/store/authStore';
import {
  Save,
  Cloud,
  CloudOff,
  MoreHorizontal,
  ChevronDown,
  Globe,
  Lock,
  Trash2,
  Copy,
} from 'lucide-react';
import { PartialBlock } from '@blocknote/core';
import { BlogPost } from '@/types/blog';
import PostProperties from '@/components/blog-editor/PostProperties';
import CoverImage from '@/components/blog-editor/CoverImage';
import EditorErrorBoundary from '@/components/blog-editor/EditorErrorBoundary';

// Dynamic import for NotionEditor to avoid SSR issues
const NotionEditor = dynamic(
  () => import('@/components/blog-editor/NotionEditor'),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

function EditorSkeleton() {
  return (
    <div className="p-6 space-y-4 animate-pulse">
      <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
    </div>
  );
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { setCurrentPost, setIsDirty, isDirty, repos, folders, fetchRepos, fetchFolders, getAllTags, linkPostToRepo, fetchPosts } = useBlogStore();
  const { user } = useAuthStore();
  const allTags = getAllTags();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [contentBlocks, setContentBlocks] = useState<PartialBlock[]>([]);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [githubRepoId, setGithubRepoId] = useState<string | null>(null);
  const [folderId, setFolderId] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [createdAt, setCreatedAt] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [error, setError] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const titleInputRef = useRef<HTMLInputElement>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const [editorKey, setEditorKey] = useState(0);

  // Fetch post data
  useEffect(() => {
    fetchPost();
    fetchRepos();
    fetchFolders();
    fetchPosts(); // Fetch all posts for getAllTags
  }, [postId, fetchRepos, fetchFolders, fetchPosts]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(e.target as Node)) {
        setShowStatusMenu(false);
      }
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchPost = async () => {
    try {
      const response = await blogAPI.posts.get(postId);
      const post = response.data;
      setTitle(post.title);
      setContent(post.content_md);
      setContentBlocks(post.content_blocks || []);
      setStatus(post.status);
      setGithubRepoId(post.github_repo_id);
      setFolderId(post.folder_id);
      setTags(post.tags || []);
      setCoverImage(post.cover_image);
      setCreatedAt(post.created_at);
      setCurrentPost(post);
    } catch (error) {
      console.error('Failed to fetch post:', error);
      setError('포스트를 불러오지 못했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-save with debounce
  const autoSave = useCallback(async () => {
    if (!isDirty) return;

    setIsSaving(true);
    try {
      await blogAPI.posts.update(postId, {
        title,
        content_md: content,
        content_blocks: contentBlocks,
        status,
        github_repo_id: githubRepoId,
        folder_id: folderId,
        tags,
        cover_image: coverImage,
      });
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsSaving(false);
    }
  }, [postId, title, content, contentBlocks, status, githubRepoId, folderId, tags, coverImage, isDirty, setIsDirty]);

  // Schedule auto-save on changes
  useEffect(() => {
    if (!isDirty) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(autoSave, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [isDirty, autoSave]);

  // Handle title change
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
    setIsDirty(true);
  };

  // Handle editor content change
  const handleEditorChange = (blocks: PartialBlock[], markdown: string) => {
    setContentBlocks(blocks);
    setContent(markdown);
    setIsDirty(true);
  };

  // Handle manual save
  const handleSave = async () => {
    setIsSaving(true);
    try {
      await blogAPI.posts.update(postId, {
        title,
        content_md: content,
        content_blocks: contentBlocks,
        status,
        github_repo_id: githubRepoId,
        folder_id: folderId,
        tags,
        cover_image: coverImage,
      });
      setLastSaved(new Date());
      setIsDirty(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || '저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cover image change
  const handleCoverImageChange = (url: string | null) => {
    setCoverImage(url);
    setIsDirty(true);
  };

  // Handle property updates from PostProperties component
  const handlePropertyUpdate = (updates: Partial<BlogPost>) => {
    if ('tags' in updates) {
      setTags(updates.tags || []);
      setIsDirty(true);
    }
    // github_repo_id is handled by handleRepoChange
  };

  // Handle repository change - auto creates folder and moves post
  const handleRepoChange = async (repoId: string | null, repoName: string | null) => {
    try {
      await linkPostToRepo(postId, repoId, repoName);
      setGithubRepoId(repoId);
      // Refresh folders to show new GitHub folder structure
      await fetchFolders();
      // Get updated folder_id from the store
      const updatedPost = useBlogStore.getState().posts.find(p => p.id === postId);
      if (updatedPost) {
        setFolderId(updatedPost.folder_id);
      }
    } catch (error) {
      console.error('Failed to link repo:', error);
      setError('저장소 연결에 실패했습니다');
    }
  };

  // Handle status change
  const handleStatusChange = async (newStatus: 'draft' | 'published') => {
    setStatus(newStatus);
    setShowStatusMenu(false);
    setIsDirty(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('이 포스트를 영구적으로 삭제하시겠습니까?')) return;

    try {
      await blogAPI.posts.delete(postId);
      router.push('/blog');
    } catch (error) {
      console.error('Failed to delete:', error);
    }
  };

  // Handle duplicate
  const handleDuplicate = async () => {
    try {
      const newPost = await blogAPI.posts.create({
        title: `${title} (복사본)`,
        slug: `${title.toLowerCase().replace(/\s+/g, '-')}-copy-${Date.now()}`,
        content_md: content,
        content_blocks: contentBlocks,
        status: 'draft',
      });
      router.push(`/blog/edit/${newPost.data.id}`);
    } catch (error) {
      console.error('Failed to duplicate:', error);
    }
    setShowMenu(false);
  };

  // Format last saved time
  const formatLastSaved = () => {
    if (!lastSaved) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - lastSaved.getTime()) / 1000);
    if (diff < 60) return '방금 저장됨';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전 저장됨`;
    return `${lastSaved.toLocaleTimeString()}에 저장됨`;
  };

  if (isLoading) {
    return <EditorSkeleton />;
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-200 dark:border-gray-800 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Save status */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {isSaving ? (
                <>
                  <Cloud className="w-4 h-4 animate-pulse" />
                  <span>저장 중...</span>
                </>
              ) : isDirty ? (
                <>
                  <CloudOff className="w-4 h-4" />
                  <span>저장되지 않은 변경사항</span>
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 text-green-500" />
                  <span>{formatLastSaved()}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status selector */}
            <div className="relative" ref={statusMenuRef}>
              <button
                className="flex items-center gap-2 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => {
                  setShowMenu(false);
                  setShowStatusMenu(!showStatusMenu);
                }}
              >
                {status === 'published' ? (
                  <>
                    <Globe className="w-4 h-4 text-green-500" />
                    <span>게시됨</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4 text-gray-500" />
                    <span>임시저장</span>
                  </>
                )}
                <ChevronDown className="w-4 h-4" />
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleStatusChange('draft')}
                  >
                    <Lock className="w-4 h-4" />
                    임시저장
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => handleStatusChange('published')}
                  >
                    <Globe className="w-4 h-4" />
                    게시
                  </button>
                </div>
              )}
            </div>

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              저장
            </button>

            {/* More menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md"
                onClick={() => {
                  setShowStatusMenu(false);
                  setShowMenu(!showMenu);
                }}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              {showMenu && (
                <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10">
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={handleDuplicate}
                  >
                    <Copy className="w-4 h-4" />
                    복제
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={handleDelete}
                  >
                    <Trash2 className="w-4 h-4" />
                    삭제
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Editor area */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Cover Image */}
          <CoverImage
            coverImage={coverImage}
            onUpdate={handleCoverImageChange}
          />

          {/* Title */}
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={handleTitleChange}
            placeholder="제목 없음"
            className="w-full text-4xl font-bold bg-transparent border-0 outline-none placeholder-gray-400 dark:placeholder-gray-600 text-gray-900 dark:text-gray-100 mb-4"
          />

          {/* Post Properties - Notion style metadata */}
          <PostProperties
            post={{
              id: postId,
              user_id: user?.id || '',
              series_id: null,
              folder_id: folderId,
              title,
              slug: '',
              content_md: content,
              content_blocks: contentBlocks,
              excerpt: null,
              cover_image: coverImage,
              tags,
              status,
              published_at: null,
              view_count: 0,
              likes_count: 0,
              github_repo_id: githubRepoId,
              github_path: null,
              github_sha: null,
              created_at: createdAt,
              updated_at: '',
            }}
            folders={folders}
            repos={repos}
            allTags={allTags}
            authorName={user?.github_username || user?.email || 'Anonymous'}
            onUpdate={handlePropertyUpdate}
            onRepoChange={handleRepoChange}
          />

          {/* NotionEditor */}
          <EditorErrorBoundary onReset={() => setEditorKey(k => k + 1)}>
            <NotionEditor
              key={editorKey}
              initialContent={contentBlocks.length > 0 ? contentBlocks : undefined}
              onChange={handleEditorChange}
            />
          </EditorErrorBoundary>
        </div>
      </div>
    </div>
  );
}
