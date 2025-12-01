'use client';

import { AlertTriangle } from 'lucide-react';

interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOverwrite: () => void;
  onCancel: () => void;
  currentContent: string;
}

export default function ConflictModal({
  isOpen,
  onClose,
  onOverwrite,
  onCancel,
  currentContent,
}: ConflictModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-github-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-start gap-4 mb-6">
          <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-xl font-semibold text-github-gray-900 dark:text-github-gray-100 mb-2">
              Merge Conflict Detected
            </h2>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400">
              The GitHub README has been modified since your last sync. Choose how to proceed:
            </p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
            Current GitHub README:
          </h3>
          <div className="bg-github-gray-50 dark:bg-github-gray-900 rounded-md p-4 max-h-60 overflow-y-auto">
            <pre className="text-xs text-github-gray-700 dark:text-github-gray-300 whitespace-pre-wrap">
              {currentContent}
            </pre>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onOverwrite}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm font-medium transition-colors"
          >
            Overwrite (Use My Changes)
          </button>
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-github-gray-100 dark:bg-github-gray-700 hover:bg-github-gray-200 dark:hover:bg-github-gray-600 text-github-gray-900 dark:text-github-gray-100 rounded-md text-sm font-medium transition-colors"
          >
            Cancel (Keep GitHub Version)
          </button>
        </div>

        <p className="text-xs text-github-gray-500 dark:text-github-gray-400 mt-4 text-center">
          Tip: Pull from GitHub first to see the latest changes before overwriting
        </p>
      </div>
    </div>
  );
}
