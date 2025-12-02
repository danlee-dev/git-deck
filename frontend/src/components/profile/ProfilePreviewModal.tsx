'use client';

import { X, Github, FileText, Calendar, Linkedin, Twitter, Instagram, Youtube, Globe, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { MyPageProfile } from '@/types/blog';

interface ProfilePreviewModalProps {
  profile: MyPageProfile;
  onClose: () => void;
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

export default function ProfilePreviewModal({ profile, onClose }: ProfilePreviewModalProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Profile Preview
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="p-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            This is how your profile appears to other users
          </p>

          {/* Profile Card */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            {/* Header Row */}
            <div className="flex items-start gap-4 mb-4">
              {/* Avatar */}
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700"
                />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-xl text-gray-500 dark:text-gray-400 font-medium">
                    {profile.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {profile.github_username || profile.username}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  @{profile.username}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-gray-100">{profile.stats.followers_count}</strong> followers
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <strong className="text-gray-900 dark:text-gray-100">{profile.stats.following_count}</strong> following
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    <FileText className="w-3.5 h-3.5 inline mr-0.5" />
                    {profile.stats.total_posts} posts
                  </span>
                </div>
              </div>
            </div>

            {/* Bio */}
            {profile.bio ? (
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                {profile.bio}
              </p>
            ) : (
              <p className="text-sm text-gray-400 dark:text-gray-500 italic mb-4">
                No bio
              </p>
            )}

            {/* Links */}
            <div className="flex flex-wrap gap-2 mb-4">
              {/* GitHub Badge */}
              {profile.is_github_connected && profile.github_username && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${PLATFORM_STYLES.github}`}>
                  <Github className="w-3.5 h-3.5" />
                  {profile.github_username}
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </span>
              )}

              {/* Social Links */}
              {profile.social_links?.map((link, index) => {
                const platform = link.platform.toLowerCase();
                const icon = PLATFORM_ICONS[platform] || PLATFORM_ICONS.other;
                const style = PLATFORM_STYLES[platform] || PLATFORM_STYLES.other;

                return (
                  <span
                    key={index}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full ${style}`}
                  >
                    {icon}
                    {link.label || link.platform}
                    <ExternalLink className="w-3 h-3 opacity-70" />
                  </span>
                );
              })}

              {!profile.is_github_connected && (!profile.social_links || profile.social_links.length === 0) && (
                <span className="text-xs text-gray-400 dark:text-gray-500 italic">No links added</span>
              )}
            </div>

            {/* Joined Date */}
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Joined {formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Close
          </button>
          <a
            href={`/blog/${profile.username}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-1.5"
          >
            Open in New Tab
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
