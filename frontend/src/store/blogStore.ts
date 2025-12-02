import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BlogFolder, BlogPost, GitHubRepo } from '@/types/blog';
import { api } from '@/lib/api';

interface BlogState {
  // Data
  folders: BlogFolder[];
  posts: BlogPost[];
  repos: GitHubRepo[];

  // Current editor state
  currentPostId: string | null;
  currentPost: BlogPost | null;
  isDirty: boolean;
  lastSavedAt: string | null;

  // UI state
  sidebarWidth: number;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFolders: (folders: BlogFolder[]) => void;
  setPosts: (posts: BlogPost[]) => void;
  setRepos: (repos: GitHubRepo[]) => void;
  setCurrentPost: (post: BlogPost | null) => void;
  setIsDirty: (isDirty: boolean) => void;
  setSidebarWidth: (width: number) => void;

  // API actions
  fetchFolders: () => Promise<void>;
  fetchPosts: () => Promise<void>;
  fetchRepos: () => Promise<void>;
  createFolder: (name: string, parentId: string | null) => Promise<BlogFolder>;
  updateFolder: (id: string, data: Partial<BlogFolder>) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  createPost: (data: Partial<BlogPost>) => Promise<BlogPost>;
  updatePost: (id: string, data: Partial<BlogPost>) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
  saveCurrentPost: () => Promise<void>;
  movePost: (postId: string, targetFolderId: string | null) => Promise<void>;
  moveFolder: (folderId: string, targetFolderId: string | null) => Promise<void>;
  getAllTags: () => string[];
  linkPostToRepo: (postId: string, repoId: string | null, repoName: string | null) => Promise<void>;
}

export const useBlogStore = create<BlogState>()(
  persist(
    (set, get) => ({
      // Initial state
      folders: [],
      posts: [],
      repos: [],
      currentPostId: null,
      currentPost: null,
      isDirty: false,
      lastSavedAt: null,
      sidebarWidth: 260,
      isLoading: false,
      error: null,

      // Basic setters
      setFolders: (folders) => set({ folders }),
      setPosts: (posts) => set({ posts }),
      setRepos: (repos) => set({ repos }),
      setCurrentPost: (post) => set({
        currentPost: post,
        currentPostId: post?.id || null,
        isDirty: false,
      }),
      setIsDirty: (isDirty) => set({ isDirty }),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),

      // API actions
      fetchFolders: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/blog/folders');
          set({ folders: response.data, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchPosts: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/blog/posts');
          set({ posts: response.data, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
        }
      },

      fetchRepos: async () => {
        try {
          const response = await api.get('/github/repositories');
          let repos = response.data;

          // If no repos found, try to sync from GitHub first
          if (repos.length === 0) {
            try {
              await api.post('/github/sync/repositories');
              const syncResponse = await api.get('/github/repositories');
              repos = syncResponse.data;
            } catch {
              // Sync might fail if GitHub not connected - that's ok
              console.log('Auto-sync skipped (GitHub may not be connected)');
            }
          }

          set({ repos });
        } catch (error: any) {
          console.error('Failed to fetch repos:', error);
        }
      },

      createFolder: async (name, parentId) => {
        const response = await api.post('/blog/folders', {
          name,
          parent_id: parentId,
        });
        const newFolder = response.data;
        set((state) => ({
          folders: [...state.folders, newFolder],
        }));
        return newFolder;
      },

      updateFolder: async (id, data) => {
        await api.patch(`/blog/folders/${id}`, data);
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === id ? { ...f, ...data } : f
          ),
        }));
      },

      deleteFolder: async (id) => {
        await api.delete(`/blog/folders/${id}`);
        set((state) => ({
          folders: state.folders.filter((f) => f.id !== id),
        }));
      },

      createPost: async (data) => {
        const title = data.title || 'Untitled';
        const slug = data.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}`;
        const response = await api.post('/blog/posts', {
          title,
          slug,
          content_md: data.content_md || '',
          content_blocks: data.content_blocks || [],
          folder_id: data.folder_id,
          status: 'draft',
        });
        const newPost = response.data;
        set((state) => ({
          posts: [...state.posts, newPost],
        }));
        return newPost;
      },

      updatePost: async (id, data) => {
        await api.patch(`/blog/posts/${id}`, data);
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === id ? { ...p, ...data } : p
          ),
          currentPost: state.currentPost?.id === id
            ? { ...state.currentPost, ...data }
            : state.currentPost,
          isDirty: false,
          lastSavedAt: new Date().toISOString(),
        }));
      },

      deletePost: async (id) => {
        await api.delete(`/blog/posts/${id}`);
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== id),
          currentPost: state.currentPost?.id === id ? null : state.currentPost,
          currentPostId: state.currentPostId === id ? null : state.currentPostId,
        }));
      },

      saveCurrentPost: async () => {
        const { currentPost, updatePost } = get();
        if (!currentPost) return;

        await updatePost(currentPost.id, {
          title: currentPost.title,
          content_md: currentPost.content_md,
          content_blocks: currentPost.content_blocks,
          excerpt: currentPost.excerpt,
          tags: currentPost.tags,
          status: currentPost.status,
        });
      },

      movePost: async (postId, targetFolderId) => {
        await api.patch(`/blog/posts/${postId}`, {
          folder_id: targetFolderId,
        });
        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId ? { ...p, folder_id: targetFolderId } : p
          ),
        }));
      },

      moveFolder: async (folderId, targetFolderId) => {
        await api.patch(`/blog/folders/${folderId}`, {
          parent_id: targetFolderId,
        });
        set((state) => ({
          folders: state.folders.map((f) =>
            f.id === folderId ? { ...f, parent_id: targetFolderId } : f
          ),
        }));
      },

      getAllTags: () => {
        const { posts } = get();
        const tagSet = new Set<string>();
        posts.forEach(post => {
          post.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
      },

      linkPostToRepo: async (postId, repoId, repoName) => {
        const { folders, createFolder, movePost } = get();

        if (!repoId || !repoName) {
          // Unlinking from repo - just update the post, don't move
          await api.patch(`/blog/posts/${postId}`, {
            github_repo_id: null,
          });
          set((state) => ({
            posts: state.posts.map((p) =>
              p.id === postId ? { ...p, github_repo_id: null } : p
            ),
          }));
          return;
        }

        // Find or create "GitHub" parent folder
        let githubFolder = folders.find(f => f.name === 'GitHub' && f.parent_id === null);
        if (!githubFolder) {
          githubFolder = await createFolder('GitHub', null);
        }

        // Find or create repo-specific folder under GitHub
        let repoFolder = folders.find(
          f => f.name === repoName && f.parent_id === githubFolder!.id
        );
        if (!repoFolder) {
          repoFolder = await createFolder(repoName, githubFolder.id);
        }

        // Update post with repo link and move to repo folder
        await api.patch(`/blog/posts/${postId}`, {
          github_repo_id: repoId,
          folder_id: repoFolder.id,
        });

        set((state) => ({
          posts: state.posts.map((p) =>
            p.id === postId
              ? { ...p, github_repo_id: repoId, folder_id: repoFolder!.id }
              : p
          ),
        }));
      },
    }),
    {
      name: 'blog-storage',
      partialize: (state) => ({
        sidebarWidth: state.sidebarWidth,
        currentPostId: state.currentPostId,
      }),
    }
  )
);
