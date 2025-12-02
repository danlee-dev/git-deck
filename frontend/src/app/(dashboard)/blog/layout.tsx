'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import BlogSidebar from '@/components/blog-editor/BlogSidebar';
import { useBlogStore } from '@/store/blogStore';
import { BlogFolder, BlogPost, FolderTreeItem } from '@/types/blog';

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    folders,
    posts,
    fetchFolders,
    fetchPosts,
    createFolder,
    deleteFolder,
    updateFolder,
    createPost,
    deletePost,
    movePost,
    moveFolder,
    sidebarWidth,
    setSidebarWidth,
  } = useBlogStore();

  const [isResizing, setIsResizing] = useState(false);
  const [selectedId, setSelectedId] = useState<string | undefined>();

  // Fetch data on mount
  useEffect(() => {
    fetchFolders();
    fetchPosts();
  }, [fetchFolders, fetchPosts]);

  // Handle sidebar resize
  const handleMouseDown = useCallback(() => {
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = Math.max(200, Math.min(400, e.clientX));
      setSidebarWidth(newWidth);
    },
    [isResizing, setSidebarWidth]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  // Handle folder/post selection
  const handleSelect = (item: FolderTreeItem) => {
    setSelectedId(item.id);
    if (item.type === 'post') {
      router.push(`/blog/edit/${item.id}`);
    }
  };

  // Create new folder
  const handleCreateFolder = async (parentId: string | null) => {
    const name = prompt('Folder name:');
    if (!name) return;
    await createFolder(name, parentId);
  };

  // Create new post
  const handleCreatePost = async (folderId: string | null) => {
    const title = 'Untitled';
    const slug = `untitled-${Date.now()}`;
    const newPost = await createPost({
      title,
      slug,
      content_md: '',
      content_blocks: [],
      folder_id: folderId,
      status: 'draft',
    });
    router.push(`/blog/edit/${newPost.id}`);
  };

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Delete this folder? Posts will be moved to parent.')) return;
    await deleteFolder(folderId);
  };

  // Delete post
  const handleDeletePost = async (postId: string) => {
    if (!confirm('Delete this post?')) return;
    await deletePost(postId);
  };

  // Rename folder
  const handleRenameFolder = async (folderId: string, newName: string) => {
    await updateFolder(folderId, { name: newName });
  };

  // Move post to folder
  const handleMovePost = async (postId: string, targetFolderId: string | null) => {
    await movePost(postId, targetFolderId);
  };

  // Move folder to another folder
  const handleMoveFolder = async (folderId: string, targetFolderId: string | null) => {
    await moveFolder(folderId, targetFolderId);
  };

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -mt-6">
      {/* Sidebar */}
      <div
        className="flex-shrink-0 relative"
        style={{ width: sidebarWidth }}
      >
        <BlogSidebar
          folders={folders}
          posts={posts}
          selectedId={selectedId}
          onSelect={handleSelect}
          onCreateFolder={handleCreateFolder}
          onCreatePost={handleCreatePost}
          onDeleteFolder={handleDeleteFolder}
          onDeletePost={handleDeletePost}
          onRenameFolder={handleRenameFolder}
          onMovePost={handleMovePost}
          onMoveFolder={handleMoveFolder}
        />

        {/* Resize handle */}
        <div
          className="absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-blue-500/50 transition-colors"
          onMouseDown={handleMouseDown}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
