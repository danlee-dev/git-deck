'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Github,
  Linkedin,
  Twitter,
  Instagram,
  Youtube,
  Globe,
  Link as LinkIcon,
  Plus,
  X,
  Loader2,
  ExternalLink,
  Eye,
} from 'lucide-react';
import { mypageAPI, feedAPI } from '@/lib/api';
import { MyPageProfile, SocialLink, BlogPostPublic, FollowerUser, StatsHistory } from '@/types/blog';
import FeedCard from '@/components/feed/FeedCard';
import ProfilePreviewModal from '@/components/profile/ProfilePreviewModal';
import StatsCharts from '@/components/charts/StatsCharts';

type TabType = 'posts' | 'liked';

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  github: <Github className="w-3.5 h-3.5" />,
  linkedin: <Linkedin className="w-3.5 h-3.5" />,
  twitter: <Twitter className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  youtube: <Youtube className="w-3.5 h-3.5" />,
  website: <Globe className="w-3.5 h-3.5" />,
  other: <LinkIcon className="w-3.5 h-3.5" />,
};

const PLATFORM_STYLES: Record<string, string> = {
  github: 'bg-gray-900 text-white hover:bg-gray-800',
  linkedin: 'bg-[#0A66C2] text-white hover:bg-[#004182]',
  twitter: 'bg-black text-white hover:bg-gray-800',
  instagram: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F77737] text-white',
  youtube: 'bg-[#FF0000] text-white hover:bg-[#CC0000]',
  website: 'bg-emerald-600 text-white hover:bg-emerald-700',
  other: 'bg-gray-600 text-white hover:bg-gray-500',
};

function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('github.com')) return 'github';
  if (lowerUrl.includes('linkedin.com')) return 'linkedin';
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'twitter';
  if (lowerUrl.includes('instagram.com')) return 'instagram';
  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) return 'youtube';
  return 'website';
}

export default function MyPage() {
  const [profile, setProfile] = useState<MyPageProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('posts');

  // Posts state
  const [myPosts, setMyPosts] = useState<BlogPostPublic[]>([]);
  const [likedPosts, setLikedPosts] = useState<BlogPostPublic[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Edit states
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bioValue, setBioValue] = useState('');
  const [isSavingBio, setIsSavingBio] = useState(false);

  // Social links state
  const [isEditingSocialLinks, setIsEditingSocialLinks] = useState(false);
  const [socialLinksValue, setSocialLinksValue] = useState<SocialLink[]>([]);
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [isSavingSocialLinks, setIsSavingSocialLinks] = useState(false);

  // Followers modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [following, setFollowing] = useState<FollowerUser[]>([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  // Stats history for charts
  const [statsHistory, setStatsHistory] = useState<StatsHistory | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Profile preview modal
  const [showProfilePreview, setShowProfilePreview] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchStatsHistory();
  }, []);

  useEffect(() => {
    if (profile) {
      if (activeTab === 'posts') {
        fetchMyPosts();
      } else {
        fetchLikedPosts();
      }
    }
  }, [activeTab, profile]);

  const fetchProfile = async () => {
    try {
      const response = await mypageAPI.getMyPage();
      setProfile(response.data);
      setBioValue(response.data.bio || '');
      setSocialLinksValue(response.data.social_links || []);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await mypageAPI.getMyPosts({ status: 'published', limit: 50 });
      setMyPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchLikedPosts = async () => {
    setIsLoadingPosts(true);
    try {
      const response = await mypageAPI.getLikedPosts({ limit: 50 });
      setLikedPosts(response.data);
    } catch (error) {
      console.error('Failed to fetch liked posts:', error);
    } finally {
      setIsLoadingPosts(false);
    }
  };

  const fetchFollowers = async () => {
    setIsLoadingFollowers(true);
    try {
      const response = await mypageAPI.getFollowers({ limit: 100 });
      setFollowers(response.data);
    } catch (error) {
      console.error('Failed to fetch followers:', error);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const fetchFollowing = async () => {
    setIsLoadingFollowers(true);
    try {
      const response = await mypageAPI.getFollowing({ limit: 100 });
      setFollowing(response.data);
    } catch (error) {
      console.error('Failed to fetch following:', error);
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  const fetchStatsHistory = async () => {
    setIsLoadingStats(true);
    try {
      const response = await mypageAPI.getStatsHistory(30);
      setStatsHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch stats history:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleSaveBio = async () => {
    setIsSavingBio(true);
    try {
      await mypageAPI.updateBio(bioValue);
      setProfile(prev => prev ? { ...prev, bio: bioValue } : null);
      setIsEditingBio(false);
    } catch (error) {
      console.error('Failed to save bio:', error);
    } finally {
      setIsSavingBio(false);
    }
  };

  const handleAddSocialLink = () => {
    if (!newLinkUrl.trim()) return;

    const platform = detectPlatform(newLinkUrl);
    const newLink: SocialLink = {
      platform,
      url: newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`,
    };

    setSocialLinksValue([...socialLinksValue, newLink]);
    setNewLinkUrl('');
  };

  const handleRemoveSocialLink = (index: number) => {
    setSocialLinksValue(socialLinksValue.filter((_, i) => i !== index));
  };

  const handleSaveSocialLinks = async () => {
    setIsSavingSocialLinks(true);
    try {
      await mypageAPI.updateSocialLinks(socialLinksValue);
      setProfile(prev => prev ? { ...prev, social_links: socialLinksValue } : null);
      setIsEditingSocialLinks(false);
    } catch (error) {
      console.error('Failed to save social links:', error);
    } finally {
      setIsSavingSocialLinks(false);
    }
  };

  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    try {
      if (isCurrentlyFollowing) {
        await feedAPI.unfollowUser(userId);
      } else {
        await feedAPI.followUser(userId);
      }
      // Refresh the list
      if (showFollowersModal) {
        fetchFollowers();
      } else if (showFollowingModal) {
        fetchFollowing();
      }
      fetchProfile();
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    }
  };

  const handleOpenFollowers = () => {
    setShowFollowersModal(true);
    fetchFollowers();
  };

  const handleOpenFollowing = () => {
    setShowFollowingModal(true);
    fetchFollowing();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-github-gray-50 dark:bg-github-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.username}
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-2xl text-gray-500 dark:text-gray-400 font-medium">
                  {profile.username.charAt(0).toUpperCase()}
                </span>
              </div>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {profile.github_username || profile.username}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
                </div>
                <button
                  onClick={() => setShowProfilePreview(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Preview
                </button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <button
                  onClick={handleOpenFollowers}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <strong className="text-gray-900 dark:text-gray-100">{profile.stats.followers_count}</strong> followers
                </button>
                <button
                  onClick={handleOpenFollowing}
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  <strong className="text-gray-900 dark:text-gray-100">{profile.stats.following_count}</strong> following
                </button>
                <span className="text-gray-600 dark:text-gray-400">
                  <strong className="text-gray-900 dark:text-gray-100">{profile.stats.total_posts}</strong> posts
                </span>
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Bio</span>
              {!isEditingBio && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingBio ? (
              <div className="space-y-2">
                <textarea
                  value={bioValue}
                  onChange={(e) => setBioValue(e.target.value)}
                  placeholder="Write a short bio..."
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-500"
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveBio}
                    disabled={isSavingBio}
                    className="px-3 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isSavingBio ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingBio(false);
                      setBioValue(profile.bio || '');
                    }}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {profile.bio || <span className="text-gray-400 dark:text-gray-500 italic">No bio yet</span>}
              </p>
            )}
          </div>

          {/* Social Links */}
          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Links</span>
              {!isEditingSocialLinks && (
                <button
                  onClick={() => setIsEditingSocialLinks(true)}
                  className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Edit
                </button>
              )}
            </div>

            {isEditingSocialLinks ? (
              <div className="space-y-2">
                {socialLinksValue.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className={`p-1.5 rounded ${PLATFORM_STYLES[link.platform] || PLATFORM_STYLES.other}`}>
                      {PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other}
                    </span>
                    <span className="flex-1 text-sm text-gray-600 dark:text-gray-400 truncate">
                      {link.url}
                    </span>
                    <button
                      onClick={() => handleRemoveSocialLink(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add New Link */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newLinkUrl}
                    onChange={(e) => setNewLinkUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-300"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSocialLink()}
                  />
                  <button
                    onClick={handleAddSocialLink}
                    className="px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleSaveSocialLinks}
                    disabled={isSavingSocialLinks}
                    className="px-3 py-1 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50"
                  >
                    {isSavingSocialLinks ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingSocialLinks(false);
                      setSocialLinksValue(profile.social_links || []);
                    }}
                    className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {profile.is_github_connected && profile.github_username && (
                  <a
                    href={`https://github.com/${profile.github_username}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${PLATFORM_STYLES.github}`}
                  >
                    {PLATFORM_ICONS.github}
                    <span>{profile.github_username}</span>
                  </a>
                )}

                {profile.social_links?.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors ${PLATFORM_STYLES[link.platform] || PLATFORM_STYLES.other}`}
                  >
                    {PLATFORM_ICONS[link.platform] || PLATFORM_ICONS.other}
                    <span>{link.label || link.platform}</span>
                  </a>
                ))}

                {!profile.is_github_connected && (!profile.social_links || profile.social_links.length === 0) && (
                  <span className="text-sm text-gray-400 dark:text-gray-500 italic">No links added</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Charts */}
        <div className="mb-6">
          <StatsCharts
            statsHistory={statsHistory}
            isLoading={isLoadingStats}
            fallbackViews={profile.stats.total_views}
            fallbackLikes={profile.stats.total_likes_received}
          />
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'posts'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('liked')}
              className={`px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'liked'
                  ? 'text-gray-900 dark:text-gray-100 border-b-2 border-gray-900 dark:border-gray-100'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              Liked
            </button>
          </div>

          <div className="p-4">
            {isLoadingPosts ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : activeTab === 'posts' ? (
              myPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {myPosts.map(post => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      isLiked={false}
                      isAuthenticated={true}
                    />
                  ))}
                </div>
              )
            ) : (
              likedPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-500 dark:text-gray-400">No liked posts yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {likedPosts.map(post => (
                    <FeedCard
                      key={post.id}
                      post={post}
                      isLiked={true}
                      isAuthenticated={true}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Followers Modal */}
      {showFollowersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setShowFollowersModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full max-h-[70vh] overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Followers</span>
              <button onClick={() => setShowFollowersModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {isLoadingFollowers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : followers.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">No followers</p>
              ) : (
                followers.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm text-gray-500">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/blog/${user.username}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline">
                        {user.github_username || user.username}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    </div>
                    <button
                      onClick={() => handleFollowToggle(user.id, user.is_following)}
                      className={`px-2.5 py-1 text-xs rounded-md ${
                        user.is_following
                          ? 'border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400'
                          : 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900'
                      }`}
                    >
                      {user.is_following ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Following Modal */}
      {showFollowingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30" onClick={() => setShowFollowingModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-sm w-full max-h-[70vh] overflow-hidden shadow-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Following</span>
              <button onClick={() => setShowFollowingModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[55vh] p-3 space-y-2">
              {isLoadingFollowers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                </div>
              ) : following.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-8">Not following anyone</p>
              ) : (
                following.map(user => (
                  <div key={user.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.username} className="w-9 h-9 rounded-full" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-sm text-gray-500">{user.username.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <Link href={`/blog/${user.username}`} className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:underline">
                        {user.github_username || user.username}
                      </Link>
                      <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                    </div>
                    <button
                      onClick={() => handleFollowToggle(user.id, true)}
                      className="px-2.5 py-1 text-xs rounded-md border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                    >
                      Following
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Profile Preview Modal */}
      {showProfilePreview && profile && (
        <ProfilePreviewModal
          profile={profile}
          onClose={() => setShowProfilePreview(false)}
        />
      )}
    </div>
  );
}
