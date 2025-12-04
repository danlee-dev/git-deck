'use client';

import React, { memo, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import * as LucideIcons from 'lucide-react';
import { X, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { getBlockDefinition, BlockCategory, ExecutionStatus } from '@/types/workflow';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Types
// =============================================================================

interface WorkflowNodeData {
  type: string;
  config: Record<string, unknown>;
  label?: string;
}

// =============================================================================
// Status Indicator
// =============================================================================

function StatusIndicator({ status }: { status?: ExecutionStatus }) {
  if (!status || status === 'idle') return null;

  const statusStyles: Record<ExecutionStatus, string> = {
    idle: '',
    running: 'bg-blue-500 animate-pulse',
    success: 'bg-green-500',
    failure: 'bg-red-500',
    cancelled: 'bg-gray-500',
  };

  return (
    <div
      className={cn(
        'absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-800',
        statusStyles[status]
      )}
    />
  );
}

// =============================================================================
// Log Popup Component
// =============================================================================

interface LogPopupProps {
  status: ExecutionStatus;
  logs: string[];
  startedAt?: string;
  completedAt?: string;
  onClose: () => void;
}

function LogPopup({ status, logs, startedAt, completedAt, onClose }: LogPopupProps) {
  const statusConfig = {
    idle: { icon: Clock, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Idle' },
    running: { icon: Clock, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/50', label: 'Running' },
    success: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/50', label: 'Success' },
    failure: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/50', label: 'Failed' },
    cancelled: { icon: X, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-800', label: 'Cancelled' },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  const formatTime = (iso?: string) => {
    if (!iso) return '-';
    return new Date(iso).toLocaleTimeString();
  };

  return (
    <div
      className="absolute left-full ml-2 top-0 z-50 w-72 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={cn('flex items-center justify-between px-3 py-2 rounded-t-lg', config.bg)}>
        <div className="flex items-center gap-2">
          <StatusIcon className={cn('w-4 h-4', config.color)} />
          <span className={cn('text-sm font-medium', config.color)}>{config.label}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded"
        >
          <X className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>

      {/* Time Info */}
      <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="flex justify-between">
          <span>Started:</span>
          <span className="font-mono">{formatTime(startedAt)}</span>
        </div>
        <div className="flex justify-between">
          <span>Completed:</span>
          <span className="font-mono">{formatTime(completedAt)}</span>
        </div>
      </div>

      {/* Logs */}
      <div className="p-3 max-h-48 overflow-y-auto">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Logs</p>
        {logs.length > 0 ? (
          <div className="space-y-1">
            {logs.map((log, i) => (
              <div
                key={i}
                className={cn(
                  'text-xs font-mono px-2 py-1 rounded',
                  status === 'failure'
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-400'
                )}
              >
                {log}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">No logs</p>
        )}
      </div>
    </div>
  );
}

// =============================================================================
// Port Handle Component - Large clickable area
// =============================================================================

interface PortHandleProps {
  id: string;
  type: 'source' | 'target';
  position: Position;
  portType: string;
  index: number;
  total: number;
}

function PortHandle({ id, type, position, portType, index, total }: PortHandleProps) {
  const offset = total > 1 ? ((index + 1) / (total + 1)) * 100 : 50;

  const portColors: Record<string, string> = {
    trigger: '#10b981',
    job: '#3b82f6',
    data: '#8b5cf6',
    condition: '#f97316',
    any: '#6b7280',
  };

  const color = portColors[portType] || portColors.any;

  return (
    <Handle
      type={type}
      position={position}
      id={id}
      style={{
        width: 12,
        height: 12,
        background: color,
        border: '2px solid white',
        borderRadius: '50%',
        cursor: 'crosshair',
        top: position === Position.Left || position === Position.Right ? `${offset}%` : undefined,
        left: position === Position.Top || position === Position.Bottom ? `${offset}%` : undefined,
        zIndex: 10,
      }}
    />
  );
}

// =============================================================================
// Main Node Component
// =============================================================================

function WorkflowNodeComponent({ id, data, selected }: NodeProps) {
  const nodeData = data as unknown as WorkflowNodeData;
  const definition = useMemo(() => getBlockDefinition(nodeData.type), [nodeData.type]);
  const execution = useWorkflowStore(state => state.execution);
  const blockState = execution?.blockStates[id];
  const [showLogs, setShowLogs] = useState(false);

  if (!definition) {
    return (
      <div className="px-3 py-2 bg-red-50 dark:bg-red-900/50 rounded-md border border-red-300 dark:border-red-700 text-sm text-red-600 dark:text-red-400">
        Unknown: {nodeData.type}
      </div>
    );
  }

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon] || LucideIcons.Box;

  const categoryColors: Record<BlockCategory, string> = {
    trigger: 'border-green-300 dark:border-green-700',
    job: 'border-blue-300 dark:border-blue-700',
    action: 'border-purple-300 dark:border-purple-700',
    control: 'border-rose-300 dark:border-rose-700',
    integration: 'border-cyan-300 dark:border-cyan-700',
    utility: 'border-gray-300 dark:border-gray-600',
  };

  const iconBgColors: Record<BlockCategory, string> = {
    trigger: 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400',
    job: 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400',
    action: 'bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400',
    control: 'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400',
    integration: 'bg-cyan-100 dark:bg-cyan-900/50 text-cyan-600 dark:text-cyan-400',
    utility: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  const displayName = nodeData.label || definition.name;

  const configSummary = useMemo(() => {
    const entries = Object.entries(nodeData.config).filter(([, v]) => v !== '' && v !== undefined);
    if (entries.length === 0) return null;
    const [, value] = entries[0];
    const strValue = String(value);
    return strValue.length > 25 ? strValue.slice(0, 25) + '...' : strValue;
  }, [nodeData.config]);

  const hasExecutionInfo = blockState && blockState.status !== 'idle';

  const handleNodeClick = () => {
    if (hasExecutionInfo) {
      setShowLogs(!showLogs);
    }
  };

  return (
    <div
      className={cn(
        'relative min-w-[160px] max-w-[220px] rounded-lg border bg-white dark:bg-gray-800 transition-shadow',
        categoryColors[definition.category],
        selected && 'ring-2 ring-blue-500 shadow-md',
        blockState?.status === 'running' && 'ring-2 ring-blue-500',
        blockState?.status === 'success' && 'ring-2 ring-green-500',
        blockState?.status === 'failure' && 'ring-2 ring-red-500',
        hasExecutionInfo && 'cursor-pointer',
        'hover:shadow-md'
      )}
      onClick={handleNodeClick}
    >
      <StatusIndicator status={blockState?.status} />

      {/* Log Popup */}
      {showLogs && blockState && (
        <LogPopup
          status={blockState.status}
          logs={blockState.logs || []}
          startedAt={blockState.startedAt}
          completedAt={blockState.completedAt}
          onClose={() => setShowLogs(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
        <div className={cn('p-1.5 rounded', iconBgColors[definition.category])}>
          <IconComponent className="w-3.5 h-3.5" />
        </div>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
          {displayName}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {definition.description}
        </p>
        {configSummary && (
          <div className="mt-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 rounded text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
            {configSummary}
          </div>
        )}
      </div>

      {/* Input Handles - Left side */}
      {definition.inputs.map((input, index) => (
        <PortHandle
          key={input.id}
          id={input.id}
          type="target"
          position={Position.Left}
          portType={input.type}
          index={index}
          total={definition.inputs.length}
        />
      ))}

      {/* Output Handles - Right side */}
      {definition.outputs.map((output, index) => (
        <PortHandle
          key={output.id}
          id={output.id}
          type="source"
          position={Position.Right}
          portType={output.type}
          index={index}
          total={definition.outputs.length}
        />
      ))}
    </div>
  );
}

export const WorkflowNode = memo(WorkflowNodeComponent);

export const nodeTypes = {
  workflowNode: WorkflowNode,
};
