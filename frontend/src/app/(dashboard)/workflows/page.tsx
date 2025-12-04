'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  Workflow,
  Clock,
  Trash2,
  Edit2,
  MoreVertical,
  FileCode,
  Loader2,
} from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { Workflow as WorkflowType } from '@/types/workflow';

// =============================================================================
// Workflows List Page
// =============================================================================

export default function WorkflowsPage() {
  const router = useRouter();
  const workflows = useWorkflowStore(state => state.workflows);
  const createWorkflow = useWorkflowStore(state => state.createWorkflow);
  const deleteWorkflow = useWorkflowStore(state => state.deleteWorkflow);
  const fetchWorkflows = useWorkflowStore(state => state.fetchWorkflows);
  const isLoading = useWorkflowStore(state => state.isLoading);
  const isSaving = useWorkflowStore(state => state.isSaving);
  const error = useWorkflowStore(state => state.error);

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [newWorkflowDescription, setNewWorkflowDescription] = useState('');

  // Fetch workflows on mount
  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const filteredWorkflows = workflows.filter(w =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newWorkflowName.trim()) return;

    try {
      const workflow = await createWorkflow(newWorkflowName.trim(), newWorkflowDescription.trim());
      setShowCreateModal(false);
      setNewWorkflowName('');
      setNewWorkflowDescription('');
      router.push(`/workflows/${workflow.id}`);
    } catch {
      // Error is handled in store
    }
  };

  const handleOpen = (workflow: WorkflowType) => {
    router.push(`/workflows/${workflow.id}`);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('이 워크플로우를 삭제하시겠습니까?')) {
      await deleteWorkflow(id);
    }
  };

  return (
    <div className="h-full overflow-auto bg-github-gray-50 dark:bg-github-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              워크플로우
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              GitHub Actions 워크플로우를 시각적으로 빌드하고 관리하세요
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
          >
            <Plus className="w-4 h-4" />
            새 워크플로우
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="워크플로우 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <EmptyState onCreateClick={() => setShowCreateModal(true)} hasSearch={!!searchQuery} />
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredWorkflows.map(workflow => (
              <WorkflowRow
                key={workflow.id}
                workflow={workflow}
                onOpen={() => handleOpen(workflow)}
                onDelete={e => handleDelete(e, workflow.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="w-full max-w-md p-5 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              워크플로우 생성
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  이름
                </label>
                <input
                  type="text"
                  value={newWorkflowName}
                  onChange={e => setNewWorkflowName(e.target.value)}
                  placeholder="CI/CD 파이프라인"
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  설명 (선택)
                </label>
                <textarea
                  value={newWorkflowDescription}
                  onChange={e => setNewWorkflowDescription(e.target.value)}
                  placeholder="빌드, 테스트, 배포"
                  rows={2}
                  className="w-full px-3 py-2 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewWorkflowName('');
                  setNewWorkflowDescription('');
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                취소
              </button>
              <button
                onClick={handleCreate}
                disabled={!newWorkflowName.trim()}
                className="px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Workflow Row
// =============================================================================

interface WorkflowRowProps {
  workflow: WorkflowType;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
}

function WorkflowRow({ workflow, onOpen, onDelete }: WorkflowRowProps) {
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="p-2 rounded bg-gray-100 dark:bg-gray-700">
          <FileCode className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {workflow.name}
            </span>
            {workflow.isDeployed && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded">
                배포됨
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            <span>{workflow.blocks.length}개 블록</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDate(workflow.updatedAt)}
            </span>
          </div>
        </div>
      </div>

      <div className="relative">
        <button
          onClick={e => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical className="w-4 h-4 text-gray-400" />
        </button>

        {showMenu && (
          <>
            <div className="fixed inset-0 z-10" onClick={e => { e.stopPropagation(); setShowMenu(false); }} />
            <div className="absolute right-0 top-full mt-1 w-32 py-1 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 z-20">
              <button
                onClick={e => { e.stopPropagation(); onOpen(); }}
                className="w-full px-3 py-1.5 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5" />
                편집
              </button>
              <button
                onClick={e => { setShowMenu(false); onDelete(e); }}
                className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Empty State
// =============================================================================

function EmptyState({ onCreateClick, hasSearch }: { onCreateClick: () => void; hasSearch: boolean }) {
  return (
    <div className="text-center py-12">
      <Workflow className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        {hasSearch ? '워크플로우를 찾을 수 없습니다' : '아직 워크플로우가 없습니다'}
      </p>
      {!hasSearch && (
        <button
          onClick={onCreateClick}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-md hover:bg-gray-800 dark:hover:bg-gray-200"
        >
          <Plus className="w-4 h-4" />
          워크플로우 생성
        </button>
      )}
    </div>
  );
}
