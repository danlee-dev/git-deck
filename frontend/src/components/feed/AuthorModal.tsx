'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Github, Users, FileText, Calendar, Linkedin, Twitter, Instagram, Youtube, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { UserPublicProfile } from '@/types/blog';
import { feedAPI } from '@/lib/api';

interface AuthorModalProps {
  username: string;
  onClose: () => void;
  isAuthenticated?: boolean;
}

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

export default function AuthorModal({
  username,
  onClose,
  isAuthenticated = false,
}: AuthorModalProps) {
  const router = useRouter();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const fetchProfile = async () => {
    try {
      const response = await feedAPI.getUserProfile(username);
      setProfile(response.data);
      setIsFollowing(response.data.is_following);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      router.push('/login');
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

  const handleViewProfile = () => {
    router.push(`/blog/${username}`);
    onClose();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md mx-4 shadow-xl border border-gray-200 dark:border-gray-700"
        onClick={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        ) : profile ? (
          <div className="p-6">
            {/* Header with close button */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username}
                    className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-2xl text-gray-500 dark:text-gray-400 font-medium">
                      {profile.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {profile.github_username || profile.username}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    @{profile.username}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {profile.bio}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-6 text-sm mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <strong className="text-gray-900 dark:text-gray-100">{profile.followers_count}</strong>
                <span>followers</span>
              </button>
              <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
                <strong className="text-gray-900 dark:text-gray-100">{profile.following_count}</strong>
                <span>following</span>
              </button>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <FileText className="w-4 h-4" />
                <span>{profile.posts_count} posts</span>
              </div>
            </div>

            {/* Links Section */}
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
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
              </div>
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleFollow}
                disabled={isFollowLoading}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isFollowing
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
              <button
                onClick={handleViewProfile}
                className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                View Profile
              </button>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            User not found
          </div>
        )}
      </div>
    </div>
  );
}
