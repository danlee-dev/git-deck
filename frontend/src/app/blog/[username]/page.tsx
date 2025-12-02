'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Github, Users, FileText, Calendar, Home, User, Linkedin, Twitter, Instagram, Youtube, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { feedAPI } from '@/lib/api';
import { UserPublicProfile, BlogPostPublic } from '@/types/blog';
import { useAuthStore } from '@/store/authStore';
import FeedCard from '@/components/feed/FeedCard';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  github: <Github className="w-3.5 h-3.5" />,
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
  x: <Twitter className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  website: <Globe className="w-3.5 h-3.5" />,
  blog: <Globe className="w-3.5 h-3.5" />,
  other: <LinkIcon className="w-3.5 h-3.5" />,
};

const PLATFORM_STYLES: Record<string, string> = {
  github: 'bg-gray-900 text-white hover:bg-gray-800',
  linkedin: 'bg-[#0A66C2] text-white hover:bg-[#004182]',
  twitter: 'bg-black text-white hover:bg-gray-800',
  x: 'bg-black text-white hover:bg-gray-800',
  instagram: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white',
  youtube: 'bg-[#FF0000] text-white hover:bg-[#CC0000]',
  website: 'bg-emerald-600 text-white hover:bg-emerald-700',
  blog: 'bg-emerald-600 text-white hover:bg-emerald-700',
  other: 'bg-gray-600 text-white hover:bg-gray-500',
};

export default function UserBlogPage() {
  const params = useParams();
  const username = params.username as string;
  const { user, isAuthenticated } = useAuthStore();

  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [posts, setPosts] = useState<BlogPostPublic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [username]);

  const fetchData = async () => {
    try {
      const [profileRes, postsRes] = await Promise.all([
        feedAPI.getUserProfile(username),
        feedAPI.getUserPosts(username),
      ]);
      setProfile(profileRes.data);
      setPosts(postsRes.data);
      setIsFollowing(profileRes.data.is_following);

      // Check liked posts if authenticated
      if (isAuthenticated) {
        const likedSet = new Set<string>();
        for (const post of postsRes.data) {
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
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }

    if (!profile || isFollowLoading) return;

    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await feedAPI.unfollowUser(profile.id);
        setIsFollowing(false);
        setProfile(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count - 1
        } : null);
      } else {
        await feedAPI.followUser(profile.id);
        setIsFollowing(true);
        setProfile(prev => prev ? {
          ...prev,
          followers_count: prev.followers_count + 1
        } : null);
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setIsFollowLoading(false);
    }
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
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
          <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <User className="w-5 h-5" />
            <span className="font-medium">{username}</span>
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
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderNav()}
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="animate-pulse flex gap-6">
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {renderNav()}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              User not found
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This user may have been deleted or doesn't exist.
            </p>
            <Link href="/blog" className="text-blue-600 hover:underline">
              Back to feed
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.username === username;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {renderNav()}

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          {/* Header Row */}
          <div className="flex items-start gap-4 mb-4">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700"
              />
            ) : (
              <div className="w-20 h-20 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl text-gray-500 dark:text-gray-400 font-medium">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {profile.github_username || profile.username}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{profile.username}
                  </p>
                </div>

                {!isOwnProfile && (
                  <button
                    onClick={handleFollow}
                    disabled={isFollowLoading}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isFollowing
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span className="text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">{profile.followers_count}</strong> followers
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">{profile.following_count}</strong> following
                </span>
                <span className="text-gray-600 dark:text-gray-400">
                  <FileText className="w-4 h-4 inline mr-1" />
                  {profile.posts_count} posts
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {profile.bio}
            </p>
          )}

          {/* Links */}
          <div className="flex flex-wrap gap-2 mb-4">
            {/* GitHub Badge */}
            {profile.is_github_connected && profile.github_username && (
              <a
                href={`https://github.com/${profile.github_username}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${PLATFORM_STYLES.github}`}
              >
                <Github className="w-3.5 h-3.5" />
                {profile.github_username}
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>
            )}

            {/* Social Links */}
            {profile.social_links?.map((link, index) => {
              const platform = link.platform.toLowerCase();
              const icon = PLATFORM_ICONS[platform] || PLATFORM_ICONS.other;
              const style = PLATFORM_STYLES[platform] || PLATFORM_STYLES.other;

              return (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${style}`}
                >
                  {icon}
                  {link.label || link.platform}
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </a>
              );
            })}

            {!profile.is_github_connected && (!profile.social_links || profile.social_links.length === 0) && (
              <span className="text-sm text-gray-400 dark:text-gray-500 italic">No links</span>
            )}
          </div>

          {/* Joined Date */}
          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {formatDate(profile.created_at)}</span>
          </div>
        </div>

        {/* Posts Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Posts ({posts.length})
            </h2>
          </div>

          {posts.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">
                No published posts yet
              </p>
            </div>
          ) : (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts.map(post => (
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
      </div>
    </div>
  );
}
