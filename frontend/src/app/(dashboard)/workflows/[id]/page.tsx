'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { WorkflowCanvas } from '@/components/workflow-builder/WorkflowCanvas';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Workflow Editor Page
// =============================================================================

export default function WorkflowEditorPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const currentWorkflow = useWorkflowStore(state => state.currentWorkflow);
  const loadWorkflow = useWorkflowStore(state => state.loadWorkflow);
  const isLoading = useWorkflowStore(state => state.isLoading);
  const error = useWorkflowStore(state => state.error);

  // Load workflow on mount
  useEffect(() => {
    if (workflowId && (!currentWorkflow || currentWorkflow.id !== workflowId)) {
      loadWorkflow(workflowId).catch(() => {
        // If load fails, redirect to list
        router.push('/workflows');
      });
    }
  }, [workflowId, currentWorkflow, loadWorkflow, router]);

  // Show loading if no workflow yet
  if (!currentWorkflow) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400">워크플로우 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-950 z-10">
      {/* Minimal Header */}
      <div className="h-11 flex items-center px-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        <button
          onClick={() => router.push('/workflows')}
          className={cn(
            'flex items-center gap-2 px-3 py-1.5 rounded-lg',
            'text-sm text-gray-600 dark:text-gray-400',
            'hover:bg-gray-100 dark:hover:bg-gray-800',
            'transition-colors duration-200'
          )}
        >
          <ArrowLeft className="w-4 h-4" />
          워크플로우 목록
        </button>
      </div>

      {/* Canvas - full remaining height */}
      <div className="flex-1 overflow-hidden">
        <WorkflowCanvas />
      </div>
    </div>
  );
}
