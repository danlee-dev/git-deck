'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class EditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Editor error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 bg-github-gray-50 dark:bg-github-gray-800 rounded-lg border border-github-gray-200 dark:border-github-gray-700">
          <div className="text-center">
            <h3 className="text-lg font-medium text-github-gray-900 dark:text-github-gray-100 mb-2">
              에디터 오류가 발생했습니다
            </h3>
            <p className="text-sm text-github-gray-600 dark:text-github-gray-400 mb-4">
              일시적인 오류입니다. 다시 시도해주세요.
            </p>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-github-blue text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              다시 시도
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
