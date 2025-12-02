'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Heart, Eye, Share2, MessageCircle } from 'lucide-react';
import { BlogPostPublic } from '@/types/blog';
import { feedAPI, getImageUrl } from '@/lib/api';
import AuthorModal from './AuthorModal';

interface FeedCardProps {
  post: BlogPostPublic;
  isLiked?: boolean;
  onLikeChange?: (postId: string, liked: boolean) => void;
  isAuthenticated?: boolean;
}

export default function FeedCard({
  post,
  isLiked = false,
  onLikeChange,
  isAuthenticated = false,
}: FeedCardProps) {
  const [liked, setLiked] = useState(isLiked);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiking, setIsLiking] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (isLiking) return;

    setIsLiking(true);
    try {
      if (liked) {
        await feedAPI.unlikePost(post.id);
        setLiked(false);
        setLikesCount(prev => Math.max(0, prev - 1));
        onLikeChange?.(post.id, false);
      } else {
        await feedAPI.likePost(post.id);
        setLiked(true);
        setLikesCount(prev => prev + 1);
        onLikeChange?.(post.id, true);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const url = `${window.location.origin}/blog/${post.author.username}/${post.slug}`;

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

  const handleAuthorClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowAuthorModal(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <>
      <Link
        href={`/blog/${post.author.username}/${post.slug}`}
        className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
      >
        {/* Cover Image */}
        {post.cover_image ? (
          <div className="aspect-[16/9] w-full overflow-hidden">
            <img
              src={getImageUrl(post.cover_image) || ''}
              alt={post.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-[16/9] w-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
            <span className="text-2xl text-gray-300 dark:text-gray-600">
              {post.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}

        {/* Content */}
        <div className="p-3">
          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1.5">
              {post.tags.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded"
                >
                  {tag}
                </span>
              ))}
              {post.tags.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{post.tags.length - 2}
                </span>
              )}
            </div>
          )}

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2">
            {post.title}
          </h3>

          {/* Author & Stats */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5" onClick={handleAuthorClick}>
              {post.author.avatar_url ? (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.username}
                  className="w-5 h-5 rounded-full cursor-pointer"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center cursor-pointer">
                  <span className="text-[10px] text-white font-medium">
                    {post.author.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 cursor-pointer truncate max-w-[80px]">
                {post.author.github_username || post.author.username}
              </span>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-0.5 text-xs transition-colors ${
                  liked
                    ? 'text-red-500'
                    : 'text-gray-400 hover:text-red-500'
                }`}
                disabled={isLiking}
              >
                <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-current' : ''}`} />
                <span>{likesCount}</span>
              </button>

              <div className="flex items-center gap-0.5 text-xs text-gray-400">
                <Eye className="w-3.5 h-3.5" />
                <span>{post.view_count}</span>
              </div>

              <button
                onClick={handleShare}
                className="text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Author Modal */}
      {showAuthorModal && (
        <AuthorModal
          username={post.author.username}
          onClose={() => setShowAuthorModal(false)}
          isAuthenticated={isAuthenticated}
        />
      )}
    </>
  );
}
