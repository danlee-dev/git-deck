import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8006';

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
    list: () => api.get('/posts'),
    create: (data: any) => api.post('/posts', data),
    get: (id: string) => api.get(`/posts/${id}`),
    update: (id: string, data: any) => api.put(`/posts/${id}`, data),
    delete: (id: string) => api.delete(`/posts/${id}`),
  },
  series: {
    list: () => api.get('/series'),
    create: (data: any) => api.post('/series', data),
    get: (id: string) => api.get(`/series/${id}`),
    update: (id: string, data: any) => api.put(`/series/${id}`, data),
    delete: (id: string) => api.delete(`/series/${id}`),
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

export default api;
