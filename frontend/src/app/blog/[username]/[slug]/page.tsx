'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Heart, Eye, Share2, Calendar, Clock, Home, FileText, Edit2 } from 'lucide-react';
import { feedAPI, getImageUrl } from '@/lib/api';
import { BlogPostDetailPublic } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';
import AuthorModal from '@/components/feed/AuthorModal';
import CommentSection from '@/components/comments/CommentSection';

// Dynamic import for markdown renderer
const MarkdownRenderer = dynamic(
  () => import('@/components/blog-editor/MarkdownRenderer'),
  { ssr: false }
);

export default function PublicPostPage() {
  const params = useParams();
  const username = params.username as string;
  const slug = params.slug as string;
  const { isAuthenticated, user } = useAuthStore();

  const [post, setPost] = useState<BlogPostDetailPublic | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [username, slug]);

  const fetchPost = async () => {
    try {
      const response = await feedAPI.getUserPost(username, slug);
      setPost(response.data);
      setLikesCount(response.data.likes_count);

      // Check if liked
      if (isAuthenticated) {
        try {
          const likedRes = await feedAPI.checkLiked(response.data.id);
          setIsLiked(likedRes.data.liked);
        } catch {
          // Ignore errors
        }
      }
    } catch (error) {
      console.error('Failed to fetch post:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (!post || isLiking) return;

    setIsLiking(true);
    try {
      if (isLiked) {
        await feedAPI.unlikePost(post.id);
        setIsLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
      } else {
        await feedAPI.likePost(post.id);
        setIsLiked(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;

    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.excerpt || '',
          url,
        });
      } catch (error) {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const estimateReadTime = (content: string) => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  const renderNav = () => (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/blog"
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Feed</span>
          </Link>
          <span className="text-gray-300 dark:text-gray-600">/</span>
          <Link
            href={`/blog/${username}`}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium"
          >
            {username}
          </Link>
        </div>
        <Link
          href="/"
          className="text-sm font-semibold text-gray-900 dark:text-gray-100"
        >
          GitDeck
        </Link>
      </div>
    </nav>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderNav()}
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-64 bg-gray-200 dark:bg-gray-800 rounded-xl" />
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderNav()}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <FileText className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Post not found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This post may have been deleted or doesn't exist.
            </p>
            <Link
              href={`/blog/${username}`}
              className="text-blue-600 hover:underline"
            >
              View {username}'s profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/blog"
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            >
              <Home className="w-5 h-5" />
              <span className="font-medium">Feed</span>
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <Link
              href={`/blog/${username}`}
              className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 font-medium truncate max-w-[100px]"
            >
              {username}
            </Link>
            <span className="text-gray-300 dark:text-gray-600">/</span>
            <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
              <FileText className="w-5 h-5" />
              <span className="font-medium">Post</span>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-gray-900 dark:text-gray-100"
          >
            GitDeck
          </Link>
        </div>
      </nav>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="w-full h-64 md:h-96 relative">
          <img
            src={getImageUrl(post.cover_image) || ''}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-900/50" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {/* Article */}
        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {post.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Title */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100">
                {post.title}
              </h1>
              {user?.username === username && (
                <Link
                  href={`/blog/edit/${post.id}`}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Link>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
              {/* Author */}
              <button
                onClick={() => setShowAuthorModal(true)}
                className="flex items-center gap-2 hover:text-blue-600 dark:hover:text-blue-400"
              >
                {post.author.avatar_url ? (
                  <img
                    src={post.author.avatar_url}
                    alt={post.author.username}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                    <span className="text-xs text-white font-medium">
                      {post.author.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <span className="font-medium">
                  {post.author.github_username || post.author.username}
                </span>
              </button>

              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(post.published_at || post.created_at)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{estimateReadTime(post.content_md)}</span>
              </div>

              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                <span>{post.view_count} views</span>
              </div>
            </div>

            {/* Content */}
            <div className="prose dark:prose-invert max-w-none">
              {post.content_blocks && post.content_blocks.length > 0 ? (
                <MarkdownRenderer content={post.content_md} />
              ) : (
                <MarkdownRenderer content={post.content_md} />
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 md:px-8 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleLike}
                  disabled={isLiking}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                    isLiked
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </button>

                <button
                  onClick={handleShare}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>

              <Link
                href={`/blog/${username}`}
                className="text-sm text-blue-600 hover:underline"
              >
                More from {post.author.github_username || post.author.username}
              </Link>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <CommentSection
          postId={post.id}
          commentsCount={post.comments_count || 0}
          isAuthenticated={isAuthenticated}
          currentUserId={user?.id}
        />
      </div>

      {/* Author Modal */}
      {showAuthorModal && (
        <AuthorModal
          username={username}
          onClose={() => setShowAuthorModal(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </div>
  );
}
