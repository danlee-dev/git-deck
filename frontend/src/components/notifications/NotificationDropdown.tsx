'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  Heart,
  MessageCircle,
  UserPlus,
  Reply,
  X,
  Check,
  Loader2,
  Send,
} from 'lucide-react';
import { notificationAPI, feedAPI } from '@/lib/api';
import { Notification, NotificationList } from '@/types/blog';
import { formatDistanceToNow } from 'date-fns';

interface NotificationDropdownProps {
  isAuthenticated: boolean;
}

export default function NotificationDropdown({ isAuthenticated }: NotificationDropdownProps) {
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const lastUnreadCount = useRef<number | null>(null); // null = not yet fetched
  const isInitialFetch = useRef(true);

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/sounds/notification.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await notificationAPI.getNotifications({ limit: 20 });
      setNotifications(response.data.notifications);
      const newUnreadCount = response.data.unread_count;

      // Play sound only if count increased from a known previous value (not on initial load)
      if (lastUnreadCount.current !== null && newUnreadCount > lastUnreadCount.current) {
        audioRef.current?.play().catch(() => {});
      }
      lastUnreadCount.current = newUnreadCount;
      setUnreadCount(newUnreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count periodically
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationAPI.getUnreadCount();
      const newCount = response.data.count;

      // Play sound only if count increased from a known previous value (not on initial load)
      if (!isInitialFetch.current && lastUnreadCount.current !== null && newCount > lastUnreadCount.current) {
        audioRef.current?.play().catch(() => {});
      }
      lastUnreadCount.current = newCount;
      setUnreadCount(newCount);
      isInitialFetch.current = false;
    } catch (error) {
      // Ignore errors for background polling
    }
  }, [isAuthenticated]);

  // Initial fetch and polling
  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000); // Poll every 10 seconds for near real-time
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, fetchUnreadCount]);

  // Fetch full notifications when dropdown opens
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchNotifications();
    }
  }, [isOpen, isAuthenticated, fetchNotifications]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setReplyingTo(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setReplyingTo(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      notificationAPI.markAsRead([notification.id]).catch(() => {});
      setNotifications(prev =>
        prev.map(n => (n.id === notification.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    // Navigate based on type
    if (notification.type === 'follow') {
      router.push(`/blog/${notification.actor.username}`);
    } else if (notification.post) {
      // Use the post author's username (the notification recipient owns the post)
      router.push(`/blog/${notification.post.author_username}/${notification.post.slug}`);
    }

    setIsOpen(false);
  };

  const handleReplyClick = (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    setReplyingTo(replyingTo === notificationId ? null : notificationId);
    setReplyContent('');
  };

  const handleSubmitReply = async (notification: Notification) => {
    // Prevent double submission
    if (!replyContent.trim() || !notification.comment || isSubmittingReply) return;

    const content = replyContent.trim();
    setIsSubmittingReply(true);
    setReplyContent(''); // Clear immediately to prevent double submit

    try {
      await feedAPI.createComment(notification.comment.post_id, {
        content,
        parent_id: notification.comment.id,
      });
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to submit reply:', error);
      setReplyContent(content); // Restore content on error
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const handleFollowBack = async (e: React.MouseEvent, notification: Notification) => {
    e.stopPropagation();
    const userId = notification.actor.id;

    if (notification.actor.is_following) return;

    setFollowLoading(userId);
    try {
      await feedAPI.followUser(userId);
      // Update notifications state to reflect the follow
      setNotifications(prev =>
        prev.map(n =>
          n.actor.id === userId
            ? { ...n, actor: { ...n.actor, is_following: true } }
            : n
        )
      );
    } catch (error) {
      console.error('Failed to follow back:', error);
    } finally {
      setFollowLoading(null);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'comment':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'reply':
        return <Reply className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationMessage = (notification: Notification) => {
    const actor = notification.actor.github_username || notification.actor.username;
    switch (notification.type) {
      case 'like':
        return (
          <>
            <strong>{actor}</strong> liked your post
            {notification.post && (
              <span className="text-gray-500"> "{notification.post.title}"</span>
            )}
          </>
        );
      case 'comment':
        return (
          <>
            <strong>{actor}</strong> commented on your post
            {notification.post && (
              <span className="text-gray-500"> "{notification.post.title}"</span>
            )}
          </>
        );
      case 'follow':
        return (
          <>
            <strong>{actor}</strong> started following you
          </>
        );
      case 'reply':
        return (
          <>
            <strong>{actor}</strong> replied to your comment
          </>
        );
      default:
        return 'New notification';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800" />
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[60vh]">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {notifications.map(notification => (
                  <div key={notification.id}>
                    <div
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors ${
                        !notification.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        {/* Avatar */}
                        {notification.actor.avatar_url ? (
                          <img
                            src={notification.actor.avatar_url}
                            alt={notification.actor.username}
                            className="w-10 h-10 rounded-full flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-gray-500">
                              {notification.actor.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                              {getNotificationMessage(notification)}
                            </p>
                          </div>

                          {/* Comment preview */}
                          {notification.comment && (
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic">
                              "{notification.comment.content}"
                            </p>
                          )}

                          {/* Timestamp and actions */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2">
                              {/* Reply button for comments/replies */}
                              {(notification.type === 'comment' || notification.type === 'reply') &&
                                notification.comment && (
                                  <button
                                    onClick={e => handleReplyClick(e, notification.id)}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                  >
                                    <Reply className="w-3 h-3" />
                                    Reply
                                  </button>
                                )}

                              {/* Follow back button */}
                              {notification.type === 'follow' && (
                                <button
                                  onClick={e => handleFollowBack(e, notification)}
                                  disabled={notification.actor.is_following || followLoading === notification.actor.id}
                                  className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                                    notification.actor.is_following
                                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                                      : 'bg-blue-600 text-white hover:bg-blue-700'
                                  }`}
                                >
                                  {followLoading === notification.actor.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : notification.actor.is_following ? (
                                    'Following'
                                  ) : (
                                    'Follow back'
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Unread indicator */}
                        {!notification.is_read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>

                    {/* Reply input */}
                    {replyingTo === notification.id && notification.comment && (
                      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={replyContent}
                            onChange={e => setReplyContent(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmitReply(notification);
                              }
                            }}
                          />
                          <button
                            onClick={() => handleSubmitReply(notification)}
                            disabled={!replyContent.trim() || isSubmittingReply}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmittingReply ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Send className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
