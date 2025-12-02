'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useBlogStore } from '@/store/blogStore';
import { useAuthStore } from '@/store/authStore';
import { feedAPI } from '@/lib/api';
import { BlogPostPublic } from '@/types/blog';
import FeedCard from '@/components/feed/FeedCard';
import {
  FileText,
  FolderPlus,
  Plus,
  TrendingUp,
  Clock,
  Heart,
  Loader2,
} from 'lucide-react';

type FilterType = 'recent' | 'popular' | 'liked';

export default function BlogPage() {
  const router = useRouter();
  const { posts, createPost, createFolder, fetchPosts, fetchFolders } = useBlogStore();
  const { user, isAuthenticated } = useAuthStore();

  const [feedPosts, setFeedPosts] = useState<BlogPostPublic[]>([]);
  const [filter, setFilter] = useState<FilterType>('recent');
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPosts();
    fetchFolders();
    fetchFeed('recent');
  }, [fetchPosts, fetchFolders]);

  useEffect(() => {
    fetchFeed(filter);
  }, [filter, isAuthenticated]);

  const fetchFeed = async (sortBy: FilterType) => {
    setIsLoadingFeed(true);
    try {
      let response;
      if (sortBy === 'liked' && isAuthenticated) {
        response = await feedAPI.getLikedPosts({ limit: 20 });
      } else {
        const sortParam = sortBy === 'liked' ? 'recent' : sortBy;
        response = await feedAPI.getFeed({ sort_by: sortParam, limit: 20 });
      }
      setFeedPosts(response.data);

      // Check liked posts if authenticated
      if (isAuthenticated) {
        const likedSet = new Set<string>();
        for (const post of response.data) {
          try {
            const likedRes = await feedAPI.checkLiked(post.id);
            if (likedRes.data.liked) {
              likedSet.add(post.id);
            }
          } catch {
            // Ignore errors
          }
        }
        setLikedPosts(likedSet);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const handleCreatePost = async () => {
    const newPost = await createPost({
      title: 'Untitled',
      content_md: '',
      content_blocks: [],
      folder_id: null,
      status: 'draft',
    });
    router.push(`/blog/edit/${newPost.id}`);
  };

  const handleCreateFolder = async () => {
    const name = prompt('Enter folder name:');
    if (!name) return;
    await createFolder(name, null);
  };

  const handleLikeChange = (postId: string, liked: boolean) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (liked) {
        next.add(postId);
      } else {
        next.delete(postId);
      }
      return next;
    });
  };

  const recentPosts = posts.slice(0, 5);

  const filterButtons: { key: FilterType; label: string; icon: React.ReactNode }[] = [
    { key: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
    { key: 'popular', label: 'Popular', icon: <TrendingUp className="w-4 h-4" /> },
    { key: 'liked', label: 'Liked', icon: <Heart className="w-4 h-4" /> },
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Discover
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Explore posts from the community
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 mb-6 border-b border-gray-200 dark:border-gray-700 pb-4">
              {filterButtons.map(btn => (
                <button
                  key={btn.key}
                  onClick={() => setFilter(btn.key)}
                  disabled={btn.key === 'liked' && !isAuthenticated}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    filter === btn.key
                      ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${btn.key === 'liked' && !isAuthenticated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {btn.icon}
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Feed */}
            {isLoadingFeed ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            ) : feedPosts.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  {filter === 'liked'
                    ? "You haven't liked any posts yet"
                    : 'No posts found'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {feedPosts.filter(post => post.author.id !== user?.id).map(post => (
                  <FeedCard
                    key={post.id}
                    post={post}
                    isLiked={likedPosts.has(post.id)}
                    onLikeChange={handleLikeChange}
                    isAuthenticated={isAuthenticated}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block w-80 flex-shrink-0">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={handleCreatePost}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  New Post
                </button>
                <button
                  onClick={handleCreateFolder}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <FolderPlus className="w-4 h-4" />
                  New Folder
                </button>
              </div>
            </div>

            {/* My Recent Posts */}
            {recentPosts.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    My Recent Posts
                  </h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentPosts.map(post => (
                    <button
                      key={post.id}
                      onClick={() => router.push(`/blog/edit/${post.id}`)}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
                    >
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                          {post.title}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {new Date(post.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          post.status === 'published'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {post.status === 'published' ? 'Published' : 'Draft'}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state for my posts */}
            {posts.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center">
                <FileText className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                  Start writing your first post
                </p>
                <button
                  onClick={handleCreatePost}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Create a post
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
