'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import * as LucideIcons from 'lucide-react';
import { Search, ChevronDown, ChevronRight, PanelLeftClose, PanelLeft } from 'lucide-react';
import {
  BLOCK_DEFINITIONS,
  CATEGORY_INFO,
  BlockCategory,
  BlockDefinition,
} from '@/types/workflow';
import { cn } from '@/lib/utils';

// =============================================================================
// Node Palette
// =============================================================================

interface NodePaletteProps {
  onDragStart?: (event: React.DragEvent, nodeType: string) => void;
}

export function NodePalette({ onDragStart }: NodePaletteProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'collapsing' | 'expanding'>('idle');
  const [expandedCategories, setExpandedCategories] = useState<Set<BlockCategory>>(
    new Set(['trigger', 'job'])
  );

  const blocksByCategory = useMemo(() => {
    const groups: Record<BlockCategory, BlockDefinition[]> = {
      trigger: [],
      job: [],
      action: [],
      control: [],
      integration: [],
      utility: [],
    };

    BLOCK_DEFINITIONS.forEach(block => {
      if (groups[block.category]) {
        groups[block.category].push(block);
      }
    });

    return groups;
  }, []);

  const filteredBlocks = useMemo(() => {
    if (!searchQuery.trim()) return blocksByCategory;

    const query = searchQuery.toLowerCase();
    const filtered: Record<BlockCategory, BlockDefinition[]> = {
      trigger: [],
      job: [],
      action: [],
      control: [],
      integration: [],
      utility: [],
    };

    Object.entries(blocksByCategory).forEach(([category, blocks]) => {
      filtered[category as BlockCategory] = blocks.filter(
        block =>
          block.name.toLowerCase().includes(query) ||
          block.description.toLowerCase().includes(query)
      );
    });

    return filtered;
  }, [blocksByCategory, searchQuery]);

  const toggleCategory = (category: BlockCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  const handleDragStart = (event: React.DragEvent, block: BlockDefinition) => {
    event.dataTransfer.setData('application/reactflow', block.type);
    event.dataTransfer.effectAllowed = 'move';
    onDragStart?.(event, block.type);
  };

  const handleCollapse = () => {
    setAnimationPhase('collapsing');
    setIsAnimating(true);
    setTimeout(() => {
      setIsCollapsed(true);
      setIsAnimating(false);
      setAnimationPhase('idle');
    }, 250);
  };

  const handleExpand = () => {
    setIsCollapsed(false);
    setAnimationPhase('expanding');
    setIsAnimating(true);
    setTimeout(() => {
      setIsAnimating(false);
      setAnimationPhase('idle');
    }, 250);
  };

  // Collapsed state - minimal floating button
  if (isCollapsed && animationPhase === 'idle') {
    return (
      <div className="shrink-0 py-3 pl-3">
        <button
          onClick={handleExpand}
          className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-md transition-all duration-200 hover:shadow-lg"
          title="Show blocks"
        >
          <PanelLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="shrink-0 h-full py-3 pl-3">
      {/* Panel - floating card style */}
      <div
        className={cn(
          'w-56 h-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col shadow-sm',
          animationPhase === 'collapsing' && 'animate-genie-collapse',
          animationPhase === 'expanding' && 'animate-genie-expand'
        )}
      >
        {/* Header */}
        <div className="p-2.5 border-b border-gray-200 dark:border-gray-700 shrink-0">
          <div className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Search blocks..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
              />
            </div>
            <button
              onClick={handleCollapse}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shrink-0"
              title="Hide blocks"
            >
              <PanelLeftClose className="w-3.5 h-3.5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Block Categories */}
        <div className="flex-1 overflow-y-auto py-1">
          {(Object.keys(CATEGORY_INFO) as BlockCategory[]).map(category => {
            const info = CATEGORY_INFO[category];
            const blocks = filteredBlocks[category];
            const isExpanded = expandedCategories.has(category);

            if (blocks.length === 0 && searchQuery) return null;

            return (
              <div key={category}>
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center gap-1.5 px-2.5 py-1 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3 h-3 text-gray-400" />
                  )}
                  <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {info.name}
                  </span>
                  <span className="text-[10px] text-gray-400 ml-auto">{blocks.length}</span>
                </button>

                {isExpanded && blocks.length > 0 && (
                  <div className="px-1.5 pb-0.5 space-y-px">
                    {blocks.map(block => (
                      <BlockItem
                        key={block.type}
                        block={block}
                        onDragStart={e => handleDragStart(e, block)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {searchQuery && Object.values(filteredBlocks).every(arr => arr.length === 0) && (
            <div className="px-3 py-6 text-center">
              <p className="text-xs text-gray-400">No blocks found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Block Item
// =============================================================================

interface BlockItemProps {
  block: BlockDefinition;
  onDragStart: (event: React.DragEvent) => void;
}

function BlockItem({ block, onDragStart }: BlockItemProps) {
  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[block.icon] || LucideIcons.Box;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded',
        'cursor-grab active:cursor-grabbing',
        'hover:bg-gray-100 dark:hover:bg-gray-700/50',
        'transition-colors'
      )}
    >
      <div
        className="flex items-center justify-center w-5 h-5 rounded shrink-0"
        style={{ backgroundColor: block.color }}
      >
        <IconComponent className="w-3 h-3 text-white" />
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 truncate">
        {block.name}
      </span>
    </div>
  );
}
