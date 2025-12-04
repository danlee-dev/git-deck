'use client';

import React, { useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import { Settings, Trash2, Copy, X } from 'lucide-react';
import { useWorkflowStore } from '@/store/workflowStore';
import { getBlockDefinition, ConfigField } from '@/types/workflow';
import { cn } from '@/lib/utils';

// =============================================================================
// Properties Panel
// =============================================================================

export function PropertiesPanel() {
  const selectedBlockId = useWorkflowStore(state => state.selectedBlockId);
  const currentWorkflow = useWorkflowStore(state => state.currentWorkflow);
  const updateBlockConfig = useWorkflowStore(state => state.updateBlockConfig);
  const updateBlockLabel = useWorkflowStore(state => state.updateBlockLabel);
  const removeBlock = useWorkflowStore(state => state.removeBlock);
  const duplicateBlock = useWorkflowStore(state => state.duplicateBlock);
  const clearSelection = useWorkflowStore(state => state.clearSelection);

  const selectedBlock = useMemo(() => {
    if (!selectedBlockId || !currentWorkflow) return null;
    return currentWorkflow.blocks.find(b => b.id === selectedBlockId);
  }, [selectedBlockId, currentWorkflow]);

  const definition = useMemo(() => {
    if (!selectedBlock) return null;
    return getBlockDefinition(selectedBlock.type);
  }, [selectedBlock]);

  if (!selectedBlock || !definition) {
    return (
      <div className="m-3 w-64 h-[calc(100%-24px)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col items-center justify-center p-6 text-center shadow-sm">
        <Settings className="w-8 h-8 text-gray-300 dark:text-gray-600 mb-3" />
        <p className="text-sm text-gray-400">Select a block to configure</p>
      </div>
    );
  }

  const IconComponent = (LucideIcons as unknown as Record<string, React.ComponentType<{ className?: string }>>)[definition.icon] || LucideIcons.Box;

  const handleConfigChange = (key: string, value: unknown) => {
    updateBlockConfig(selectedBlock.id, { [key]: value });
  };

  const handleLabelChange = (label: string) => {
    updateBlockLabel(selectedBlock.id, label);
  };

  const handleDelete = () => {
    removeBlock(selectedBlock.id);
  };

  const handleDuplicate = () => {
    duplicateBlock(selectedBlock.id);
  };

  return (
    <div className="m-3 w-64 h-[calc(100%-24px)] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg flex flex-col shadow-sm">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center w-6 h-6 rounded"
              style={{ backgroundColor: definition.color }}
            >
              <IconComponent className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {definition.name}
            </span>
          </div>
          <button
            onClick={clearSelection}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <X className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleDuplicate}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
          >
            <Copy className="w-3 h-3" />
            Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs font-medium text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
        </div>
      </div>

      {/* Config Fields */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Label</label>
          <input
            type="text"
            value={selectedBlock.label || ''}
            onChange={e => handleLabelChange(e.target.value)}
            placeholder={definition.name}
            className="w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600"
          />
        </div>

        {definition.configFields.map(field => (
          <ConfigFieldInput
            key={field.key}
            field={field}
            value={selectedBlock.config[field.key]}
            onChange={value => handleConfigChange(field.key, value)}
          />
        ))}
      </div>

    </div>
  );
}

// =============================================================================
// Config Field Input
// =============================================================================

interface ConfigFieldInputProps {
  field: ConfigField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function ConfigFieldInput({ field, value, onChange }: ConfigFieldInputProps) {
  const inputClass = "w-full px-2.5 py-1.5 text-sm rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 dark:focus:ring-gray-600";

  const renderInput = () => {
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            className={inputClass}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            value={(value as number) || ''}
            onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
            placeholder={field.placeholder}
            min={field.validation?.min}
            max={field.validation?.max}
            className={inputClass}
          />
        );

      case 'textarea':
      case 'code':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={field.type === 'code' ? 4 : 2}
            className={cn(inputClass, 'resize-none', field.type === 'code' && 'font-mono text-xs')}
          />
        );

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          >
            <option value="">Select...</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'multiselect':
        const selectedValues = (value as string[]) || [];
        return (
          <div className="space-y-0.5">
            {field.options?.map(option => (
              <label key={option.value} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={e => {
                    if (e.target.checked) {
                      onChange([...selectedValues, option.value]);
                    } else {
                      onChange(selectedValues.filter(v => v !== option.value));
                    }
                  }}
                  className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                />
                <span className="text-xs text-gray-700 dark:text-gray-300">{option.label}</span>
              </label>
            ))}
          </div>
        );

      case 'boolean':
        return (
          <button
            type="button"
            onClick={() => onChange(!value)}
            className={cn(
              'relative inline-flex h-5 w-9 items-center rounded-full transition-colors',
              value ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span className={cn(
              'inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform',
              value ? 'translate-x-4.5' : 'translate-x-0.5'
            )} />
          </button>
        );

      case 'secret':
        return (
          <div className="relative">
            <input
              type="text"
              value={(value as string) || ''}
              onChange={e => onChange(e.target.value)}
              placeholder={field.placeholder}
              className={cn(inputClass, 'font-mono text-xs pr-7')}
            />
            <LucideIcons.Key className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />
          </div>
        );

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={e => onChange(e.target.value)}
            className={inputClass}
          />
        );
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
        {field.label}
        {field.required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {field.description && (
        <p className="text-xs text-gray-400">{field.description}</p>
      )}
      {renderInput()}
    </div>
  );
}
