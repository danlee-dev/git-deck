'use client';

import React, { memo } from 'react';
import {
  EdgeProps,
  getBezierPath,
  EdgeLabelRenderer,
  useReactFlow,
} from '@xyflow/react';
import { X } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { cn } from '@/lib/utils';

// =============================================================================
// Animated Edge with Subtle Flowing Effect
// =============================================================================

interface AnimatedEdgeProps extends EdgeProps {
  data?: {
    portType?: string;
  };
}

function AnimatedEdgeComponent({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  data,
}: AnimatedEdgeProps) {
  const { setEdges } = useReactFlow();
  const execution = useWorkflowStore(state => state.execution);
  const removeConnection = useWorkflowStore(state => state.removeConnection);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: 0.25,
  });

  const portType = data?.portType || 'job';
  const edgeColors: Record<string, { stroke: string; particle: string }> = {
    trigger: { stroke: '#10b981', particle: '#34d399' },
    job: { stroke: '#3b82f6', particle: '#60a5fa' },
    data: { stroke: '#8b5cf6', particle: '#a78bfa' },
    condition: { stroke: '#f97316', particle: '#fb923c' },
    any: { stroke: '#9ca3af', particle: '#d1d5db' },
  };

  const colors = edgeColors[portType] || edgeColors.job;
  const isExecuting = execution?.status === 'running';

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    removeConnection(id);
    setEdges(edges => edges.filter(edge => edge.id !== id));
  };

  const pathLength = Math.sqrt(
    Math.pow(targetX - sourceX, 2) + Math.pow(targetY - sourceY, 2)
  );

  return (
    <>
      {/* Main edge path */}
      <path
        d={edgePath}
        fill="none"
        stroke={colors.stroke}
        strokeWidth={selected ? 2.5 : 1.5}
        strokeOpacity={0.6}
        style={{ strokeLinecap: 'round' }}
      />

      {/* Flowing particle */}
      <defs>
        <linearGradient id={`gradient-${id}`} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="transparent" />
          <stop offset="45%" stopColor={colors.particle} />
          <stop offset="55%" stopColor={colors.particle} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>

      <path
        d={edgePath}
        fill="none"
        stroke={`url(#gradient-${id})`}
        strokeWidth={selected ? 3 : 2}
        strokeLinecap="round"
        style={{
          strokeDasharray: `${pathLength * 0.12} ${pathLength * 0.88}`,
          animation: `flowingLight-${id} ${isExecuting ? 0.8 : 2.5}s linear infinite`,
          strokeDashoffset: pathLength,
        }}
      />

      {/* Delete button on selection */}
      {selected && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            <button
              onClick={handleDelete}
              className="flex items-center justify-center w-5 h-5 rounded-full bg-red-500 hover:bg-red-600 text-white shadow transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </EdgeLabelRenderer>
      )}

      <style>{`
        @keyframes flowingLight-${id} {
          0% { stroke-dashoffset: ${pathLength}; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </>
  );
}

export const AnimatedEdge = memo(AnimatedEdgeComponent);

export const edgeTypes = {
  animated: AnimatedEdge,
};

// =============================================================================
// Connection Line (while dragging)
// =============================================================================

interface ConnectionLineProps {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  fromPosition: any;
  toPosition: any;
}

export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineProps) {
  const [edgePath] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    sourcePosition: fromPosition,
    targetX: toX,
    targetY: toY,
    targetPosition: toPosition,
    curvature: 0.25,
  });

  return (
    <g>
      <path
        d={edgePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeOpacity={0.7}
      />
      <circle cx={toX} cy={toY} r={4} fill="#3b82f6" />
    </g>
  );
}
