export interface BlogFolder {
  id: string;
  user_id: string;
  parent_id: string | null;
  name: string;
  icon: string;
  order_index: number;
  is_expanded: boolean;
  created_at: string;
  updated_at: string;
  children?: BlogFolder[];
  posts?: BlogPost[];
}

export interface BlogPost {
  id: string;
  user_id: string;
  series_id: string | null;
  folder_id: string | null;
  title: string;
  slug: string;
  content_md: string;
  content_blocks: any[] | null;
  excerpt: string | null;
  cover_image: string | null;
  tags: string[] | null;
  status: 'draft' | 'published' | 'archived';
  published_at: string | null;
  view_count: number;
  likes_count: number;
  github_repo_id: string | null;
  github_path: string | null;
  github_sha: string | null;
  created_at: string;
  updated_at: string;
}

// Public API types
export interface AuthorPublic {
  id: string;
  username: string;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export interface BlogPostPublic {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  cover_image: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
  view_count: number;
  likes_count: number;
  comments_count: number;
  created_at: string;
  author: AuthorPublic;
}

export interface BlogPostDetailPublic extends BlogPostPublic {
  content_md: string;
  content_blocks: any[] | null;
  github_repo_id: string | null;
}

// Social link type (moved up for use in UserPublicProfile)
export interface SocialLink {
  platform: string;
  url: string;
  label?: string;
}

export interface UserPublicProfile {
  id: string;
  username: string;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  social_links: SocialLink[] | null;
  is_github_connected: boolean;
  created_at: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
  is_following: boolean;
}

export interface BlogSeries {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface GitHubRepo {
  id: string;
  github_repo_id: string;
  name: string;
  full_name: string;
  description: string | null;
  url: string;
  language: string | null;
  stars_count: number;
  forks_count: number;
  is_private: boolean;
  topics: string[] | null;
}

export interface FolderTreeItem {
  id: string;
  name: string;
  type: 'folder' | 'post';
  icon: string;
  parent_id: string | null;
  is_expanded?: boolean;
  children?: FolderTreeItem[];
  post?: BlogPost;
}

// My Page types
export interface UserStats {
  total_posts: number;
  total_views: number;
  total_likes_received: number;
  total_likes_given: number;
  followers_count: number;
  following_count: number;
}

export interface MyPageProfile {
  id: string;
  username: string;
  email: string;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  social_links: SocialLink[] | null;
  is_github_connected: boolean;
  created_at: string;
  stats: UserStats;
}

export interface FollowerUser {
  id: string;
  username: string;
  github_username: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
}

// Comment types
export interface CommentAuthor {
  id: string;
  username: string;
  github_username: string | null;
  avatar_url: string | null;
}

export interface Comment {
  id: string;
  content: string;
  author: CommentAuthor;
  parent_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

// Stats History types
export interface DailyStats {
  date: string;
  views: number;
  likes: number;
  comments: number;
}

export interface StatsHistory {
  daily_stats: DailyStats[];
  total_views: number;
  total_likes: number;
  total_comments: number;
}

// Notification types
export interface NotificationActor {
  id: string;
  username: string;
  github_username: string | null;
  avatar_url: string | null;
  is_following: boolean;
}

export interface NotificationPost {
  id: string;
  title: string;
  slug: string;
  author_username: string;
}

export interface NotificationComment {
  id: string;
  content: string;
  post_id: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'reply';
  actor: NotificationActor;
  post: NotificationPost | null;
  comment: NotificationComment | null;
  is_read: boolean;
  created_at: string;
}

export interface NotificationList {
  notifications: Notification[];
  unread_count: number;
  total_count: number;
}
