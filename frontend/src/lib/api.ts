import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006';

// Helper to format image URLs with proper backend prefix
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // If already absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Prefix with API URL for relative paths
  return `${API_URL}${url}`;
}

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  connectGithub: (code: string) =>
    api.post('/auth/connect-github', null, { params: { code } }),
  deleteAccount: () => api.delete('/auth/account'),
  restoreAccount: (data: { email: string; password: string }) =>
    api.post('/auth/account/restore', data),
};

// Users API
export const usersAPI = {
  list: () => api.get('/users'),
  get: (id: string) => api.get(`/users/${id}`),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Profiles API
export const profilesAPI = {
  list: () => api.get('/profiles'),
  create: (data: any) => api.post('/profiles', data),
  get: (id: string) => api.get(`/profiles/${id}`),
  update: (id: string, data: any) => api.put(`/profiles/${id}`, data),
  delete: (id: string) => api.delete(`/profiles/${id}`),
  syncToReadme: (id: string) => api.post(`/profiles/${id}/sync-to-readme`),
};

// Blocks API
export const blocksAPI = {
  list: () => api.get('/blocks'),
  create: (data: any) => api.post('/blocks', data),
  update: (id: string, data: any) => api.put(`/blocks/${id}`, data),
  delete: (id: string) => api.delete(`/blocks/${id}`),
  saveToGithub: (data: {
    blocks: any[];
    markdown_content: string;
    repo_owner: string;
    repo_name: string;
    last_known_sha?: string | null;
  }) => api.post('/blocks/save-to-github', data),
  loadFromGithub: (repo_owner: string, repo_name: string) =>
    api.get('/blocks/load-from-github', { params: { repo_owner, repo_name } }),
  renderMarkdown: (data: {
    markdown: string;
    repo_owner: string;
    repo_name: string;
  }) => api.post('/blocks/render-markdown', data),
};

// Blog API
export const blogAPI = {
  posts: {
    list: (params?: { folder_id?: string; status?: string }) =>
      api.get('/blog/posts', { params }),
    create: (data: any) => api.post('/blog/posts', data),
    get: (id: string) => api.get(`/blog/posts/${id}`),
    update: (id: string, data: any) => api.patch(`/blog/posts/${id}`, data),
    delete: (id: string) => api.delete(`/blog/posts/${id}`),
  },
  folders: {
    list: () => api.get('/blog/folders'),
    create: (data: any) => api.post('/blog/folders', data),
    get: (id: string) => api.get(`/blog/folders/${id}`),
    update: (id: string, data: any) => api.patch(`/blog/folders/${id}`, data),
    delete: (id: string) => api.delete(`/blog/folders/${id}`),
  },
  series: {
    list: () => api.get('/blog/series'),
    create: (data: any) => api.post('/blog/series', data),
    get: (id: string) => api.get(`/blog/series/${id}`),
    update: (id: string, data: any) => api.patch(`/blog/series/${id}`, data),
    delete: (id: string) => api.delete(`/blog/series/${id}`),
  },
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/blog/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// GitHub API
export const githubAPI = {
  syncRepositories: () => api.post('/github/sync/repositories'),
  listRepositories: () => api.get('/github/repositories'),
  getRepository: (id: string) => api.get(`/github/repositories/${id}`),
  getReadme: (owner: string, repo: string) =>
    api.get(`/github/readme/${owner}/${repo}`),
  syncHistory: () => api.get('/github/sync/history'),
};

// My Page API
export const mypageAPI = {
  getMyPage: () => api.get('/mypage/me'),
  updateBio: (bio: string) => api.patch('/mypage/me/bio', { bio }),
  updateSocialLinks: (social_links: { platform: string; url: string; label?: string }[]) =>
    api.put('/mypage/me/social-links', { social_links }),
  getMyPosts: (params?: { status?: string; page?: number; limit?: number }) =>
    api.get('/mypage/me/posts', { params }),
  getLikedPosts: (params?: { page?: number; limit?: number }) =>
    api.get('/mypage/me/liked-posts', { params }),
  getFollowers: (params?: { page?: number; limit?: number }) =>
    api.get('/mypage/me/followers', { params }),
  getFollowing: (params?: { page?: number; limit?: number }) =>
    api.get('/mypage/me/following', { params }),
  getStats: () => api.get('/mypage/me/stats'),
  getStatsHistory: (days?: number) =>
    api.get('/mypage/me/stats/history', { params: { days } }),
};

// Public Feed API
export const feedAPI = {
  // Feed
  getFeed: (params?: { sort_by?: string; page?: number; limit?: number }) =>
    api.get('/public/feed', { params }),
  getLikedPosts: (params?: { page?: number; limit?: number }) =>
    api.get('/public/feed/liked', { params }),

  // User profiles
  getUserProfile: (username: string) =>
    api.get(`/public/users/${username}`),
  getUserPosts: (username: string, params?: { page?: number; limit?: number }) =>
    api.get(`/public/users/${username}/posts`, { params }),
  getUserPost: (username: string, slug: string) =>
    api.get(`/public/users/${username}/posts/${slug}`),

  // Likes
  likePost: (postId: string) =>
    api.post(`/public/posts/${postId}/like`),
  unlikePost: (postId: string) =>
    api.delete(`/public/posts/${postId}/like`),
  checkLiked: (postId: string) =>
    api.get(`/public/posts/${postId}/liked`),

  // Follows
  followUser: (userId: string) =>
    api.post(`/public/users/${userId}/follow`),
  unfollowUser: (userId: string) =>
    api.delete(`/public/users/${userId}/follow`),
  getFollowers: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/public/users/${userId}/followers`, { params }),
  getFollowing: (userId: string, params?: { page?: number; limit?: number }) =>
    api.get(`/public/users/${userId}/following`, { params }),

  // Bio
  updateBio: (bio: string) =>
    api.patch('/public/users/me/bio', { bio }),

  // Comments
  getPostComments: (postId: string) =>
    api.get(`/public/posts/${postId}/comments`),
  createComment: (postId: string, data: { content: string; parent_id?: string }) =>
    api.post(`/public/posts/${postId}/comments`, data),
  updateComment: (commentId: string, data: { content: string }) =>
    api.patch(`/public/comments/${commentId}`, data),
  deleteComment: (commentId: string) =>
    api.delete(`/public/comments/${commentId}`),
};

// Notifications API
export const notificationAPI = {
  getNotifications: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    api.get('/notifications', { params }),
  getUnreadCount: () =>
    api.get('/notifications/unread-count'),
  markAsRead: (notificationIds?: string[]) =>
    api.post('/notifications/mark-read', { notification_ids: notificationIds }),
  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
};

export default api;
