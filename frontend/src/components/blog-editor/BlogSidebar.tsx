'use client';

import { useState, useCallback, DragEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FolderPlus,
  FilePlus,
  Trash2,
  Edit3,
  Search,
} from 'lucide-react';
import { BlogFolder, BlogPost, FolderTreeItem } from '@/types/blog';

interface BlogSidebarProps {
  folders: BlogFolder[];
  posts: BlogPost[];
  selectedId?: string;
  onSelect?: (item: FolderTreeItem) => void;
  onCreateFolder?: (parentId: string | null) => void;
  onCreatePost?: (folderId: string | null) => void;
  onDeleteFolder?: (folderId: string) => void;
  onDeletePost?: (postId: string) => void;
  onRenameFolder?: (folderId: string, newName: string) => void;
  onMovePost?: (postId: string, targetFolderId: string | null) => void;
  onMoveFolder?: (folderId: string, targetFolderId: string | null) => void;
}

export default function BlogSidebar({
  folders,
  posts,
  selectedId,
  onSelect,
  onCreateFolder,
  onCreatePost,
  onDeleteFolder,
  onDeletePost,
  onRenameFolder,
  onMovePost,
  onMoveFolder,
}: BlogSidebarProps) {
  const router = useRouter();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [draggingItem, setDraggingItem] = useState<FolderTreeItem | null>(null);

  // Build folder tree structure
  const buildTree = useCallback((): FolderTreeItem[] => {
    const folderMap = new Map<string | null, FolderTreeItem[]>();
    folderMap.set(null, []);

    folders.forEach(folder => {
      const parentId = folder.parent_id;
      if (!folderMap.has(parentId)) {
        folderMap.set(parentId, []);
      }

      const item: FolderTreeItem = {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        icon: folder.icon || 'folder',
        parent_id: folder.parent_id,
        is_expanded: expandedFolders.has(folder.id),
        children: [],
      };

      folderMap.get(parentId)!.push(item);
    });

    posts.forEach(post => {
      const folderId = post.folder_id;
      if (!folderMap.has(folderId)) {
        folderMap.set(folderId, []);
      }

      const item: FolderTreeItem = {
        id: post.id,
        name: post.title,
        type: 'post',
        icon: 'file',
        parent_id: folderId,
        post,
      };

      folderMap.get(folderId)!.push(item);
    });

    const buildSubtree = (parentId: string | null): FolderTreeItem[] => {
      const items = folderMap.get(parentId) || [];

      return items.map(item => {
        if (item.type === 'folder') {
          return {
            ...item,
            children: buildSubtree(item.id),
          };
        }
        return item;
      }).sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
    };

    return buildSubtree(null);
  }, [folders, posts, expandedFolders]);

  const tree = buildTree();

  // Filter tree based on search
  const filterTree = useCallback((items: FolderTreeItem[], query: string): FolderTreeItem[] => {
    if (!query) return items;

    const lowerQuery = query.toLowerCase();

    return items.reduce((acc: FolderTreeItem[], item) => {
      const matchesName = item.name.toLowerCase().includes(lowerQuery);
      const filteredChildren = item.children ? filterTree(item.children, query) : [];

      if (matchesName || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren,
          is_expanded: true,
        });
      }

      return acc;
    }, []);
  }, []);

  const filteredTree = filterTree(tree, searchQuery);

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // Handle item click
  const handleItemClick = (item: FolderTreeItem) => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else {
      onSelect?.(item);
      router.push(`/blog/edit/${item.id}`);
    }
  };

  // Start editing folder name
  const startEditing = (id: string, currentName: string) => {
    setEditingId(id);
    setEditValue(currentName);
    setContextMenuId(null);
  };

  // Save folder name
  const saveEdit = (id: string) => {
    if (editValue.trim() && onRenameFolder) {
      onRenameFolder(id, editValue.trim());
    }
    setEditingId(null);
    setEditValue('');
  };

  // Drag and Drop handlers
  const handleDragStart = (e: DragEvent, item: FolderTreeItem) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ id: item.id, type: item.type }));
    e.dataTransfer.effectAllowed = 'move';
    setDraggingItem(item);
  };

  const handleDragOver = (e: DragEvent, targetId: string | null) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverId(targetId);
  };

  const handleDragLeave = () => {
    setDragOverId(null);
  };

  const handleDrop = (e: DragEvent, targetFolderId: string | null) => {
    e.preventDefault();
    setDragOverId(null);

    try {
      const data = JSON.parse(e.dataTransfer.getData('text/plain'));
      const { id, type } = data;

      // Don't drop on itself
      if (id === targetFolderId) return;

      // Don't drop folder into its own children
      if (type === 'folder' && draggingItem) {
        const isChild = (folderId: string, potentialParentId: string | null): boolean => {
          if (!potentialParentId) return false;
          if (folderId === potentialParentId) return true;
          const parent = folders.find(f => f.id === potentialParentId);
          if (!parent) return false;
          return isChild(folderId, parent.parent_id);
        };
        if (targetFolderId && isChild(id, targetFolderId)) return;
      }

      if (type === 'post') {
        onMovePost?.(id, targetFolderId);
      } else if (type === 'folder') {
        onMoveFolder?.(id, targetFolderId);
      }
    } catch (error) {
      console.error('Drop error:', error);
    }

    setDraggingItem(null);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverId(null);
  };

  // Render tree item
  const renderItem = (item: FolderTreeItem, depth: number = 0) => {
    const isSelected = selectedId === item.id;
    const isEditing = editingId === item.id;
    const hasChildren = item.children && item.children.length > 0;
    const isDragOver = dragOverId === item.id;
    const isDragging = draggingItem?.id === item.id;

    return (
      <div key={item.id}>
        <div
          draggable={!isEditing}
          onDragStart={(e) => handleDragStart(e, item)}
          onDragOver={(e) => item.type === 'folder' ? handleDragOver(e, item.id) : undefined}
          onDragLeave={handleDragLeave}
          onDrop={(e) => item.type === 'folder' ? handleDrop(e, item.id) : undefined}
          onDragEnd={handleDragEnd}
          className={`
            group flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer
            transition-colors duration-150
            ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' : ''}
            ${!isSelected && !isDragOver && 'hover:bg-gray-100 dark:hover:bg-gray-800'}
            ${isDragOver && item.type === 'folder' ? 'bg-blue-50 dark:bg-blue-900/50 ring-2 ring-blue-400' : ''}
            ${isDragging ? 'opacity-50' : ''}
          `}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleItemClick(item)}
        >
          {/* Expand/Collapse icon for folders */}
          {item.type === 'folder' ? (
            <button
              className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(item.id);
              }}
            >
              {item.is_expanded || expandedFolders.has(item.id) ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-5" />
          )}

          {/* Icon */}
          {item.type === 'folder' ? (
            expandedFolders.has(item.id) ? (
              <FolderOpen className="w-4 h-4 text-yellow-500" />
            ) : (
              <Folder className="w-4 h-4 text-yellow-500" />
            )
          ) : (
            <FileText className="w-4 h-4 text-gray-500" />
          )}

          {/* Name or Edit Input */}
          {isEditing ? (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => saveEdit(item.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveEdit(item.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="flex-1 px-1 py-0.5 text-sm border border-blue-500 rounded outline-none bg-transparent"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="flex-1 text-sm truncate">{item.name}</span>
          )}

          {/* Status indicator for posts */}
          {item.type === 'post' && item.post && (
            <span
              className={`
                text-xs px-1.5 py-0.5 rounded
                ${item.post.status === 'published'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}
              `}
            >
              {item.post.status === 'published' ? 'P' : 'D'}
            </span>
          )}

          {/* Context menu button */}
          <button
            className="p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setContextMenuId(contextMenuId === item.id ? null : item.id);
            }}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Context Menu */}
        {contextMenuId === item.id && (
          <div
            className="ml-8 mt-1 mb-1 py-1 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg z-10"
            style={{ marginLeft: `${depth * 16 + 32}px` }}
          >
            {item.type === 'folder' && (
              <>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreateFolder?.(item.id);
                    setContextMenuId(null);
                  }}
                >
                  <FolderPlus className="w-4 h-4" />
                  New Subfolder
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCreatePost?.(item.id);
                    setContextMenuId(null);
                  }}
                >
                  <FilePlus className="w-4 h-4" />
                  New Post
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditing(item.id, item.name);
                  }}
                >
                  <Edit3 className="w-4 h-4" />
                  Rename
                </button>
                <button
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteFolder?.(item.id);
                    setContextMenuId(null);
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </>
            )}
            {item.type === 'post' && (
              <button
                className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePost?.(item.id);
                  setContextMenuId(null);
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            )}
          </div>
        )}

        {/* Children */}
        {hasChildren && (item.is_expanded || expandedFolders.has(item.id)) && (
          <div>
            {item.children!.map(child => renderItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Blog</h2>
          <div className="flex gap-1">
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => onCreateFolder?.(null)}
              title="New Folder"
            >
              <FolderPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <button
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              onClick={() => onCreatePost?.(null)}
              title="New Post"
            >
              <FilePlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm bg-black/5 dark:bg-white/5 border-0 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>

      {/* Tree - Root drop zone */}
      <div
        className={`flex-1 overflow-y-auto p-2 ${dragOverId === 'root' ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
        onDragOver={(e) => handleDragOver(e, 'root')}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, null)}
      >
        {filteredTree.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            {searchQuery ? 'No results found' : 'No posts yet'}
          </div>
        ) : (
          filteredTree.map(item => renderItem(item))
        )}
      </div>
    </div>
  );
}
